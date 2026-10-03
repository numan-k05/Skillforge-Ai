import { useCallback, useState } from "react";
import { ExternalLink, FileCheck2, Send } from "lucide-react";
import { useParams } from "react-router-dom";
import CatalogLayout from "../../layouts/CatalogLayout.jsx";
import useRemoteData from "../../hooks/useRemoteData.js";
import { getProject } from "../../services/projectService.js";
import { getMySubmission, getMySubmissions, saveEvidenceDraft, submitEvidence } from "../../services/projectSubmissionService.js";
import { Card, Badge } from "../../components/ui/Card.jsx";
import { Field } from "../../components/ui/Field.jsx";
import Button from "../../components/ui/Button.jsx";
import { ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import "./SubmissionsPage.css";

const labels = { draft: "Draft", submitted: "Submitted", under_review: "Under review", approved: "Verified", rejected: "Changes requested" };

export default function ProjectEvidencePage() {
  const { id } = useParams();
  const fetcher = useCallback(async () => {
    const [project, all] = await Promise.all([getProject(id), getMySubmissions()]);
    const summary = all.find((item) => String(item.projectId) === String(id));
    return { project, submission: summary ? await getMySubmission(summary.id) : null };
  }, [id]);
  const { data, error, loading, reload } = useRemoteData(fetcher);
  if (loading) return <CatalogLayout><Skeleton rows={6} /></CatalogLayout>;
  if (error) return <CatalogLayout><ErrorState message={error.message} onRetry={reload} /></CatalogLayout>;
  const stateKey = `${data.submission?.id || "new"}-${data.submission?.version?.number || 0}-${data.submission?.status || "none"}`;
  return <EvidenceContent key={stateKey} data={data} reload={reload} />;
}

function EvidenceContent({ data, reload }) {
  const { id } = useParams();
  const { project, submission } = data;
  const [form, setForm] = useState(() => ({
    summary: submission?.version?.summary || "", repositoryUrl: submission?.version?.repositoryUrl || "",
    demoUrl: submission?.version?.demoUrl || "", evidenceUrl: submission?.version?.evidenceUrl || "",
    milestones: (project.milestones || []).map((entry) => {
      const old = submission?.milestones?.find((item) => String(item.milestoneId) === String(entry.milestoneId));
      return { milestoneId: entry.milestoneId, evidenceNote: old?.evidenceNote || "", evidenceUrl: old?.evidenceUrl || "" };
    }),
  }));
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const editable = !submission || ["draft", "rejected"].includes(submission.status);
  function field(name, value) { setForm((current) => ({ ...current, [name]: value })); }
  function milestone(index, changes) { setForm((current) => ({ ...current, milestones: current.milestones.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) })); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setActionError("");
    try {
      await saveEvidenceDraft(id, { ...form, repositoryUrl: form.repositoryUrl || null, demoUrl: form.demoUrl || null, evidenceUrl: form.evidenceUrl || null,
        milestones: form.milestones.map((item) => ({ ...item, evidenceNote: item.evidenceNote || null, evidenceUrl: item.evidenceUrl || null })) });
      reload();
    } catch (error) { setActionError(error.message); } finally { setBusy(false); }
  }
  async function submit() {
    setBusy(true); setActionError("");
    try { await submitEvidence(submission.id); reload(); }
    catch (error) { setActionError(error.message); } finally { setBusy(false); }
  }
  return <CatalogLayout>
    <header className="sf-page-heading"><div><span className="sf-eyebrow"><FileCheck2 size={16} /> PROJECT EVIDENCE</span><h1>{project.title}</h1><p>Submit links and milestone notes for human review. Reviewers never execute submitted code or fetch private-network resources.</p></div>{submission && <Badge tone={submission.status === "approved" ? "teal" : submission.status === "rejected" ? "red" : "blue"}>{labels[submission.status]}</Badge>}</header>
    {project.userProject?.status === "completed" && submission?.status !== "approved" && <Card className="sf-evidence-note"><div><strong>Existing completion is self-reported.</strong><p>It remains visible, but it becomes verified only after this evidence is approved.</p></div></Card>}
    {actionError && <p role="alert" className="sf-form-error">{actionError}</p>}
    {submission?.review && <Card><h2>Reviewer feedback</h2><p>{submission.review.feedback}</p><small>Decision: {submission.review.decision}</small></Card>}
    {editable ? <Card as="form" className="sf-author-form" onSubmit={save}><h2>{submission?.status === "rejected" ? "Create a revised evidence version" : "Evidence draft"}</h2><Field as="textarea" label="What you built" required value={form.summary} onChange={(event) => field("summary", event.target.value)} hint="Explain your contribution, decisions and result." /><Field label="GitHub repository" type="url" value={form.repositoryUrl} onChange={(event) => field("repositoryUrl", event.target.value)} placeholder="https://github.com/you/project" /><Field label="Live demo" type="url" value={form.demoUrl} onChange={(event) => field("demoUrl", event.target.value)} /><Field label="Additional evidence" type="url" value={form.evidenceUrl} onChange={(event) => field("evidenceUrl", event.target.value)} /><h3>Milestone evidence</h3>{project.milestones.map((item, index) => <div className="sf-milestone-evidence" key={item.milestoneId}><strong>{item.title}</strong><Field label="Evidence note" value={form.milestones[index]?.evidenceNote || ""} onChange={(event) => milestone(index, { evidenceNote: event.target.value })} /><Field label="Evidence link" type="url" value={form.milestones[index]?.evidenceUrl || ""} onChange={(event) => milestone(index, { evidenceUrl: event.target.value })} /></div>)}<Button type="submit" disabled={busy}>Save evidence version</Button></Card> : <EvidenceView submission={submission} />}
    {submission?.status === "draft" && <Card className="sf-submit-panel"><div><h2>Ready for review?</h2><p>Submitting locks this evidence version. A rejected review can be followed by a new version.</p></div><Button onClick={submit} disabled={busy} icon={<Send size={16} />}>Submit for review</Button></Card>}
  </CatalogLayout>;
}

function EvidenceView({ submission }) {
  const version = submission.version;
  return <Card><h2>Submitted evidence · version {version.number}</h2><p>{version.summary}</p><div className="sf-evidence-links">{[[version.repositoryUrl, "Repository"], [version.demoUrl, "Live demo"], [version.evidenceUrl, "Additional evidence"]].filter(([url]) => url).map(([url, label]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer">{label}<ExternalLink size={14} /></a>)}</div>{submission.milestones?.map((item) => <div key={item.milestoneId}><strong>{item.title}</strong><p>{item.evidenceNote}</p></div>)}</Card>;
}
