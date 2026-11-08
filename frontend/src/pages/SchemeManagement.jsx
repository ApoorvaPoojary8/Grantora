import { useEffect, useState } from "react";
import {
  createScheme,
  deleteScheme,
  getSchemeById,
  getSchemes,
  updateScheme,
} from "../services/schemeService";
import "../styles/SchemeManagement.css";

const emptyForm = {
  schemeName: "",
  description: "",
  department: "",
  minimumAge: "",
  maximumAge: "",
  maximumAnnualIncome: "",
  maximumGrantAmount: "",
  eligibilityThreshold: "70",
  applicationStartDate: "",
  applicationEndDate: "",
  status: "DRAFT",
};

const numericFields = [
  "minimumAge",
  "maximumAge",
  "maximumAnnualIncome",
  "maximumGrantAmount",
  "eligibilityThreshold",
];

function toFormValues(scheme) {
  return Object.fromEntries(
    Object.keys(emptyForm).map((field) => [
      field,
      scheme[field] == null ? "" : String(scheme[field]),
    ])
  );
}

function toPayload(form) {
  return Object.fromEntries(
    Object.entries(form).map(([field, value]) => {
      if (!numericFields.includes(field)) {
        return [field, value || null];
      }

      return [field, value === "" ? null : Number(value)];
    })
  );
}

function displayValue(value) {
  return value == null || value === "" ? "—" : value;
}

function statusTone(status) {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "INACTIVE":
      return "secondary";
    default:
      return "neutral";
  }
}

