import { useEffect, useState } from "react";
import {
  createApplication,
  getApplicationById,
  getApplications,
  getAdminApplications,
  getMyApplications,
  submitApplication,
  withdrawApplication,
  deleteDraftApplication,
  updateApplication,
  uploadApplicationDocument,
  downloadApplicationDocument,
} from "../services/grantApplicationService";
import { getSchemes } from "../services/schemeService";
import "../styles/GrantApplicationManagement.css";

const APPLICATION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_VERIFICATION",
  "FIELD_VERIFICATION",
  "DISTRICT_REVIEW",
  "STATE_REVIEW",
  "NEEDS_CORRECTION",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
];
const ADMIN_PAGE_SIZE = 20;

const emptyForm = {
  schemeId: "",
  applicationDetails: "",
  requestedAmount: "",
  eligibilityAnswers: {},
};

function getEditableEligibilityAnswers(application, scheme) {
  const results =
    application.eligibilityEvaluation?.customQuestionResults || [];
  const usedResults = new Set();
  return Object.fromEntries(
    (scheme?.eligibilityQuestions || []).flatMap((question) => {
      const resultIndex = results.findIndex(
        (result, index) =>
          !usedResults.has(index) &&
          (result.questionId === question.id ||
            result.questionText === question.questionText) &&
          (question.answerOptions || []).some(
            (option) => option.value === result.answerValue
          )
      );
      if (resultIndex === -1) {
        return [];
      }
      usedResults.add(resultIndex);
      return [[question.id, results[resultIndex].answerValue]];
    })
  );
}

