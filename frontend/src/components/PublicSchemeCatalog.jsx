import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, CircleDollarSign, Eye, RefreshCw } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { getSchemes } from "../services/schemeService";

function PublicSchemeCatalog({ limit }) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("schemeId");

  const loadSchemes = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const response = await getSchemes();
      setSchemes(
        (Array.isArray(response.data) ? response.data : []).filter(
          (scheme) => scheme.status === "ACTIVE"
        )
      );
    } catch (error) {
      setErrorStatus(error.response?.status || "network");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  const visibleSchemes = limit ? schemes.slice(0, limit) : schemes;

  if (loading) {
    return (
      <div className="public-schemes__state" role="status">
        Loading available schemes…
      </div>
    );
  }

  if (errorStatus) {
    const needsSignIn = errorStatus === 401 || errorStatus === 403;
    return (
      <div className="public-schemes__state public-schemes__state--error" role="status">
        <p>
          {needsSignIn
            ? "Scheme listings require sign-in with the current access settings."
            : "Scheme listings are temporarily unavailable. Please try again later."}
        </p>
        <div className="public-schemes__state-actions">
          {needsSignIn && (
            <Link className="public-button public-button--primary public-button--small" to="/login">
              Login to continue
            </Link>
          )}
          <button
            className="public-button public-button--outline public-button--small"
            type="button"
            onClick={loadSchemes}
          >
            <RefreshCw size={15} aria-hidden="true" /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (visibleSchemes.length === 0) {
    return (
      <div className="public-schemes__state">
        <p>There are no active schemes to display right now.</p>
        <span>Check back later or sign in to explore available opportunities.</span>
      </div>
    );
  }

  return (
    <div className="public-schemes">
      <div className="public-schemes__grid">
        {visibleSchemes.map((scheme) => {
          const isSelected = String(scheme.id) === selectedId;
          return (
            <article className="public-scheme-card" key={scheme.id}>
              <div className="public-scheme-card__topline">
                <span className="public-scheme-card__icon">
                  <BadgeCheck size={20} aria-hidden="true" />
                </span>
                <span className="public-scheme-card__status">Active scheme</span>
              </div>
              <h3>{scheme.schemeName}</h3>
              <p>{scheme.description || "Scheme details are available after opening this listing."}</p>
              <div className="public-scheme-card__amount">
                <CircleDollarSign size={17} aria-hidden="true" />
                <span>
                  {scheme.maximumGrantAmount == null
                    ? "Grant amount not specified"
                    : `Up to ₹${Number(scheme.maximumGrantAmount).toLocaleString("en-IN")}`}
                </span>
              </div>
              <button
                className="public-scheme-card__view"
                type="button"
                aria-expanded={isSelected}
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams);
                  if (isSelected) {
                    nextParams.delete("schemeId");
                  } else {
                    nextParams.set("schemeId", String(scheme.id));
                  }
                  setSearchParams(nextParams, { replace: true });
                }}
              >
                <Eye size={16} aria-hidden="true" />
                {isSelected ? "Hide details" : "View Scheme"}
                <ArrowRight
                  className={isSelected ? "is-rotated" : ""}
                  size={15}
                  aria-hidden="true"
                />
              </button>
              {isSelected && (
                <div className="public-scheme-card__details">
                  <h4>Eligibility overview</h4>
                  <p>
                    Age: {scheme.minimumAge ?? "Not specified"}–{scheme.maximumAge ?? "Not specified"}
                  </p>
                  <p>
                    Maximum annual income:{" "}
                    {scheme.maximumAnnualIncome == null
                      ? "Not specified"
                      : `₹${Number(scheme.maximumAnnualIncome).toLocaleString("en-IN")}`}
                  </p>
                  <p>
                    Eligible categories:{" "}
                    {(scheme.eligibleCategories || []).join(", ") || "Not specified"}
                  </p>
                  <Link to="/login">Sign in to apply</Link>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {limit && schemes.length > limit && (
        <div className="public-schemes__all">
          <Link className="public-button public-button--outline" to="/schemes">
            Explore all schemes <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default PublicSchemeCatalog;