function SchemeManagement() {
  const role = localStorage.getItem("role");
  const isAdmin = role === "ADMIN";
  const isBeneficiary = role === "BENEFICIARY";
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const loadSchemes = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getSchemes();
      setSchemes(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load schemes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  const visibleSchemes = isBeneficiary
    ? schemes.filter((scheme) => scheme.status === "ACTIVE")
    : schemes;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const response = editingId
        ? await updateScheme(editingId, toPayload(form))
        : await createScheme(toPayload(form));
      const savedScheme = response.data;

      setSchemes((current) =>
        editingId
          ? current.map((scheme) =>
              scheme.id === editingId ? savedScheme : scheme
            )
          : [savedScheme, ...current]
      );
      if (selectedScheme?.id === savedScheme.id) {
        setSelectedScheme(savedScheme);
      }
      setSuccessMessage(
        editingId
          ? "Scheme updated successfully."
          : "Scheme created successfully."
      );
      resetForm();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          `Unable to ${editingId ? "update" : "create"} scheme.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = async (id) => {
    setSelectedScheme(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const response = await getSchemeById(id);
      setSelectedScheme(response.data);
    } catch (err) {
      setDetailsError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load scheme details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEdit = (scheme) => {
    setForm(toFormValues(scheme));
    setEditingId(scheme.id);
    setActionError("");
    setSuccessMessage("");
  };

  const handleDelete = async (scheme) => {
    if (
      !window.confirm(
        `Delete "${scheme.schemeName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(scheme.id);
    setActionError("");
    setSuccessMessage("");

    try {
      await deleteScheme(scheme.id);
      setSchemes((current) =>
        current.filter((item) => item.id !== scheme.id)
      );
      if (selectedScheme?.id === scheme.id) {
        setSelectedScheme(null);
      }
      if (editingId === scheme.id) {
        resetForm();
      }
      setSuccessMessage("Scheme deleted successfully.");
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to delete scheme."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="scheme-management" aria-labelledby="schemes-heading">
      <div className="scheme-management__heading">
        <div>
          <h2 id="schemes-heading">Grant Schemes</h2>
          <p>
            {isBeneficiary
              ? "Browse currently available grant schemes."
              : "View and manage grant schemes."}
          </p>
        </div>
        <button
          className="scheme-management__button scheme-management__button--secondary"
          type="button"
          onClick={loadSchemes}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          className="scheme-management__notice scheme-management__notice--error"
          role="alert"
        >
          <span>{error}</span>
          <button
            className="scheme-management__button scheme-management__button--secondary"
            type="button"
            onClick={loadSchemes}
            disabled={loading}
          >
            Try again
          </button>
        </div>
      )}
      {actionError && (
        <p
          className="scheme-management__notice scheme-management__notice--error"
          role="alert"
        >
          {actionError}
        </p>
      )}
      {successMessage && (
        <p
          className="scheme-management__notice scheme-management__notice--success"
          role="status"
        >
          {successMessage}
        </p>
      )}

      {isAdmin && (
        <form className="scheme-management__form" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit scheme" : "Create scheme"}</h3>
          <div className="scheme-management__form-grid">
            <label>
              Scheme name
              <input
                name="schemeName"
                value={form.schemeName}
                onChange={handleChange}
                maxLength="200"
                required
              />
            </label>
            <label>
              Department
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                maxLength="150"
              />
            </label>
            <label className="scheme-management__form-wide">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
              />
            </label>
            <label>
              Minimum age
              <input
                name="minimumAge"
                type="number"
                min="0"
                value={form.minimumAge}
                onChange={handleChange}
              />
            </label>
            <label>
              Maximum age
              <input
                name="maximumAge"
                type="number"
                min="0"
                value={form.maximumAge}
                onChange={handleChange}
              />
            </label>
            <label>
              Maximum annual income (₹)
              <input
                name="maximumAnnualIncome"
                type="number"
                min="0"
                step="0.01"
                value={form.maximumAnnualIncome}
                onChange={handleChange}
              />
            </label>
            <label>
              Maximum grant amount (₹)
              <input
                name="maximumGrantAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.maximumGrantAmount}
                onChange={handleChange}
              />
            </label>
            <label>
              Eligibility threshold (%)
              <input
                name="eligibilityThreshold"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.eligibilityThreshold}
                onChange={handleChange}
              />
            </label>
            <label>
              Application start date
              <input
                name="applicationStartDate"
                type="date"
                value={form.applicationStartDate}
                onChange={handleChange}
              />
            </label>
            <label>
              Application end date
              <input
                name="applicationEndDate"
                type="date"
                value={form.applicationEndDate}
                onChange={handleChange}
              />
            </label>
            <label>
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>
          <div className="scheme-management__form-actions">
            <button
              className="scheme-management__button scheme-management__button--primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create scheme"}
            </button>
            {editingId && (
              <button
                className="scheme-management__button scheme-management__button--secondary"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="scheme-management__table-wrap">
        <table className="scheme-management__table">
          <thead>
            <tr>
              <th scope="col">Scheme</th>
              <th scope="col">Department</th>
              <th scope="col">Maximum grant</th>
              <th scope="col">Application period</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="scheme-management__table-message" colSpan="6">
                  Loading schemes...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="scheme-management__table-message" colSpan="6">
                  Schemes could not be loaded.
                </td>
              </tr>
            ) : visibleSchemes.length === 0 ? (
              <tr>
                <td className="scheme-management__table-message" colSpan="6">
                  {isBeneficiary
                    ? "No available schemes found."
                    : "No schemes found."}
                </td>
              </tr>
            ) : (
              visibleSchemes.map((scheme) => (
                <tr key={scheme.id}>
                  <td>{displayValue(scheme.schemeName)}</td>
                  <td>{displayValue(scheme.department)}</td>
                  <td>
                    {scheme.maximumGrantAmount == null
                      ? "—"
                      : `₹${scheme.maximumGrantAmount}`}
                  </td>
                  <td>
                    {displayValue(scheme.applicationStartDate)} –{" "}
                    {displayValue(scheme.applicationEndDate)}
                  </td>
                  <td>
                    <span
                      className={`scheme-management__status scheme-management__status--${statusTone(
                        scheme.status
                      )}`}
                    >
                      {displayValue(scheme.status)}
                    </span>
                  </td>
                  <td>
                    <div className="scheme-management__actions">
                      <button
                        className="scheme-management__button scheme-management__button--secondary"
                        type="button"
                        onClick={() => handleViewDetails(scheme.id)}
                      >
                        Details
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            className="scheme-management__button scheme-management__button--secondary"
                            type="button"
                            onClick={() => handleEdit(scheme)}
                          >
                            Edit
                          </button>
                          <button
                            className="scheme-management__button scheme-management__button--danger"
                            type="button"
                            onClick={() => handleDelete(scheme)}
                            disabled={deletingId === scheme.id}
                          >
                            {deletingId === scheme.id
                              ? "Deleting..."
                              : "Delete"}
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

      {(detailsLoading || detailsError || selectedScheme) && (
        <section
          className="scheme-management__details"
          aria-labelledby="scheme-details-heading"
          aria-live="polite"
        >
          <h3 id="scheme-details-heading">Scheme details</h3>
          {detailsLoading && <p>Loading scheme details...</p>}
          {detailsError && (
            <p
              className="scheme-management__notice scheme-management__notice--error"
              role="alert"
            >
              {detailsError}
            </p>
          )}
          {selectedScheme && (
            <dl className="scheme-management__details-grid">
              <div>
                <dt>Scheme name</dt>
                <dd>{displayValue(selectedScheme.schemeName)}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{displayValue(selectedScheme.department)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{displayValue(selectedScheme.status)}</dd>
              </div>
              <div className="scheme-management__detail-wide">
                <dt>Description</dt>
                <dd>{displayValue(selectedScheme.description)}</dd>
              </div>
              <div>
                <dt>Minimum age</dt>
                <dd>{displayValue(selectedScheme.minimumAge)}</dd>
              </div>
              <div>
                <dt>Maximum age</dt>
                <dd>{displayValue(selectedScheme.maximumAge)}</dd>
              </div>
              <div>
                <dt>Maximum annual income</dt>
                <dd>
                  {selectedScheme.maximumAnnualIncome == null
                    ? "—"
                    : `₹${selectedScheme.maximumAnnualIncome}`}
                </dd>
              </div>
              <div>
                <dt>Maximum grant amount</dt>
                <dd>
                  {selectedScheme.maximumGrantAmount == null
                    ? "—"
                    : `₹${selectedScheme.maximumGrantAmount}`}
                </dd>
              </div>
              <div>
                <dt>Eligibility threshold</dt>
                <dd>
                  {selectedScheme.eligibilityThreshold == null
                    ? "—"
                    : `${selectedScheme.eligibilityThreshold}%`}
                </dd>
              </div>
              <div>
                <dt>Application start date</dt>
                <dd>{displayValue(selectedScheme.applicationStartDate)}</dd>
              </div>
              <div>
                <dt>Application end date</dt>
                <dd>{displayValue(selectedScheme.applicationEndDate)}</dd>
              </div>
            </dl>
          )}
        </section>
      )}
    </section>
  );
}

export default SchemeManagement;