function GrantApplicationManagement() {
  const role = localStorage.getItem("role");
  const isBeneficiary = role === "BENEFICIARY";
  const isAdmin = role === "ADMIN";
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    totalPages: 0,
    totalElements: 0,
  });
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [documents, setDocuments] = useState([]);
  const [documentPreview, setDocumentPreview] = useState(null);

  const loadApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const [applicationsResponse, schemesResponse] = await Promise.all([
        isBeneficiary
          ? getMyApplications()
          : isAdmin
            ? getAdminApplications({
                page,
                size: ADMIN_PAGE_SIZE,
                ...(statusFilter ? { status: statusFilter } : {}),
              })
            : getApplications(),
        isBeneficiary ? getSchemes() : Promise.resolve({ data: [] }),
      ]);
      if (isAdmin) {
        setApplications(applicationsResponse.data.content);
        setPageInfo({
          totalPages: applicationsResponse.data.totalPages,
          totalElements: applicationsResponse.data.totalElements,
        });
      } else {
        setApplications(applicationsResponse.data);
      }
      setSchemes(schemesResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load grant applications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    const refreshOnFocus = () => loadApplications();
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [isAdmin, isBeneficiary, page, statusFilter]);

  useEffect(
    () => () => {
      if (documentPreview?.url) URL.revokeObjectURL(documentPreview.url);
    },
    [documentPreview?.url]
  );

  const availableSchemes = schemes.filter(
    (scheme) => scheme.status === "ACTIVE"
  );
  const selectedScheme = schemes.find(
    (scheme) => String(scheme.id) === form.schemeId
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "schemeId" ? { eligibilityAnswers: {} } : {}),
    }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm, eligibilityAnswers: {} });
    setEditingId(null);
    setEditingStatus(null);
    setDocuments([]);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const shouldSubmit = event.nativeEvent.submitter?.value === "submit";
    if (
      shouldSubmit &&
      !window.confirm(
        editingStatus === "NEEDS_CORRECTION"
          ? "Resubmit this application with the corrected information?"
          : "Submit this grant application for verification?"
      )
    ) {
      return;
    }
    setSaving(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const payload = {
        applicationDetails: form.applicationDetails.trim(),
        requestedAmount: Number(form.requestedAmount),
        eligibilityAnswers: Object.entries(form.eligibilityAnswers)
          .filter(([, answer]) => answer !== "")
          .map(([questionId, answer]) => ({
            questionId: Number(questionId),
            answer,
          })),
      };
      let savedApplication;

      if (editingId) {
        savedApplication = (
          await updateApplication(editingId, payload)
        ).data;
      } else {
        savedApplication = (
          await createApplication({
            ...payload,
            schemeId: Number(form.schemeId),
          })
        ).data;
      }

      for (const document of documents) {
        await uploadApplicationDocument(savedApplication.id, document);
      }

      if (shouldSubmit) {
        try {
          savedApplication = (
            await submitApplication(savedApplication.id)
          ).data;
        } catch (err) {
          setActionError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              "Draft saved, but submission failed."
          );
          await loadApplications();
          await handleViewDetails(savedApplication.id);
          return;
        }
      }

      setSuccessMessage(
        shouldSubmit
          ? editingStatus === "NEEDS_CORRECTION"
            ? "Corrected application resubmitted successfully."
            : "Grant application submitted successfully."
          : editingId
            ? editingStatus === "NEEDS_CORRECTION"
              ? "Corrections saved successfully."
              : "Draft updated successfully."
            : "Application draft saved successfully."
      );
      resetForm();
      await loadApplications();
      if (savedApplication?.id) {
        await handleViewDetails(savedApplication.id);
      }
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to save grant application."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = async (id) => {
    setSelectedApplicationId(id);
    setSelectedApplication(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const response = await getApplicationById(id);
      setSelectedApplication(response.data);
    } catch (err) {
      setDetailsError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load application details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEdit = (application) => {
    const scheme = schemes.find((item) => item.id === application.schemeId);
    setEditingId(application.id);
    setEditingStatus(application.status);
    setDocuments([]);
    setForm({
      schemeId: String(application.schemeId),
      applicationDetails: application.applicationDetails,
      requestedAmount: String(application.requestedAmount),
      eligibilityAnswers: getEditableEligibilityAnswers(application, scheme),
    });
    setActionError("");
    setSuccessMessage("");
  };

  const handleSubmitDraft = async (application) => {
    const isCorrection = application.status === "NEEDS_CORRECTION";
    if (
      !window.confirm(
        isCorrection
          ? "Resubmit this application with its saved corrected information?"
          : "Submit this grant application for verification?"
      )
    ) {
      return;
    }
    setActionError("");
    setSuccessMessage("");

    try {
      await submitApplication(application.id);
      setSuccessMessage(
        isCorrection
          ? "Corrected application resubmitted successfully."
          : "Grant application submitted successfully."
      );
      await loadApplications();
      await handleViewDetails(application.id);
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to submit grant application."
      );
    }
  };

  const handleDeleteDraft = async (application) => {
    if (!window.confirm("Permanently delete this draft application?")) return;
    setActionError("");
    setSuccessMessage("");
    try {
      await deleteDraftApplication(application.id);
      setSuccessMessage("Draft application deleted successfully.");
      if (selectedApplication?.id === application.id) {
        setSelectedApplication(null);
      }
      await loadApplications();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to delete draft application."
      );
    }
  };

  const handleWithdraw = async (application) => {
    if (
      !window.confirm(
        "Withdraw this application? This action cannot be undone."
      )
    ) {
      return;
    }
    setActionError("");
    setSuccessMessage("");
    try {
      await withdrawApplication(application.id);
      setSuccessMessage("Application withdrawn successfully.");
      await loadApplications();
      await handleViewDetails(application.id);
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to withdraw this application."
      );
    }
  };

  const handleDocumentDownload = async (applicationId, document) => {
    try {
      const response = await downloadApplicationDocument(applicationId, document.id);
      const url = URL.createObjectURL(response.data);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setDetailsError(
        err.response?.data?.message ||
          "Unable to download the application document."
      );
    }
  };

  const handleDocumentPreview = async (applicationId, document) => {
    setDetailsError("");
    try {
      const response = await downloadApplicationDocument(applicationId, document.id);
      const url = URL.createObjectURL(response.data);
      setDocumentPreview({
        url,
        contentType: document.contentType,
        fileName: document.fileName,
      });
    } catch (err) {
      setDetailsError(
        err.response?.data?.message ||
          "Unable to open the application document."
      );
    }
  };

  const closeDocumentPreview = () => {
    if (documentPreview?.url) URL.revokeObjectURL(documentPreview.url);
    setDocumentPreview(null);
  };

  const handleRefresh = async () => {
    await loadApplications();
    if (selectedApplication?.id) {
      await handleViewDetails(selectedApplication.id);
    }
  };

  return (
    <section
      className="grant-applications"
      aria-labelledby="grant-applications-heading"
    >
      <div className="grant-applications__heading">
        <div>
          <h2 id="grant-applications-heading">Grant applications</h2>
          <p>
            {isBeneficiary
              ? "Apply for a scheme and track your applications."
              : "Review grant applications and their current status."}
          </p>
        </div>
        <button
          className="grant-applications__button grant-applications__button--secondary"
          type="button"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          className="grant-applications__notice grant-applications__notice--error"
          role="alert"
        >
          <span>{error}</span>
          <button
            className="grant-applications__button grant-applications__button--secondary"
            type="button"
            onClick={loadApplications}
            disabled={loading}
          >
            Try again
          </button>
        </div>
      )}
      {actionError && (
        <p
          className="grant-applications__notice grant-applications__notice--error"
          role="alert"
        >
          {actionError}
        </p>
      )}
      {successMessage && (
        <p
          className="grant-applications__notice grant-applications__notice--success"
          role="status"
        >
          {successMessage}
        </p>
      )}

      {isAdmin && (
        <div className="grant-applications__filters">
          <label htmlFor="application-status-filter">Filter by status</label>
          <select
            id="application-status-filter"
            value={statusFilter}
            onChange={(event) => {
              setPage(0);
              setStatusFilter(event.target.value);
            }}
          >
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <span>
            {pageInfo.totalElements} application
            {pageInfo.totalElements === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {isBeneficiary && (
        <form className="grant-applications__form" onSubmit={handleSave}>
          <h3>
            {editingId
              ? editingStatus === "NEEDS_CORRECTION"
                ? "Edit requested corrections"
                : "Edit draft"
              : "Start an application"}
          </h3>
          <label>
            Grant scheme
            <select
              name="schemeId"
              value={form.schemeId}
              onChange={handleChange}
              required
              disabled={Boolean(editingId)}
            >
              <option value="">Select an available scheme</option>
              {availableSchemes.map((scheme) => (
                <option key={scheme.id} value={scheme.id}>
                  {scheme.schemeName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Application details
            <textarea
              name="applicationDetails"
              value={form.applicationDetails}
              onChange={handleChange}
              maxLength="10000"
              rows="4"
              required
            />
          </label>
          <label>
            Requested amount (₹)
            <input
              name="requestedAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.requestedAmount}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Supporting documents (PDF, PNG, JPEG; up to 10 MB each)
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={(event) => setDocuments(Array.from(event.target.files || []))}
            />
          </label>
          {documents.length > 0 && (
            <p className="grant-applications__help">
              Selected: {documents.map((document) => document.name).join(", ")}
            </p>
          )}
          {selectedScheme && (
            <section
              className="grant-applications__eligibility"
              aria-labelledby="application-eligibility-heading"
            >
              <h4 id="application-eligibility-heading">
                Eligibility criteria
              </h4>
              <p>
                Mandatory: age {selectedScheme.minimumAge ?? "not configured"}–
                {selectedScheme.maximumAge ?? "not configured"}, annual income
                up to ₹
                {selectedScheme.maximumAnnualIncome ?? "not configured"}, and
                category{" "}
                {(selectedScheme.eligibleCategories || []).join(", ") ||
                  "not configured"}
                . The custom score threshold is{" "}
                {selectedScheme.eligibilityThreshold ?? "not configured"}%.
              </p>
              {(selectedScheme.eligibilityQuestions || []).map((question) => (
                <label key={question.id}>
                  {question.questionText}
                  {!question.required && " (optional)"}
                  <select
                    value={form.eligibilityAnswers[question.id] || ""}
                    required={question.required}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        eligibilityAnswers: {
                          ...current.eligibilityAnswers,
                          [question.id]: event.target.value,
                        },
                      }))
                    }
                  >
                    <option value="">Select an answer</option>
                    {(question.answerOptions || []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                        {option.meetsEligibilityCondition
                          ? " (meets eligibility condition)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <p className="grant-applications__help">
                Eligibility results inform your application only. They do not
                approve or reject the grant.
              </p>
            </section>
          )}
          <div className="grant-applications__form-actions">
            <button
              className="grant-applications__button grant-applications__button--secondary"
              type="submit"
              name="action"
              value="draft"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingStatus === "NEEDS_CORRECTION"
                  ? "Save corrections"
                  : "Save draft"}
            </button>
            <button
              className="grant-applications__button grant-applications__button--primary"
              type="submit"
              name="action"
              value="submit"
              disabled={saving || availableSchemes.length === 0}
            >
              {saving
                ? "Saving..."
                : editingStatus === "NEEDS_CORRECTION"
                  ? "Resubmit"
                  : "Submit application"}
            </button>
            {editingId && (
              <button
                className="grant-applications__button grant-applications__button--secondary"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
          {availableSchemes.length === 0 && !loading && (
            <p className="grant-applications__help">
              No active schemes are currently available.
            </p>
          )}
        </form>
      )}

      <div className="grant-applications__table-wrap">
        <table className="grant-applications__table">
          <thead>
            <tr>
              {!isBeneficiary && <th scope="col">Beneficiary</th>}
              <th scope="col">Scheme</th>
              {(isBeneficiary || isAdmin) && <th scope="col">Eligibility</th>}
              <th scope="col">Requested amount</th>
              <th scope="col">Submitted</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="grant-applications__table-message"
                  colSpan={isAdmin ? 7 : 6}
                >
                  Loading applications...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  className="grant-applications__table-message"
                  colSpan={isAdmin ? 7 : 6}
                >
                  Applications could not be loaded.
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td
                  className="grant-applications__table-message"
                  colSpan={isAdmin ? 7 : 6}
                >
                  {statusFilter
                    ? `No applications found with status ${statusFilter.replaceAll("_", " ")}.`
                    : "No grant applications found."}
                </td>
              </tr>
            ) : (
              applications.map((application) => (
                <tr key={application.id}>
                  {!isBeneficiary && (
                    <td>{application.beneficiaryName || "—"}</td>
                  )}
                  <td>{application.schemeName || "—"}</td>
                  {(isBeneficiary || isAdmin) && (
                    <td>
                      {application.eligibilityEvaluation
                        ? `${application.eligibilityEvaluation.eligibilityStatus} · ${application.eligibilityEvaluation.scoreOutOf100 ?? "—"}%`
                        : "Not evaluated"}
                    </td>
                  )}
                  <td>₹{application.requestedAmount}</td>
                  <td>
                    {application.submittedAt
                      ? new Date(application.submittedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <span className="grant-applications__status">
                      {application.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>
                    <div className="grant-applications__actions">
                      <button
                        className="grant-applications__button grant-applications__button--secondary"
                        type="button"
                        onClick={() => handleViewDetails(application.id)}
                      >
                        Details
                      </button>
                      {isBeneficiary &&
                        ["DRAFT", "NEEDS_CORRECTION"].includes(application.status) && (
                        <>
                          <button
                            className="grant-applications__button grant-applications__button--secondary"
                            type="button"
                            onClick={() => handleEdit(application)}
                          >
                          {application.status === "NEEDS_CORRECTION" ? "Edit correction" : "Edit"}
                          </button>
                          <button
                            className="grant-applications__button grant-applications__button--primary"
                            type="button"
                            onClick={() => handleSubmitDraft(application)}
                            disabled={editingId === application.id}
                          >
                          {application.status === "NEEDS_CORRECTION" ? "Resubmit" : "Submit"}
                          </button>
                          {application.status === "DRAFT" && (
                            <button
                              className="grant-applications__button grant-applications__button--secondary"
                              type="button"
                              onClick={() => handleDeleteDraft(application)}
                            >
                              Delete Draft
                            </button>
                          )}
                        </>
                      )}
                      {isBeneficiary &&
                        application.status === "SUBMITTED" &&
                        application.withdrawalAllowed && (
                          <button
                            className="grant-applications__button grant-applications__button--secondary"
                            type="button"
                            onClick={() => handleWithdraw(application)}
                          >
                            Withdraw Application
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isAdmin && pageInfo.totalPages > 1 && (
        <nav className="grant-applications__pagination" aria-label="Application pages">
          <button
            className="grant-applications__button grant-applications__button--secondary"
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0 || loading}
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {pageInfo.totalPages}
          </span>
          <button
            className="grant-applications__button grant-applications__button--secondary"
            type="button"
            onClick={() =>
              setPage((current) =>
                Math.min(pageInfo.totalPages - 1, current + 1)
              )
            }
            disabled={page + 1 >= pageInfo.totalPages || loading}
          >
            Next
          </button>
        </nav>
      )}

      {(detailsLoading || detailsError || selectedApplication) && (
        <section
          className="grant-applications__details"
          aria-labelledby="application-details-heading"
          aria-live="polite"
        >
          <h3 id="application-details-heading">Application details</h3>
          {detailsLoading && <p>Loading application details...</p>}
          {detailsError && (
            <div
              className="grant-applications__notice grant-applications__notice--error"
              role="alert"
            >
              <span>{detailsError}</span>
              {selectedApplicationId != null && (
                <button
                  className="grant-applications__button grant-applications__button--secondary"
                  type="button"
                  onClick={() => handleViewDetails(selectedApplicationId)}
                  disabled={detailsLoading}
                >
                  Try again
                </button>
              )}
            </div>
          )}
          {selectedApplication && (
            <dl className="grant-applications__details-grid">
              {!isBeneficiary && (
                <div>
                  <dt>Beneficiary</dt>
                  <dd>{selectedApplication.beneficiaryName || "—"}</dd>
                </div>
              )}
              <div>
                <dt>Scheme</dt>
                <dd>{selectedApplication.schemeName || "—"}</dd>
              </div>
              {isAdmin && (
                <>
                  <div>
                    <dt>Beneficiary email</dt>
                    <dd>{selectedApplication.beneficiaryDetails?.email || "—"}</dd>
                  </div>
                  <div>
                    <dt>Beneficiary phone</dt>
                    <dd>{selectedApplication.beneficiaryDetails?.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt>Date of birth</dt>
                    <dd>{selectedApplication.beneficiaryDetails?.dateOfBirth || "—"}</dd>
                  </div>
                  <div>
                    <dt>Annual income</dt>
                    <dd>
                      {selectedApplication.beneficiaryDetails?.annualIncome == null
                        ? "—"
                        : `₹${selectedApplication.beneficiaryDetails.annualIncome}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{selectedApplication.beneficiaryDetails?.category || "—"}</dd>
                  </div>
                  <div className="grant-applications__detail-wide">
                    <dt>Address</dt>
                    <dd>
                      {[
                        selectedApplication.beneficiaryDetails?.address,
                        selectedApplication.beneficiaryDetails?.district,
                        selectedApplication.beneficiaryDetails?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </dd>
                  </div>
                </>
              )}
              <div>
                <dt>Status</dt>
                <dd>{selectedApplication.status}</dd>
              </div>
              <div>
                <dt>Review stage</dt>
                <dd>{selectedApplication.workflowStage || "Not submitted"}</dd>
              </div>
              <div>
                <dt>Routing priority</dt>
                <dd>{selectedApplication.routingPriority || "NORMAL"}</dd>
              </div>
              <div>
                <dt>Requested amount</dt>
                <dd>₹{selectedApplication.requestedAmount}</dd>
              </div>
              <div>
                <dt>Submitted at</dt>
                <dd>
                  {selectedApplication.submittedAt
                    ? new Date(selectedApplication.submittedAt).toLocaleString()
                    : "Not submitted"}
                </dd>
              </div>
              <div className="grant-applications__detail-wide">
                <dt>Application details</dt>
                <dd>{selectedApplication.applicationDetails}</dd>
              </div>
            </dl>
          )}
          {selectedApplication?.eligibilityEvaluation ? (
            <section className="grant-applications__eligibility-result">
              <h4>Eligibility evaluation</h4>
              <p>
                Decision: {selectedApplication.eligibilityEvaluation.eligibilityStatus || "Not recorded"} · Score:{" "}
                {selectedApplication.eligibilityEvaluation.scoreOutOf100 ?? "—"}% (
                {selectedApplication.eligibilityEvaluation.pointsEarned} of{" "}
                {
                  selectedApplication.eligibilityEvaluation
                    .maximumAvailablePoints
                }{" "}
                points) · Threshold: {selectedApplication.eligibilityThreshold ?? "—"}%
              </p>
              <p>
                {selectedApplication.eligibilityEvaluation.explanation}
              </p>
              <p>
                Evaluated{" "}
                {new Date(
                  selectedApplication.eligibilityEvaluation.evaluatedAt
                ).toLocaleString()}
              </p>
              <h5>Mandatory criteria</h5>
              <ul>
                {(selectedApplication.eligibilityEvaluation.mandatoryCriteriaResults || []).map(
                  (criterion) => (
                    <li key={criterion.criterion}>
                      {criterion.criterion}: {criterion.status} —{" "}
                      {criterion.explanation}
                    </li>
                  )
                )}
              </ul>
              <h5>Custom question results</h5>
              <ul>
                {(selectedApplication.eligibilityEvaluation.customQuestionResults || []).map(
                  (result) => (
                    <li key={result.questionId}>
                      {result.questionText}: {result.answer || "Not answered"} —{" "}
                      {result.pointsEarned} points. {result.explanation}
                    </li>
                  )
                )}
              </ul>
              {(selectedApplication.eligibilityEvaluation.failedCriteria || []).length >
                0 && (
                <>
                  <h5>Failed criteria</h5>
                  <ul>
                    {(selectedApplication.eligibilityEvaluation.failedCriteria || []).map(
                      (criterion) => (
                        <li key={criterion}>{criterion}</li>
                      )
                    )}
                  </ul>
                </>
              )}
              {(selectedApplication.eligibilityEvaluation.missingInformation || [])
                .length > 0 && (
                <>
                  <h5>Missing information</h5>
                  <ul>
                    {(selectedApplication.eligibilityEvaluation.missingInformation || []).map(
                      (information) => (
                        <li key={information}>{information}</li>
                      )
                    )}
                  </ul>
                </>
              )}
            </section>
          ) : isAdmin ? (
            <section className="grant-applications__eligibility-result">
              <h4>Eligibility evaluation</h4>
              <p>No persisted eligibility evaluation is available for this application.</p>
            </section>
          ) : null}
          {selectedApplication && (
            <section className="grant-applications__eligibility-result">
              <h4>Verification progress</h4>
              <p>
                Current status: {selectedApplication.status.replaceAll("_", " ")}
                {selectedApplication.workflowStage
                  ? ` · ${selectedApplication.workflowStage} review`
                  : ""}
              </p>
              {selectedApplication.documents?.length > 0 && (
                <>
                  <h5>Submitted documents</h5>
                  <ul>
                    {selectedApplication.documents.map((document) => (
                      <li key={document.id}>
                        {document.fileName} · Uploaded by {document.uploadedBy}{" "}
                        <button
                          className="grant-applications__button grant-applications__button--secondary"
                          type="button"
                          onClick={() =>
                            handleDocumentPreview(selectedApplication.id, document)
                          }
                        >
                          View
                        </button>
                        <button
                          className="grant-applications__button grant-applications__button--secondary"
                          type="button"
                          onClick={() =>
                            handleDocumentDownload(selectedApplication.id, document)
                          }
                        >
                          Download
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {documentPreview && (
                <section
                  className="grant-applications__document-preview"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="document-preview-heading"
                >
                  <div className="grant-applications__document-preview-heading">
                    <h3 id="document-preview-heading">{documentPreview.fileName}</h3>
                    <button
                      className="grant-applications__button grant-applications__button--secondary"
                      type="button"
                      onClick={closeDocumentPreview}
                    >
                      Close
                    </button>
                  </div>
                  {documentPreview.contentType?.startsWith("image/") ? (
                    <img src={documentPreview.url} alt={documentPreview.fileName} />
                  ) : (
                    <iframe
                      src={documentPreview.url}
                      title={documentPreview.fileName}
                    />
                  )}
                </section>
              )}
              <h5>Review history</h5>
              {selectedApplication.verificationHistory?.length ? (
                <ul>
                  {selectedApplication.verificationHistory.map((item) => (
                    <li key={item.id}>
                      {item.stage}: {item.action.replaceAll("_", " ")} by{" "}
                      {item.actorName} at {new Date(item.createdAt).toLocaleString()}
                      {item.remarks ? ` — ${item.remarks}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Your application has not entered verification yet.</p>
              )}
              {["APPROVED", "REJECTED", "WITHDRAWN"].includes(
                selectedApplication.status
              ) && (
                <>
                  <h5>Final remarks</h5>
                  {selectedApplication.statusHistory?.some((item) => item.remarks) ? (
                    <ul>
                      {selectedApplication.statusHistory
                        .filter((item) => item.remarks)
                        .map((item) => (
                          <li key={item.id}>
                            {item.action.replaceAll("_", " ")} by {item.actorName} at{" "}
                            {new Date(item.createdAt).toLocaleString()}: {item.remarks}
                          </li>
                        ))}
                    </ul>
                  ) : selectedApplication.verificationHistory?.some(
                      (item) => item.remarks
                    ) ? (
                    <ul>
                      {selectedApplication.verificationHistory
                        .filter((item) => item.remarks)
                        .map((item) => (
                          <li key={item.id}>
                            {item.action.replaceAll("_", " ")} by {item.actorName} at{" "}
                            {new Date(item.createdAt).toLocaleString()}: {item.remarks}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p>No additional remarks were provided.</p>
                  )}
                </>
              )}
            </section>
          )}
        </section>
      )}
    </section>
  );
}

export default GrantApplicationManagement;
