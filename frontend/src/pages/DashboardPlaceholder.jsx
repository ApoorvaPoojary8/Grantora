import { useCallback, useEffect, useState } from "react";
import { Construction } from "lucide-react";
import { getDisbursementEligibleApplications } from "../services/grantApplicationService";
import "../styles/DashboardHome.css";

function DashboardPlaceholder({ title }) {
  const isDisbursement = title === "Grant Disbursement";
  const [applications, setApplications] = useState([]);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 0 });
  const [loading, setLoading] = useState(isDisbursement);
  const [error, setError] = useState("");

  const loadEligibleApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDisbursementEligibleApplications({
        page,
        size: 20,
      });
      setApplications(response.data.content);
      setPageInfo({ totalPages: response.data.totalPages });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to load applications approved for disbursement."
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isDisbursement) loadEligibleApplications();
  }, [isDisbursement, loadEligibleApplications]);

  if (isDisbursement) {
    return (
      <section className="dashboard-placeholder" aria-labelledby="disbursement-heading">
        <div>
          <h2 id="disbursement-heading">Grant Disbursement</h2>
          <p>Applications are listed here after final workflow approval.</p>
        </div>
        <button type="button" onClick={loadEligibleApplications} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        {error && (
          <p role="alert">
            {error}{" "}
            <button type="button" onClick={loadEligibleApplications} disabled={loading}>
              Try again
            </button>
          </p>
        )}
        {loading ? (
          <p>Loading approved applications…</p>
        ) : applications.length === 0 ? (
          <p>No applications are currently approved for disbursement.</p>
        ) : (
          <>
            <div className="grant-applications__table-wrap">
              <table className="grant-applications__table">
                <thead>
                  <tr>
                    <th>Application</th>
                    <th>Beneficiary</th>
                    <th>Scheme</th>
                    <th>Approved amount</th>
                    <th>Eligibility</th>
                    <th>Final remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => {
                    const approval = [...(application.statusHistory || [])]
                      .reverse()
                      .find((item) => item.toStatus === "APPROVED");
                    return (
                      <tr key={application.id}>
                        <td>#{application.id}</td>
                        <td>{application.beneficiaryName}</td>
                        <td>{application.schemeName}</td>
                        <td>
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(application.requestedAmount || 0)}
                        </td>
                        <td>
                          {application.eligibilityEvaluation?.eligibilityStatus || "—"} ·{" "}
                          {application.eligibilityEvaluation?.scoreOutOf100 ?? "—"}%
                        </td>
                        <td>{approval?.remarks || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pageInfo.totalPages > 1 && (
              <nav aria-label="Disbursement application pages">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0 || loading}
                >
                  Previous
                </button>
                <span>Page {page + 1} of {pageInfo.totalPages}</span>
                <button
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
          </>
        )}
      </section>
    );
  }

  return (
    <section className="dashboard-placeholder">
      <span className="dashboard-placeholder__icon" aria-hidden="true">
        <Construction size={24} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>
          This workspace is not available yet. It will appear here when the
          feature is implemented.
        </p>
      </div>
    </section>
  );
}

export default DashboardPlaceholder;
