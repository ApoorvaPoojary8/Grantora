import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, ShieldCheck } from "lucide-react";
import api from "../services/api";
import {
  assignApplicationOfficer,
  downloadApplicationDocument,
  escalateApplication,
  getVerificationHistory,
  getVerificationQueue,
  submitVerificationDecision,
} from "../services/grantApplicationService";
import "../styles/VerificationWorkflow.css";

const emptyOfficer = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  officerLevel: "FIELD",
  jurisdictionState: "",
  jurisdictionDistrict: "",
};

const emptyRule = {
  minimumScore: "0",
  maximumScore: "100",
  minimumAmount: "0",
  maximumAmount: "",
  priority: "NORMAL",
  stateApprovalRequired: true,
};

const stageNames = {
  FIELD: "Field Officer",
  DISTRICT: "District Officer",
  STATE: "State Officer / Admin",
};

function messageFrom(error, fallback) {
  return error.response?.data?.message || error.response?.data?.error || fallback;
}

function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function VerificationWorkflow({ historyOnly = false }) {
  const role = localStorage.getItem("role");
  const isAdmin = role === "ADMIN";
  const [applications, setApplications] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [rules, setRules] = useState([]);
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState("");
  const [remarks, setRemarks] = useState("");
  const [checklist, setChecklist] = useState({
    identityVerified: false,
    addressVerified: false,
    documentsVerified: false,
    applicationDetailsVerified: false,
  });
  const [officerForm, setOfficerForm] = useState(emptyOfficer);
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [assignmentOfficerId, setAssignmentOfficerId] = useState("");
  const [documentPreview, setDocumentPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const applicationRequest = historyOnly
        ? getVerificationHistory()
        : getVerificationQueue();
      const tasks = [applicationRequest];
      if (isAdmin) {
        tasks.push(api.get("/users"), api.get("/verification/routing-rules"));
      }
      const [applicationsResponse, usersResponse, rulesResponse] =
        await Promise.all(tasks);
      setApplications(applicationsResponse.data);
      if (isAdmin) {
        setOfficers(
          usersResponse.data.filter(
            (user) => user.role === "OFFICER"
          )
        );
        setRules(rulesResponse.data);
      }
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load verification workflow."));
    } finally {
      setLoading(false);
    }
  }, [historyOnly, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(
    () => () => {
      if (documentPreview?.url) URL.revokeObjectURL(documentPreview.url);
    },
    [documentPreview?.url]
  );

  const selectedStage = selected?.workflowStage;
  const canDecide =
    selected &&
    !historyOnly &&
    (isAdmin
      ? selectedStage === "STATE"
      : selected.assignedOfficerId === Number(localStorage.getItem("userId")));
  const assignableOfficers = selected
    ? officers.filter((officer) =>
        officer.active !== false &&
        officer.officerLevel === selected.workflowStage &&
        (officer.jurisdictionState || "").trim().toLowerCase() ===
          (selected.beneficiaryDetails?.state || "").trim().toLowerCase() &&
        (selected.workflowStage === "STATE" ||
          (officer.jurisdictionDistrict || "").trim().toLowerCase() ===
            (selected.beneficiaryDetails?.district || "").trim().toLowerCase())
      )
    : [];
  const decisions = useMemo(() => {
    if (selectedStage === "FIELD") return ["VERIFIED", "NEEDS_CORRECTION", "REJECTED"];
    if (selectedStage === "DISTRICT") return ["APPROVED", "NEEDS_CORRECTION", "REJECTED"];
    if (selectedStage === "STATE") return ["APPROVED", "REJECTED"];
    return [];
  }, [selectedStage]);

  const handleDecision = async (event) => {
    event.preventDefault();
    if (!selected || !decision) return;
    if (
      !window.confirm(
        `Record ${decision.replaceAll("_", " ")} for application #${selected.id}?`
      )
    ) {
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await submitVerificationDecision(selected.id, {
        decision,
        remarks,
        ...(selectedStage === "FIELD" ? checklist : {}),
      });
      setNotice(`Application #${selected.id} updated: ${decision.replaceAll("_", " ")}.`);
      setSelected(null);
      setDecision("");
      setRemarks("");
      setChecklist({
        identityVerified: false,
        addressVerified: false,
        documentsVerified: false,
        applicationDetailsVerified: false,
      });
      await loadData();
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to record the verification decision."));
    } finally {
      setSaving(false);
    }
  };

  const handleEscalation = async (application) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await escalateApplication(application.id);
      setNotice(`Application #${application.id} escalated within its current review level.`);
      setSelected(null);
      await loadData();
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to escalate this application."));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignment = async (event) => {
    event.preventDefault();
    if (!selected || !assignmentOfficerId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await assignApplicationOfficer(selected.id, Number(assignmentOfficerId));
      setNotice(`Application #${selected.id} assigned successfully.`);
      setSelected(null);
      await loadData();
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to assign this application."));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (application, document) => {
    setError("");
    try {
      const response = await downloadApplicationDocument(application.id, document.id);
      const url = URL.createObjectURL(response.data);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to download this document."));
    }
  };

  const handlePreview = async (application, document) => {
    setError("");
    try {
      const response = await downloadApplicationDocument(application.id, document.id);
      setDocumentPreview({
        url: URL.createObjectURL(response.data),
        contentType: document.contentType,
        fileName: document.fileName,
      });
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to view this document."));
    }
  };

  const handleOfficerCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post("/users", {
        ...officerForm,
        role: "OFFICER",
        active: true,
        jurisdictionDistrict:
          officerForm.officerLevel === "STATE"
            ? null
            : officerForm.jurisdictionDistrict,
      });
      setOfficerForm(emptyOfficer);
      setNotice("Verification officer created and assigned to the jurisdiction.");
      await loadData();
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to create the officer."));
    } finally {
      setSaving(false);
    }
  };

  const handleOfficerUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/users/${editingOfficer.id}`, {
        ...editingOfficer,
        role: "OFFICER",
        password: undefined,
        jurisdictionDistrict:
          editingOfficer.officerLevel === "STATE"
            ? null
            : editingOfficer.jurisdictionDistrict,
      });
      setEditingOfficer(null);
      setNotice("Officer jurisdiction updated.");
      await loadData();
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to update officer assignment."));
    } finally {
      setSaving(false);
    }
  };

  const handleRuleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...ruleForm,
        minimumScore: Number(ruleForm.minimumScore),
        maximumScore: Number(ruleForm.maximumScore),
        minimumAmount: Number(ruleForm.minimumAmount),
        maximumAmount:
          ruleForm.maximumAmount === "" ? null : Number(ruleForm.maximumAmount),
        stateApprovalRequired: Boolean(ruleForm.stateApprovalRequired),
      };
      if (editingRule) {
        await api.put(`/verification/routing-rules/${editingRule.id}`, payload);
      } else {
        await api.post("/verification/routing-rules", payload);
      }
      setRuleForm(emptyRule);
      setEditingRule(null);
      setNotice(editingRule ? "Workflow routing rule updated." : "Workflow routing rule saved.");
      await loadData();
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to save routing rule."));
    } finally {
      setSaving(false);
    }
  };

  const handleRuleDelete = async (ruleId) => {
    setSaving(true);
    setError("");
    try {
      await api.delete(`/verification/routing-rules/${ruleId}`);
      setNotice("Routing rule deleted. Existing application priorities are unchanged.");
      await loadData();
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to delete routing rule."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="verification-workflow">
      <header className="verification-workflow__header">
        <div>
          <span className="verification-workflow__eyebrow">
            {isAdmin ? "ADMIN REVIEW" : "OFFICER REVIEW"}
          </span>
          <h2>{historyOnly ? "Verification history" : "Verification workflow"}</h2>
          <p>
            Field and District verification are mandatory. State approval is
            required when the matching Admin-configured score and grant rule says so.
          </p>
        </div>
        <button type="button" className="verification-button" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && <p className="verification-alert verification-alert--error" role="alert">{error}</p>}
      {notice && <p className="verification-alert verification-alert--success" role="status">{notice}</p>}

      <div className="verification-list">
        {loading ? (
          <p className="verification-empty">Loading applications…</p>
        ) : applications.length === 0 ? (
          <p className="verification-empty">
            {historyOnly ? "No verification history is available." : "No applications are currently assigned for review."}
          </p>
        ) : applications.map((application) => (
          <article className="verification-card" key={application.id}>
            <div className="verification-card__main">
              <div className="verification-card__title">
                <h3>{application.schemeName}</h3>
                <span className={`verification-tag verification-tag--${(application.routingPriority || "NORMAL").toLowerCase()}`}>
                  {application.routingPriority || "NORMAL"}
                </span>
                {application.escalated && <span className="verification-tag verification-tag--escalated">Escalated</span>}
              </div>
              <p>
                Application #{application.id} · {application.beneficiaryName} ·{" "}
                {formatAmount(application.requestedAmount)}
              </p>
              <p>
                {stageNames[application.workflowStage]} · {application.status.replaceAll("_", " ")}
                {application.assignedOfficerName ? ` · Assigned to ${application.assignedOfficerName}` : ""}
              </p>
            </div>
            <button type="button" className="verification-button verification-button--primary" onClick={() => {
              setSelected(application);
              setAssignmentOfficerId(String(application.assignedOfficerId || ""));
              setDecision("");
              setRemarks("");
            }}>
              Review details
            </button>
          </article>
        ))}
      </div>

      {selected && (
        <section className="verification-detail" aria-labelledby="verification-detail-title">
          <div className="verification-detail__heading">
            <div>
              <span className="verification-workflow__eyebrow">
                {stageNames[selected.workflowStage]} · Application #{selected.id}
              </span>
              <h3 id="verification-detail-title">{selected.schemeName}</h3>
            </div>
            <button type="button" className="verification-button" onClick={() => setSelected(null)}>Close</button>
          </div>

          <div className="verification-detail__grid">
            <section>
              <h4>Beneficiary identity and address</h4>
              <dl>
                <dt>Name</dt><dd>{selected.beneficiaryName}</dd>
                <dt>Email</dt><dd>{selected.beneficiaryDetails?.email || "—"}</dd>
                <dt>Phone</dt><dd>{selected.beneficiaryDetails?.phone || "—"}</dd>
                <dt>Date of birth</dt><dd>{selected.beneficiaryDetails?.dateOfBirth || "—"}</dd>
                <dt>Address</dt><dd>{selected.beneficiaryDetails?.address || "—"}</dd>
                <dt>District / State</dt><dd>{[selected.beneficiaryDetails?.district, selected.beneficiaryDetails?.state].filter(Boolean).join(", ") || "—"}</dd>
                <dt>Category / income</dt><dd>{selected.beneficiaryDetails?.category || "—"} · {formatAmount(selected.beneficiaryDetails?.annualIncome)}</dd>
              </dl>
            </section>
            <section>
              <h4>Application details</h4>
              <p>{selected.applicationDetails}</p>
              <p><strong>Requested amount:</strong> {formatAmount(selected.requestedAmount)}</p>
              <p><strong>Eligibility:</strong> {selected.eligibilityEvaluation?.eligibilityStatus || "Not evaluated"} · {selected.eligibilityEvaluation?.scoreOutOf100 ?? "—"} / 100</p>
              <p><strong>Eligibility threshold:</strong> {selected.eligibilityThreshold ?? "—"}%</p>
              <p>{selected.eligibilityEvaluation?.explanation || "No eligibility explanation is available."}</p>
              <p><strong>Routing:</strong> {selected.routingPriority || "NORMAL"}{selected.escalated ? " · Escalated" : ""}</p>
              <p><strong>State approval:</strong> {selected.stateApprovalRequired ? "Required after District review" : "Not required after District review"}</p>
            </section>
            <section className="verification-detail__wide">
              <h4>Submitted documents</h4>
              {selected.documents?.length ? (
                <ul className="verification-documents">
                  {selected.documents.map((document) => (
                    <li key={document.id}>
                      <span>{document.fileName} · {(document.fileSize / 1024).toFixed(1)} KB · {document.uploadedBy}</span>
                      <button type="button" className="verification-button" onClick={() => handleDownload(selected, document)}>
                        <Download size={15} aria-hidden="true" /> Download
                      </button>
                      <button type="button" className="verification-button" onClick={() => handlePreview(selected, document)}>
                        View
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p>No supporting documents have been uploaded.</p>}
              {documentPreview && (
                <section
                  className="verification-document-preview"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="verification-document-preview-title"
                >
                  <div className="verification-detail__heading">
                    <h4 id="verification-document-preview-title">{documentPreview.fileName}</h4>
                    <button
                      type="button"
                      className="verification-button"
                      onClick={() => setDocumentPreview(null)}
                    >
                      Close
                    </button>
                  </div>
                  {documentPreview.contentType?.startsWith("image/") ? (
                    <img src={documentPreview.url} alt={documentPreview.fileName} />
                  ) : (
                    <iframe src={documentPreview.url} title={documentPreview.fileName} />
                  )}
                </section>
              )}
            </section>
            <section className="verification-detail__wide">
              <h4>Review history</h4>
              {selected.verificationHistory?.length || selected.statusHistory?.length ? (
                <ol className="verification-timeline">
                  {[
                    ...(selected.statusHistory || []).map((item) => ({
                      ...item,
                      timelineType: "status",
                    })),
                    ...(selected.verificationHistory || []).map((item) => ({
                      ...item,
                      timelineType: "verification",
                    })),
                  ]
                    .sort((left, right) =>
                      new Date(left.createdAt) - new Date(right.createdAt)
                    )
                    .map((item) => (
                      <li key={`${item.timelineType}-${item.id}`}>
                        <strong>
                          {item.timelineType === "verification"
                            ? `${item.stage} · ${item.action.replaceAll("_", " ")}`
                            : item.action.replaceAll("_", " ")}
                        </strong>
                        <span>
                          {item.actorName || "System"} · {new Date(item.createdAt).toLocaleString()}
                          {item.previousStatus || item.newStatus
                            ? ` · ${item.previousStatus || "—"} → ${item.newStatus || "—"}`
                            : ""}
                          {item.nextStage ? ` · Next: ${item.nextStage}` : ""}
                          {item.assignedOfficerName ? ` · Assigned to ${item.assignedOfficerName}` : ""}
                        </span>
                        {(item.identityVerified || item.addressVerified || item.documentsVerified || item.applicationDetailsVerified) && (
                          <span>
                            Field checks: identity {item.identityVerified ? "verified" : "not verified"}; address {item.addressVerified ? "verified" : "not verified"}; documents {item.documentsVerified ? "reviewed" : "not reviewed"}; application {item.applicationDetailsVerified ? "checked" : "not checked"}.
                          </span>
                        )}
                        {item.remarks && <p>{item.remarks}</p>}
                      </li>
                    ))}
                </ol>
              ) : <p>No review actions recorded yet.</p>}
            </section>
          </div>

          {canDecide && (
            <form className="verification-decision" onSubmit={handleDecision}>
              <h4>Record a decision</h4>
              {selected.workflowStage === "FIELD" && (
                <fieldset>
                  <legend>Field verification checklist</legend>
                  {[
                    ["identityVerified", "Beneficiary identity verified"],
                    ["addressVerified", "Address verified"],
                    ["documentsVerified", "Submitted documents reviewed"],
                    ["applicationDetailsVerified", "Application details verified"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      <input type="checkbox" checked={checklist[key]} onChange={(event) => setChecklist((current) => ({ ...current, [key]: event.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </fieldset>
              )}
              <label>
                Decision
                <select required value={decision} onChange={(event) => setDecision(event.target.value)}>
                  <option value="">Select a decision</option>
                  {decisions.map((value) => <option value={value} key={value}>{value.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <label>
                Remarks {["REJECTED", "NEEDS_CORRECTION"].includes(decision) && <span>(required)</span>}
                <textarea required={["REJECTED", "NEEDS_CORRECTION"].includes(decision)} value={remarks} onChange={(event) => setRemarks(event.target.value)} maxLength={2000} rows={3} />
              </label>
              <button type="submit" className="verification-button verification-button--primary" disabled={saving}>
                <ShieldCheck size={16} aria-hidden="true" />
                {saving ? "Saving…" : "Record decision"}
              </button>
              <button type="button" className="verification-button" disabled={saving} onClick={() => handleEscalation(selected)}>
                Escalate within this level
              </button>
            </form>
          )}
          {isAdmin && !historyOnly && selected.workflowStage !== "STATE" && (
            <p className="verification-hint">
              Admin may review this application, but cannot bypass its assigned review stage.
              <button type="button" className="verification-button" disabled={saving} onClick={() => handleEscalation(selected)}>Escalate to another reviewer</button>
            </p>
          )}
          {isAdmin && !historyOnly && (
            <form className="verification-form" onSubmit={handleAssignment}>
              <h4>Assign or reassign this application</h4>
              <label>
                {stageNames[selected.workflowStage]}
                <select
                  required
                  value={assignmentOfficerId}
                  onChange={(event) => setAssignmentOfficerId(event.target.value)}
                >
                  <option value="">Select an active officer in jurisdiction</option>
                  {assignableOfficers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.fullName} · {officer.email}
                    </option>
                  ))}
                </select>
              </label>
              {assignableOfficers.length === 0 && (
                <p>No active officer is configured for this stage and jurisdiction.</p>
              )}
              <button
                type="submit"
                className="verification-button"
                disabled={saving || !assignmentOfficerId}
              >
                Save assignment
              </button>
            </form>
          )}
        </section>
      )}

      {isAdmin && !historyOnly && (
        <section className="verification-admin">
          <h3>Officer assignments</h3>
          <p>Create officer accounts and assign their level and jurisdiction. New officer passwords are stored as hashes.</p>
          <form className="verification-form" onSubmit={handleOfficerCreate}>
            <label>Full name<input required value={officerForm.fullName} onChange={(event) => setOfficerForm({ ...officerForm, fullName: event.target.value })} /></label>
            <label>Email<input type="email" required value={officerForm.email} onChange={(event) => setOfficerForm({ ...officerForm, email: event.target.value })} /></label>
            <label>Temporary password<input type="password" required minLength={8} value={officerForm.password} onChange={(event) => setOfficerForm({ ...officerForm, password: event.target.value })} /></label>
            <label>Phone<input value={officerForm.phone} onChange={(event) => setOfficerForm({ ...officerForm, phone: event.target.value })} /></label>
            <label>Review level<select value={officerForm.officerLevel} onChange={(event) => setOfficerForm({ ...officerForm, officerLevel: event.target.value })}><option value="FIELD">Field</option><option value="DISTRICT">District</option><option value="STATE">State</option></select></label>
            <label>State<input required value={officerForm.jurisdictionState} onChange={(event) => setOfficerForm({ ...officerForm, jurisdictionState: event.target.value })} /></label>
            {officerForm.officerLevel !== "STATE" && <label>District<input required value={officerForm.jurisdictionDistrict} onChange={(event) => setOfficerForm({ ...officerForm, jurisdictionDistrict: event.target.value })} /></label>}
            <button className="verification-button verification-button--primary" type="submit" disabled={saving}>Add officer</button>
          </form>
          <div className="verification-admin__table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Level</th><th>Jurisdiction</th><th>Action</th></tr></thead>
              <tbody>
                {officers.map((officer) => (
                  <tr key={officer.id}>
                    <td>{officer.fullName}</td><td>{officer.email}</td>
                    <td>{officer.officerLevel || "Unassigned"}</td>
                    <td>{[officer.jurisdictionDistrict, officer.jurisdictionState].filter(Boolean).join(", ")}</td>
                    <td><button className="verification-button" type="button" onClick={() => setEditingOfficer({ ...officer, officerLevel: officer.officerLevel || "FIELD" })}>Edit scope</button></td>
                  </tr>
                ))}
                {officers.length === 0 && <tr><td colSpan="5">No verification officers configured yet.</td></tr>}
              </tbody>
            </table>
          </div>
          {editingOfficer && (
            <form className="verification-form verification-form--edit" onSubmit={handleOfficerUpdate}>
              <h4>Edit {editingOfficer.fullName}</h4>
              <label>Review level<select value={editingOfficer.officerLevel} onChange={(event) => setEditingOfficer({ ...editingOfficer, officerLevel: event.target.value })}><option value="FIELD">Field</option><option value="DISTRICT">District</option><option value="STATE">State</option></select></label>
              <label>State<input required value={editingOfficer.jurisdictionState || ""} onChange={(event) => setEditingOfficer({ ...editingOfficer, jurisdictionState: event.target.value })} /></label>
              {editingOfficer.officerLevel !== "STATE" && <label>District<input required value={editingOfficer.jurisdictionDistrict || ""} onChange={(event) => setEditingOfficer({ ...editingOfficer, jurisdictionDistrict: event.target.value })} /></label>}
              <button className="verification-button verification-button--primary" type="submit" disabled={saving}>Save assignment</button>
              <button className="verification-button" type="button" onClick={() => setEditingOfficer(null)}>Cancel</button>
            </form>
          )}

          <h3>Score, grant amount, and approval routing rules</h3>
          <p>Field and District reviews are mandatory. Each matching rule controls whether State approval is additionally required.</p>
          <form className="verification-form" onSubmit={handleRuleCreate}>
            <label>Minimum score<input type="number" min="0" max="100" step="0.01" required value={ruleForm.minimumScore} onChange={(event) => setRuleForm({ ...ruleForm, minimumScore: event.target.value })} /></label>
            <label>Maximum score<input type="number" min="0" max="100" step="0.01" required value={ruleForm.maximumScore} onChange={(event) => setRuleForm({ ...ruleForm, maximumScore: event.target.value })} /></label>
            <label>Minimum grant amount<input type="number" min="0" step="0.01" required value={ruleForm.minimumAmount} onChange={(event) => setRuleForm({ ...ruleForm, minimumAmount: event.target.value })} /></label>
            <label>Maximum amount (optional)<input type="number" min="0" step="0.01" value={ruleForm.maximumAmount} onChange={(event) => setRuleForm({ ...ruleForm, maximumAmount: event.target.value })} /></label>
            <label>Queue priority<select value={ruleForm.priority} onChange={(event) => setRuleForm({ ...ruleForm, priority: event.target.value })}><option value="NORMAL">Normal</option><option value="PRIORITY">Priority</option><option value="URGENT">Urgent</option></select></label>
            <label>Final state approval<select value={String(ruleForm.stateApprovalRequired)} onChange={(event) => setRuleForm({ ...ruleForm, stateApprovalRequired: event.target.value === "true" })}><option value="true">Required</option><option value="false">Not required after District approval</option></select></label>
            <button className="verification-button verification-button--primary" type="submit" disabled={saving}>{editingRule ? "Save routing rule" : "Add routing rule"}</button>
            {editingRule && <button className="verification-button" type="button" onClick={() => { setEditingRule(null); setRuleForm(emptyRule); }}>Cancel</button>}
          </form>
          <div className="verification-admin__table-wrap">
            <table>
              <thead><tr><th>Score range</th><th>Grant amount range</th><th>Priority</th><th>State approval</th><th>Action</th></tr></thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>{rule.minimumScore}–{rule.maximumScore}</td>
                    <td>{formatAmount(rule.minimumAmount)}–{rule.maximumAmount == null ? "No limit" : formatAmount(rule.maximumAmount)}</td>
                    <td>{rule.priority}</td>
                    <td>{rule.stateApprovalRequired === false ? "Not required" : "Required"}</td>
                    <td>
                      <button className="verification-button" type="button" onClick={() => {
                        setEditingRule(rule);
                        setRuleForm({
                          minimumScore: String(rule.minimumScore),
                          maximumScore: String(rule.maximumScore),
                          minimumAmount: String(rule.minimumAmount),
                          maximumAmount: rule.maximumAmount == null ? "" : String(rule.maximumAmount),
                          priority: rule.priority,
                          stateApprovalRequired: rule.stateApprovalRequired !== false,
                        });
                      }}>Edit</button>{" "}
                      <button className="verification-button" type="button" disabled={saving} onClick={() => handleRuleDelete(rule.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && <tr><td colSpan="5">No custom routing rules. Applications use NORMAL priority and require State approval.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}

export default VerificationWorkflow;
