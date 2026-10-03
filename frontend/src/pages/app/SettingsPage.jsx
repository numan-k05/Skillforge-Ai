import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Settings, Save, ShieldCheck, Trash2 } from "lucide-react";
import AppNav from "../../components/layout/AppNav.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Field } from "../../components/ui/Field.jsx";
import Button from "../../components/ui/Button.jsx";
import { ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import { useAuth } from "../../context/auth.js";
import { useToast } from "../../context/toast.js";
import useRemoteData from "../../hooks/useRemoteData.js";
import { getProfile, updateProfile } from "../../services/profileService.js";
import { deleteAccount, downloadAccountExport, exportAccount, getAccountPrivacy, updatePreferences } from "../../services/accountService.js";
import { setToken } from "../../services/apiClient.js";

function ProfileForm({ profile }) {
  const { user, setUser } = useAuth();
  const notify = useToast();
  const [form, setForm] = useState({ name: user?.name || "", university: profile.university || "", degree: profile.degree || "", country: profile.country || "", weeklyHoursAvailable: profile.weeklyHoursAvailable || "", learningGoals: profile.learningGoals || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function save(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await updateProfile({ ...form, weeklyHoursAvailable: form.weeklyHoursAvailable === "" ? null : Number(form.weeklyHoursAvailable) });
      setUser((current) => ({ ...current, name: form.name.trim() }));
      notify("Your profile settings have been saved.");
    } catch (err) { setError(err.message || "Your changes couldn't be saved."); }
    finally { setSaving(false); }
  }
  return <form onSubmit={save} className="sf-form-grid">
    <Field label="Full name" value={form.name} onChange={change("name")} autoComplete="name" required minLength={2} maxLength={120} />
    <Field label="Email address" value={user?.email || ""} type="email" readOnly hint="Your existing sign-in email." />
    <Field label="University" value={form.university} onChange={change("university")} maxLength={200} />
    <Field label="Degree" value={form.degree} onChange={change("degree")} maxLength={200} />
    <Field label="Country" value={form.country} onChange={change("country")} autoComplete="country-name" maxLength={120} />
    <Field label="Learning hours per week" type="number" value={form.weeklyHoursAvailable} onChange={change("weeklyHoursAvailable")} min={1} max={168} step={1} />
    <Field label="Learning goals" as="textarea" rows={4} value={form.learningGoals} onChange={change("learningGoals")} maxLength={2000} className="sf-full-width" />
    {error && <p role="alert" className="sf-field__error sf-full-width">{error}</p>}
    <div className="sf-inline-actions sf-full-width"><Button type="submit" disabled={saving} icon={<Save size={16} />}>{saving ? "Saving…" : "Save changes"}</Button><Button variant="ghost" to="/portfolio">Public profile settings</Button></div>
  </form>;
}

function PrivacyForm({ value }) {
  const notify = useToast();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [preferences, setPreferences] = useState(value.preferences);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const toggle = (key) => setPreferences((current) => ({ ...current, [key]: !current[key] }));
  async function savePreferences() {
    setBusy("preferences"); setError("");
    try { setPreferences(await updatePreferences(preferences)); notify("Privacy preferences saved."); }
    catch (err) { setError(err.message); } finally { setBusy(""); }
  }
  async function download() {
    setBusy("export"); setError("");
    try { downloadAccountExport(await exportAccount()); notify("Your account export is ready."); }
    catch (err) { setError(err.message); } finally { setBusy(""); }
  }
  async function remove(event) {
    event.preventDefault();
    if (confirmation !== "DELETE") { setError("Type DELETE exactly to confirm account deletion."); return; }
    setBusy("delete"); setError("");
    try { await deleteAccount({ password, confirmation }); setToken(null); navigate("/", { replace: true }); setUser(null); }
    catch (err) { setError(err.message); setBusy(""); }
  }
  return <div className="sf-privacy-settings">
    <Card><h2>Privacy and communication</h2><p>Choose optional messages and whether your portfolio may be public.</p>
      <label className="sf-check-row"><input type="checkbox" checked={preferences.learningReminders} onChange={() => toggle("learningReminders")} /><span><strong>Learning reminders</strong><small>Receive reminders about learning activity.</small></span></label>
      <label className="sf-check-row"><input type="checkbox" checked={preferences.productUpdates} onChange={() => toggle("productUpdates")} /><span><strong>Product updates</strong><small>Receive optional SkillForge product news.</small></span></label>
      <label className="sf-check-row"><input type="checkbox" checked={preferences.publicProfileVisible} onChange={() => toggle("publicProfileVisible")} /><span><strong>Allow a public portfolio</strong><small>Turning this off immediately unpublishes your portfolio. Publishing still requires consent on the portfolio page.</small></span></label>
      <Button onClick={savePreferences} disabled={Boolean(busy)}>{busy === "preferences" ? "Saving…" : "Save privacy preferences"}</Button>
    </Card>
    <Card><h2>Your data</h2><p>Download a JSON copy of account, profile, learning, certificate, and purchase records. Passwords, security tokens, payment signatures, and payout details are excluded.</p><Button variant="secondary" icon={<Download size={16} />} onClick={download} disabled={Boolean(busy)}>{busy === "export" ? "Preparing…" : "Download my data"}</Button></Card>
    <Card className="sf-danger-zone"><h2>Delete account</h2><p>This immediately disables sign-in, removes profile and learning data, and unpublishes your portfolio. Pseudonymous financial, certificate, referral, and audit records may be retained for transaction integrity.</p>
      <form onSubmit={remove} className="sf-form-grid"><Field label="Current password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><Field label="Type DELETE to confirm" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
      <div className="sf-full-width"><Button type="submit" variant="danger" icon={<Trash2 size={16} />} disabled={Boolean(busy)}>{busy === "delete" ? "Deleting…" : "Permanently delete account"}</Button></div></form>
    </Card>{error && <p role="alert" className="sf-field__error">{error}</p>}
  </div>;
}

function PrivacySettings() {
  const { data, error, loading, reload } = useRemoteData(getAccountPrivacy);
  return loading ? <Skeleton /> : error ? <ErrorState message={error.message} onRetry={reload} /> : <PrivacyForm value={data} />;
}
export default function SettingsPage() {
  const { data, error, loading, reload } = useRemoteData(getProfile);
  return <div><AppNav /><main id="main-content" tabIndex={-1} className="container sf-page"><header className="sf-page-heading"><div><span className="sf-eyebrow"><Settings size={16} aria-hidden="true" /> YOUR ACCOUNT</span><h1>Make this space yours.</h1><p>Manage your profile, privacy, data, and account.</p></div></header>{loading ? <Skeleton /> : error ? <ErrorState message={error.message} onRetry={reload} /> : <Card><ProfileForm profile={data} /></Card>}<Card className="sf-settings-security"><ShieldCheck size={22} aria-hidden="true" /><div><h2>Password and account access</h2><p>Use the existing email reset flow to change your password.</p></div><Button variant="secondary" to="/forgot-password">Reset password</Button></Card><PrivacySettings /></main></div>;
}
