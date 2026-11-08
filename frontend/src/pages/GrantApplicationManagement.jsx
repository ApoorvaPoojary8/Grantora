import { useEffect, useState } from "react";
import {
  createApplication,
  getApplicationById,
  getApplications,
  getMyApplications,
  submitApplication,
  updateApplication,
  updateApplicationStatus,
} from "../services/grantApplicationService";
import { getSchemes } from "../services/schemeService";
import "../styles/GrantApplicationManagement.css";

const emptyForm = {
  schemeId: "",
  applicationDetails: "",
  requestedAmount: "",
};

const statuses = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
];

function statusTone(status) {
  switch (status) {
    case "SUBMITTED":
      return "primary";
    case "UNDER_REVIEW":
      return "secondary";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    default:
      return "neutral";
  }
}

function GrantApplicationManagement() {
  const role = localStorage.getItem("role");
  const isBeneficiary = role === "BENEFICIARY";
  const isAdmin = role === "ADMIN";
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
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
    setEditingId(application.id);
    setForm({
      schemeId: String(application.schemeId),
      applicationDetails: application.applicationDetails,
      requestedAmount: String(application.requestedAmount),
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

  const handleStatusChange = async (application, status) => {
    setActionError("");
    setSuccessMessage("");

    try {
      const response = await updateApplicationStatus(application.id, status);
      setApplications((current) =>
        current.map((item) =>
          item.id === application.id ? response.data : item
        )
      );
      if (selectedApplication?.id === application.id) {
        setSelectedApplication(response.data);
      }
      setSuccessMessage("Application status updated.");
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to update application status."
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
                  colSpan={isBeneficiary ? 5 : 6}
                >
                  Loading applications...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  className="grant-applications__table-message"
                  colSpan={isBeneficiary ? 5 : 6}
                >
                  Applications could not be loaded.
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td
                  className="grant-applications__table-message"
                  colSpan={isBeneficiary ? 5 : 6}
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
                  <td>₹{application.requestedAmount}</td>
                  <td>
                    {application.submittedAt
                      ? new Date(application.submittedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    {isAdmin ? (
                      <select
                        className={`grant-applications__status grant-applications__status--${statusTone(
                          application.status
                        )}`}
                        aria-label={`Status for ${application.schemeName}`}
                        value={application.status}
                        onChange={(event) =>
                          handleStatusChange(application, event.target.value)
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`grant-applications__status grant-applications__status--${statusTone(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    )}
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
                      {isBeneficiary && application.status === "DRAFT" && (
                        <>
                          <button
                            className="grant-applications__button grant-applications__button--secondary"
                            type="button"
                            onClick={() => handleEdit(application)}
                          >
                            Edit
                          </button>
                          <button
                            className="grant-applications__button grant-applications__button--primary"
                            type="button"
                            onClick={() => handleSubmitDraft(application)}
                          >
                            Submit
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
        </section>
      )}
    </section>
  );
}

export default GrantApplicationManagement;
