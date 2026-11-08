import { useEffect, useState } from "react";
import {
  createApplication,
  getApplicationById,
  getApplications,
  getMyApplications,
  submitApplication,
  updateApplication,
  uploadApplicationDocument,
  downloadApplicationDocument,
} from "../services/grantApplicationService";
import { getSchemes } from "../services/schemeService";
import "../styles/GrantApplicationManagement.css";

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
  const [applications, setApplications] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [documents, setDocuments] = useState([]);

  const loadApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const [applicationsResponse, schemesResponse] = await Promise.all([
        isBeneficiary ? getMyApplications() : getApplications(),
        isBeneficiary ? getSchemes() : Promise.resolve({ data: [] }),
      ]);
      setApplications(applicationsResponse.data);
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
  }, []);

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
    setDocuments([]);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const shouldSubmit = event.nativeEvent.submitter?.value === "submit";
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
          return;
        }
      }

      setSuccessMessage(
        shouldSubmit
          ? "Grant application submitted successfully."
          : editingId
            ? "Draft updated successfully."
            : "Application draft saved successfully."
      );
      resetForm();
      await loadApplications();
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
    setActionError("");
    setSuccessMessage("");

    try {
      await submitApplication(application.id);
      setSuccessMessage("Grant application submitted successfully.");
      await loadApplications();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to submit grant application."
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
          onClick={loadApplications}
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

      {isBeneficiary && (
        <form className="grant-applications__form" onSubmit={handleSave}>
          <h3>{editingId ? "Edit draft" : "Start an application"}</h3>
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
              {saving ? "Saving..." : "Save draft"}
            </button>
            <button
              className="grant-applications__button grant-applications__button--primary"
              type="submit"
              name="action"
              value="submit"
              disabled={saving || availableSchemes.length === 0}
            >
              {saving ? "Saving..." : "Submit application"}
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
              {isBeneficiary && <th scope="col">Eligibility</th>}
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
                  colSpan="6"
                >
                  Loading applications...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  className="grant-applications__table-message"
                  colSpan="6"
                >
                  Applications could not be loaded.
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td
                  className="grant-applications__table-message"
                  colSpan="6"
                >
                  No grant applications found.
                </td>
              </tr>
            ) : (
              applications.map((application) => (
                <tr key={application.id}>
                  {!isBeneficiary && (
                    <td>{application.beneficiaryName || "—"}</td>
                  )}
                  <td>{application.schemeName || "—"}</td>
                  {isBeneficiary && (
                    <td>
                      {application.eligibilityEvaluation
                        ? `${application.eligibilityEvaluation.eligibilityStatus} · ${application.eligibilityEvaluation.scoreOutOf100}%`
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
                          >
                          {application.status === "NEEDS_CORRECTION" ? "Resubmit" : "Submit"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(detailsLoading || detailsError || selectedApplication) && (
        <section
          className="grant-applications__details"
          aria-labelledby="application-details-heading"
          aria-live="polite"
        >
          <h3 id="application-details-heading">Application details</h3>
          {detailsLoading && <p>Loading application details...</p>}
          {detailsError && (
            <p
              className="grant-applications__notice grant-applications__notice--error"
              role="alert"
            >
              {detailsError}
            </p>
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
          {selectedApplication?.eligibilityEvaluation && (
            <section className="grant-applications__eligibility-result">
              <h4>Eligibility evaluation</h4>
              <p>
                {selectedApplication.eligibilityEvaluation.eligibilityStatus} —{" "}
                {selectedApplication.eligibilityEvaluation.scoreOutOf100}% (
                {selectedApplication.eligibilityEvaluation.pointsEarned} of{" "}
                {
                  selectedApplication.eligibilityEvaluation
                    .maximumAvailablePoints
                }{" "}
                points)
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
                {selectedApplication.eligibilityEvaluation.mandatoryCriteriaResults.map(
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
                {selectedApplication.eligibilityEvaluation.customQuestionResults.map(
                  (result) => (
                    <li key={result.questionId}>
                      {result.questionText}: {result.answer || "Not answered"} —{" "}
                      {result.pointsEarned} points. {result.explanation}
                    </li>
                  )
                )}
              </ul>
              {selectedApplication.eligibilityEvaluation.failedCriteria.length >
                0 && (
                <>
                  <h5>Failed criteria</h5>
                  <ul>
                    {selectedApplication.eligibilityEvaluation.failedCriteria.map(
                      (criterion) => (
                        <li key={criterion}>{criterion}</li>
                      )
                    )}
                  </ul>
                </>
              )}
              {selectedApplication.eligibilityEvaluation.missingInformation
                .length > 0 && (
                <>
                  <h5>Missing information</h5>
                  <ul>
                    {selectedApplication.eligibilityEvaluation.missingInformation.map(
                      (information) => (
                        <li key={information}>{information}</li>
                      )
                    )}
                  </ul>
                </>
              )}
            </section>
          )}
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
            </section>
          )}
        </section>
      )}
    </section>
  );
}

export default GrantApplicationManagement;
