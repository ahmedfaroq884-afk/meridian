import { useState } from "react";
import type { FormEvent } from "react";
import type {
  EducationAgent,
  EducationAgentConsent,
  EducationApplicationStatus,
  EducationCommissionAgreement,
  EducationLead,
  EducationPaymentStatus,
  EducationReferral,
} from "../lib/types";

const applicationStatuses: EducationApplicationStatus[] = [
  "assigned", "application-in-progress", "offer-received", "enrolled", "declined", "withdrawn", "completed",
];
const paymentStatuses: EducationPaymentStatus[] = [
  "not-due", "pending", "partially-received", "received", "disputed", "not-payable",
];

type AgreementInput = Omit<EducationCommissionAgreement, "id" | "created_at" | "is_active">;
type AssignmentInput = {
  studentLeadId: string;
  agentId: string;
  agreementId: string;
  consentedAt: string;
  consentMethod: EducationAgentConsent["consent_method"];
  evidenceReference: string;
  commissionBaseAmount: number;
};
type ReferralUpdate = Pick<EducationReferral, "application_status" | "actual_received_amount" | "commission_base_amount" | "payment_status" | "payment_note">;

interface Props {
  leads: EducationLead[];
  agents: EducationAgent[];
  agreements: EducationCommissionAgreement[];
  consents: EducationAgentConsent[];
  referrals: EducationReferral[];
  error: string;
  onRefresh: () => void;
  onCreateAgent: (input: Pick<EducationAgent, "email" | "display_name">) => Promise<void>;
  onCreateAgreement: (input: AgreementInput) => Promise<void>;
  onAssign: (input: AssignmentInput) => Promise<void>;
  onUpdateReferral: (id: string, changes: ReferralUpdate) => Promise<void>;
  onRevoke: (studentLeadId: string, agentId: string) => Promise<void>;
}

