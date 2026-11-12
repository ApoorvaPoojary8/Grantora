import { useEffect, useState } from "react";
import api from "../services/api";

export default function WorkflowSettings() {
  const [form, setForm] = useState({ fieldDays: 5, districtDays: 5, stateDays: 5, scanMinutes: 60 });
  const [status, setStatus] = useState("");
  useEffect(() => { api.get("/workflow/deadlines").then(({ data }) => setForm(data)).catch(() => setStatus("Could not load workflow settings.")); }, []);
  const change = (e) => setForm({ ...form, [e.target.name]: Number(e.target.value) });
  const save = async (e) => { e.preventDefault(); setStatus(""); try { const { data } = await api.put("/workflow/deadlines", form); setForm(data); setStatus("Deadline settings saved."); } catch (error) { setStatus(error.response?.data?.message || "Could not save settings."); } };
  return <section className="workflow-settings"><h2>Verification deadlines</h2><p>Deadlines apply when a new workflow task is assigned. Reassignment keeps its current due date.</p><form onSubmit={save}>{[["fieldDays","Field Officer (days)"],["districtDays","District Officer (days)"],["stateDays","State Officer (days)"],["scanMinutes","Overdue scan interval (minutes)"]].map(([name,label])=><label key={name}>{label}<input type="number" min="1" max={name === "scanMinutes" ? "1440" : "365"} required name={name} value={form[name]} onChange={change}/></label>)}<button type="submit">Save settings</button></form>{status && <p role="status">{status}</p>}</section>;
}
