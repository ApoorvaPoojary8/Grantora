import { useEffect, useState } from "react";
import LogoutButton from "../components/LogoutButton";
import {
  deleteBeneficiary,
  getBeneficiaries,
  getBeneficiaryById,
} from "../services/beneficiaryService";
import GrantApplicationManagement from "./GrantApplicationManagement";
import SchemeManagement from "./SchemeManagement";
import "../styles/AdminDashboard.css";

function AdminDashboard() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadBeneficiaries = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getBeneficiaries();
      setBeneficiaries(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load beneficiaries."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const handleViewDetails = async (id) => {
    setSelectedBeneficiary(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const response = await getBeneficiaryById(id);
      setSelectedBeneficiary(response.data);
    } catch (err) {
      setDetailsError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load beneficiary details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (beneficiary) => {
    const name = beneficiary.fullName || "this beneficiary";
    if (
      !window.confirm(
        `Delete the profile for ${name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(beneficiary.id);
    setActionError("");
    setSuccessMessage("");

    try {
      await deleteBeneficiary(beneficiary.id);
      setBeneficiaries((current) =>
        current.filter((item) => item.id !== beneficiary.id)
      );
      if (selectedBeneficiary?.id === beneficiary.id) {
        setSelectedBeneficiary(null);
      }
      setSuccessMessage("Beneficiary profile deleted successfully.");
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to delete beneficiary profile."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1>Grantora Admin Dashboard</h1>
        <LogoutButton />
      </header>

      <main className="admin-dashboard__main">
        <section aria-labelledby="beneficiaries-heading">
          <div className="admin-dashboard__section-heading">
            <div>
              <h2 id="beneficiaries-heading">Beneficiaries</h2>
              <p>View and manage registered beneficiary profiles.</p>
            </div>
            <button
              className="admin-dashboard__secondary-button"
              type="button"
              onClick={loadBeneficiaries}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="admin-dashboard__notice admin-dashboard__notice--error" role="alert">
              <span>{error}</span>
              <button
                className="admin-dashboard__secondary-button"
                type="button"
                onClick={loadBeneficiaries}
                disabled={loading}
              >
                Try again
              </button>
            </div>
          )}
          {actionError && (
            <p className="admin-dashboard__notice admin-dashboard__notice--error" role="alert">
              {actionError}
            </p>
          )}
          {successMessage && (
            <p className="admin-dashboard__notice admin-dashboard__notice--success" role="status">
              {successMessage}
            </p>
          )}

          <div className="admin-dashboard__table-wrap">
            <table className="admin-dashboard__table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">State</th>
                  <th scope="col">Category</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="admin-dashboard__table-message" colSpan="6">
                      Loading beneficiaries...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="admin-dashboard__table-message" colSpan="6">
                      Beneficiaries could not be loaded.
                    </td>
                  </tr>
                ) : beneficiaries.length === 0 ? (
                  <tr>
                    <td className="admin-dashboard__table-message" colSpan="6">
                      No registered beneficiaries found.
                    </td>
                  </tr>
                ) : (
                  beneficiaries.map((beneficiary) => (
                    <tr key={beneficiary.id}>
                      <td>{beneficiary.fullName || "—"}</td>
                      <td>{beneficiary.email || "—"}</td>
                      <td>{beneficiary.phone || "—"}</td>
                      <td>{beneficiary.state || "—"}</td>
                      <td>{beneficiary.category || "—"}</td>
                      <td>
                        <div className="admin-dashboard__actions">
                          <button
                            className="admin-dashboard__secondary-button"
                            type="button"
                            onClick={() => handleViewDetails(beneficiary.id)}
                          >
                            View details
                          </button>
                          <button
                            className="admin-dashboard__delete-button"
                            type="button"
                            onClick={() => handleDelete(beneficiary)}
                            disabled={deletingId === beneficiary.id}
                          >
                            {deletingId === beneficiary.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {(detailsLoading || detailsError || selectedBeneficiary) && (
          <section
            className="admin-dashboard__details"
            aria-labelledby="beneficiary-details-heading"
            aria-live="polite"
          >
            <h2 id="beneficiary-details-heading">Beneficiary details</h2>
            {detailsLoading && <p>Loading beneficiary details...</p>}
            {detailsError && (
              <p className="admin-dashboard__notice admin-dashboard__notice--error" role="alert">
                {detailsError}
              </p>
            )}
            {selectedBeneficiary && (
              <dl className="admin-dashboard__details-grid">
                <div>
                  <dt>Name</dt>
                  <dd>{selectedBeneficiary.fullName || "—"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{selectedBeneficiary.email || "—"}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{selectedBeneficiary.phone || "—"}</dd>
                </div>
                <div>
                  <dt>Date of birth</dt>
                  <dd>{selectedBeneficiary.dateOfBirth || "—"}</dd>
                </div>
                <div>
                  <dt>Annual income</dt>
                  <dd>
                    {selectedBeneficiary.annualIncome == null
                      ? "—"
                      : `₹${selectedBeneficiary.annualIncome}`}
                  </dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{selectedBeneficiary.category || "—"}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{selectedBeneficiary.address || "—"}</dd>
                </div>
                <div>
                  <dt>District</dt>
                  <dd>{selectedBeneficiary.district || "—"}</dd>
                </div>
                <div>
                  <dt>State</dt>
                  <dd>{selectedBeneficiary.state || "—"}</dd>
                </div>
              </dl>
            )}
          </section>
        )}
        <SchemeManagement />
        <GrantApplicationManagement />
      </main>
    </div>
  );
}

export default AdminDashboard;