function localDateTime() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function csvValue(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function exportStudentLeads(leads: EducationLead[]) {
  const columns: Array<keyof EducationLead> = [
    "id", "created_at", "full_name", "email", "phone_number", "current_country", "university_preference",
    "study_level", "intended_subject", "intake", "highest_qualification", "tuition_budget",
    "additional_message", "agent_intro_requested", "language",
  ];
  const content = [
    columns.join(","),
    ...leads.map((lead) => columns.map((column) => csvValue(lead[column])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `meridian-education-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function EducationAdminSection({
  leads, agents, agreements, consents, referrals, error, onRefresh,
  onCreateAgent, onCreateAgreement, onAssign, onUpdateReferral, onRevoke,
}: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agreementAgentId, setAgreementAgentId] = useState("");
  const [agreementReference, setAgreementReference] = useState("");
  const [agreementDate, setAgreementDate] = useState("");
  const [agreementValidFrom, setAgreementValidFrom] = useState("");
  const [agreementValidUntil, setAgreementValidUntil] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [commissionBasis, setCommissionBasis] = useState("");
  const [currencyCode, setCurrencyCode] = useState("MYR");
  const [consentedAt, setConsentedAt] = useState(localDateTime);
  const [consentMethod, setConsentMethod] = useState<EducationAgentConsent["consent_method"]>("email");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [commissionBase, setCommissionBase] = useState("0");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [financeDrafts, setFinanceDrafts] = useState<Record<string, ReferralUpdate>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];
  const referral = referrals.find((item) => item.student_lead_id === selectedLead?.id);
  const referralConsent = consents.find((item) => item.student_lead_id === selectedLead?.id && item.agent_id === referral?.agent_id);
  const availableAgreements = agreements.filter((item) =>
    item.agent_id === agreementAgentId
    && item.is_active
    && item.valid_from <= new Date().toISOString().slice(0, 10)
    && (!item.valid_until || item.valid_until >= new Date().toISOString().slice(0, 10)));
  const selectedAgent = agents.find((item) => item.id === referral?.agent_id);
  const agreement = agreements.find((item) => item.id === referral?.agreement_id);
  const finance = referral ? financeDrafts[referral.id] ?? {
    application_status: referral.application_status,
    actual_received_amount: referral.actual_received_amount,
    commission_base_amount: referral.commission_base_amount,
    payment_status: referral.payment_status,
    payment_note: referral.payment_note,
  } : null;

  const run = async (action: () => Promise<void>, successMessage: string) => {
    setMessage("");
    setBusy(true);
    try { await action(); setMessage(successMessage); }
    catch (actionError) { setMessage(actionError instanceof Error ? actionError.message : "The change could not be saved."); }
    finally { setBusy(false); }
  };

  const saveAgent = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await onCreateAgent({ display_name: agentName, email: agentEmail });
      setAgentName(""); setAgentEmail("");
    }, "Agent added.");
  };

  const saveAgreement = (event: FormEvent) => {
    event.preventDefault();
    if (!agreementAgentId || commissionRate === "") { setMessage("Choose an agent and enter the agreed commission percentage."); return; }
    const rate = Number(commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) { setMessage("The written commission rate must be between 0 and 100 percent."); return; }
    void run(async () => {
      await onCreateAgreement({
        agent_id: agreementAgentId,
        agreement_reference: agreementReference,
        written_agreement_date: agreementDate,
        valid_from: agreementValidFrom,
        valid_until: agreementValidUntil || null,
        commission_rate: rate,
        commission_basis: commissionBasis,
        currency_code: currencyCode.trim().toUpperCase(),
      });
      setAgreementReference(""); setAgreementDate(""); setAgreementValidFrom(""); setAgreementValidUntil("");
      setCommissionRate(""); setCommissionBasis("");
    }, "Written agreement saved.");
  };

  const assignLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLead || !consentConfirmed) return;
    const form = new FormData(event.currentTarget);
    const agentId = String(form.get("agentId") ?? "");
    const agreementId = String(form.get("agreementId") ?? "");
    const amount = Number(commissionBase);
    if (!agentId || !agreementId || !Number.isFinite(amount) || amount < 0) {
      setMessage("Choose a current agent agreement and enter a valid commission base amount.");
      return;
    }
    void run(async () => {
      await onAssign({
        studentLeadId: selectedLead.id,
        agentId,
        agreementId,
        consentedAt: new Date(consentedAt).toISOString(),
        consentMethod,
        evidenceReference,
        commissionBaseAmount: amount,
      });
      setEvidenceReference(""); setConsentConfirmed(false);
    }, "Referral assigned. The agent can access the enquiry only while consent remains active.");
  };

  const saveFinance = (event: FormEvent) => {
    event.preventDefault();
    if (!referral || !finance) return;
    void run(() => onUpdateReferral(referral.id, finance), "Referral and payment tracking saved.");
  };

  const setFinance = <K extends keyof ReferralUpdate>(key: K, value: ReferralUpdate[K]) => {
    if (!referral || !finance) return;
    setFinanceDrafts((current) => ({ ...current, [referral.id]: { ...finance, [key]: value } }));
  };

  const agentForLead = selectedLead?.agent_intro_requested === true;

  return <div className="education-admin">
    <header className="admin-heading">
      <div><h1>Education referrals</h1><p>Student enquiries, specific-agent consent, agreements and referral receipts.</p></div>
      <div className="admin-actions"><button className="button button-outline small-button" onClick={onRefresh}>Refresh</button><button className="button button-outline small-button" onClick={() => exportStudentLeads(leads)} disabled={!leads.length}>Export enquiries</button></div>
    </header>
    {error && <div className="error-state" role="alert">{error} <button className="button small-button" onClick={onRefresh}>Retry</button></div>}
    {message && <div className={message.includes("could") || message.includes("Choose") || message.includes("must") ? "error-state" : "success-inline"} role="status">{message}</div>}

    <div className="education-admin-grid">
      <section className="admin-panel">
        <div className="panel-head"><h2>Student enquiries</h2><span className="badge">{leads.length} records</span></div>
        {!leads.length ? <div className="empty-state"><h3>No study enquiries</h3><p>Student submissions appear here after the education migration is installed.</p></div> :
          <div className="education-lead-list">{leads.map((lead) => <button type="button" key={lead.id} className={`education-lead-select${selectedLead?.id === lead.id ? " active" : ""}`} onClick={() => { setSelectedLeadId(lead.id); setConsentConfirmed(false); setMessage(""); }}>
            <span><strong>{lead.full_name}</strong><small>{lead.intended_subject} · {lead.current_country}</small></span><span className="education-lead-date">{new Date(lead.created_at).toLocaleDateString()}</span>
          </button>)}</div>}
      </section>

      <section className="admin-panel">
        <div className="panel-head"><h2>Agents and agreements</h2><span className="badge">{agents.length} agents</span></div>
        <div className="panel-body education-admin-forms">
          <p className="education-admin-note">Add an existing confirmed Supabase Auth account. Only active agent emails that match a confirmed login can access assigned student details.</p>
          <form className="education-admin-form" onSubmit={saveAgent}>
            <h3>Add an agent</h3>
            <div className="admin-controls"><input required maxLength={160} aria-label="Agent name" placeholder="Agent or business name" value={agentName} onChange={(event) => setAgentName(event.target.value)} /><input required type="email" maxLength={320} aria-label="Confirmed account email" placeholder="Confirmed account email" value={agentEmail} onChange={(event) => setAgentEmail(event.target.value)} /><button className="button small-button" disabled={busy}>Add agent</button></div>
          </form>
          <form className="education-admin-form" onSubmit={saveAgreement}>
            <h3>Record a written commission agreement</h3>
            <p className="education-admin-note">Enter the percentage and calculation basis exactly as agreed in writing. No default split is assumed.</p>
            <div className="education-admin-form-grid">
              <label>Agent<select required value={agreementAgentId} onChange={(event) => setAgreementAgentId(event.target.value)}><option value="">Choose an agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.display_name} · {agent.email}</option>)}</select></label>
              <label>Agreement reference<input required maxLength={200} value={agreementReference} onChange={(event) => setAgreementReference(event.target.value)} /></label>
              <label>Written on<input required type="date" value={agreementDate} onChange={(event) => setAgreementDate(event.target.value)} /></label>
              <label>Valid from<input required type="date" value={agreementValidFrom} onChange={(event) => setAgreementValidFrom(event.target.value)} /></label>
              <label>Valid until (optional)<input type="date" value={agreementValidUntil} onChange={(event) => setAgreementValidUntil(event.target.value)} /></label>
              <label>Commission rate (%)<input required type="number" min="0" max="100" step="0.01" value={commissionRate} onChange={(event) => setCommissionRate(event.target.value)} /></label>
              <label>Commission currency<input required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)} /></label>
              <label>Calculation basis<input required maxLength={500} value={commissionBasis} onChange={(event) => setCommissionBasis(event.target.value)} placeholder="As stated in the written agreement" /></label>
            </div>
            <button className="button button-outline small-button" disabled={busy || !agents.some((agent) => agent.id === agreementAgentId)}>Save agreement</button>
          </form>
          {!!agreements.length && <div className="education-agreement-list"><h3>Recorded agreements</h3>{agreements.map((item) => <p key={item.id}><strong>{agents.find((agent) => agent.id === item.agent_id)?.display_name ?? "Agent"}</strong> · {item.commission_rate}% · {item.currency_code} · {item.agreement_reference}{item.is_active ? "" : " · inactive"}</p>)}</div>}
        </div>
      </section>
    </div>

    {selectedLead && <section className="admin-panel education-student-detail">
      <div className="panel-head"><h2>{selectedLead.full_name}</h2><span className="badge">{selectedLead.study_level}</span></div>
      <div className="panel-body">
        <div className="education-student-facts">
          <span><b>Email</b><a href={`mailto:${encodeURIComponent(selectedLead.email)}`}>{selectedLead.email}</a></span>
          <span><b>Phone</b>{selectedLead.phone_number || "Not provided"}</span>
          <span><b>Current country</b>{selectedLead.current_country}</span>
          <span><b>University preference</b>{selectedLead.university_preference || "Not specified"}</span>
          <span><b>Intended subject</b>{selectedLead.intended_subject}</span>
          <span><b>Intake</b>{selectedLead.intake || "Not specified"}</span>
          <span><b>Qualification</b>{selectedLead.highest_qualification}</span>
          <span><b>Tuition budget</b>{selectedLead.tuition_budget}</span>
          <span><b>Student asked about an agent introduction</b>{selectedLead.agent_intro_requested ? "Yes" : "No"}</span>
          <span><b>Enquiry received</b>{new Date(selectedLead.created_at).toLocaleString()}</span>
          {selectedLead.additional_message && <span className="education-student-message"><b>Student message</b>{selectedLead.additional_message}</span>}
        </div>
      </div>

      {!referral && <div className="education-assignment">
        {!agentForLead ? <p className="education-admin-note">The student did not request an agent introduction. Do not share their details with an agent.</p> :
          <form onSubmit={assignLead}>
            <h3>Record named-agent consent and assign</h3>
            <p className="education-admin-note">First identify the specific agent and referral arrangement to the student and obtain their agreement. The information below records that consent; it does not replace the conversation.</p>
            <div className="education-admin-form-grid">
              <label>Specific agent<select required name="agentId" onChange={(event) => setAgreementAgentId(event.target.value)} defaultValue=""><option value="">Choose an active agent</option>{agents.filter((agent) => agent.is_active).map((agent) => <option key={agent.id} value={agent.id}>{agent.display_name}</option>)}</select></label>
              <label>Current written agreement<select required name="agreementId" defaultValue=""><option value="">Choose a valid agreement</option>{availableAgreements.map((item) => <option key={item.id} value={item.id}>{item.commission_rate}% · {item.currency_code} · {item.commission_basis}</option>)}</select></label>
              <label>Consent date and time<input required type="datetime-local" value={consentedAt} onChange={(event) => setConsentedAt(event.target.value)} /></label>
              <label>How consent was obtained<select required value={consentMethod} onChange={(event) => setConsentMethod(event.target.value as EducationAgentConsent["consent_method"])}><option value="email">Email</option><option value="written">Other written record</option><option value="phone">Phone</option><option value="video">Video call</option><option value="other">Other</option></select></label>
              <label>Evidence reference<input required minLength={2} maxLength={500} value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} placeholder="Record location or reference; do not paste sensitive documents" /></label>
              <label>Commission base amount<input required type="number" min="0" step="0.01" value={commissionBase} onChange={(event) => setCommissionBase(event.target.value)} /></label>
            </div>
            <label className="education-admin-confirm"><input type="checkbox" checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} /><span>I have identified this agent and the relevant referral arrangement to the student, received their permission to share these specific details, and recorded the evidence reference above.</span></label>
            <button className="button" type="submit" disabled={busy || !consentConfirmed || !selectedLead.agent_intro_requested}>Assign and share consented details</button>
          </form>}
      </div>}

      {referral && <div className="education-assignment">
        <div className="panel-head education-assignment-heading"><h3>Referral record</h3><span className={`badge${referralConsent?.revoked_at ? " warn" : " good"}`}>{referralConsent?.revoked_at ? "Agent access revoked" : "Agent access active"}</span></div>
        <div className="panel-body education-admin-note">
          <p>Assigned to <strong>{selectedAgent?.display_name ?? "Inactive agent"}</strong> under {agreement?.agreement_reference ?? "the recorded agreement"} on {new Date(referral.assigned_at).toLocaleString()}.</p>
          <p>Consent: {referralConsent ? `${referralConsent.consent_method} · ${new Date(referralConsent.consented_at).toLocaleString()} · ${referralConsent.evidence_reference}` : "Consent evidence not found."}</p>
          {!referralConsent?.revoked_at && <button className="button button-outline small-button" disabled={busy} onClick={() => {
            if (window.confirm("Revoke this agent's access to the student's details? The referral and payment record will be kept for audit.")) {
              void run(() => onRevoke(selectedLead.id, referral.agent_id), "Agent access revoked. The referral record was retained.");
            }
          }}>Revoke agent access</button>}
        </div>
        {finance && <form className="panel-body education-admin-form" onSubmit={saveFinance}>
          <h3>Application and commission tracking</h3>
          <div className="education-admin-form-grid">
            <label>Application status<select value={finance.application_status} onChange={(event) => setFinance("application_status", event.target.value as EducationApplicationStatus)}>{applicationStatuses.map((status) => <option key={status} value={status}>{status.replace(/-/g, " ")}</option>)}</select></label>
            <label>Commission base amount ({referral.currency_code})<input required type="number" min="0" step="0.01" value={finance.commission_base_amount} onChange={(event) => setFinance("commission_base_amount", Number(event.target.value))} /></label>
            <label>Agreed rate<input readOnly value={`${referral.commission_rate_snapshot}%`} /></label>
            <label>Expected commission<input readOnly value={`${referral.currency_code} ${(finance.commission_base_amount * referral.commission_rate_snapshot / 100).toFixed(2)}`} /></label>
            <label>Amount received ({referral.currency_code})<input required type="number" min="0" step="0.01" value={finance.actual_received_amount} onChange={(event) => setFinance("actual_received_amount", Number(event.target.value))} /></label>
            <label>Payment status<select value={finance.payment_status} onChange={(event) => setFinance("payment_status", event.target.value as EducationPaymentStatus)}>{paymentStatuses.map((status) => <option key={status} value={status}>{status.replace(/-/g, " ")}</option>)}</select></label>
            <label className="education-admin-wide">Payment note<input maxLength={1000} value={finance.payment_note} onChange={(event) => setFinance("payment_note", event.target.value)} /></label>
          </div>
          <button className="button button-outline small-button" disabled={busy}>Save referral tracking</button>
        </form>}
      </div>}
    </section>}
  </div>;
}
