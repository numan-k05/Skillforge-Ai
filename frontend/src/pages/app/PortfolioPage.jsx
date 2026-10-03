import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Award, Check, ExternalLink, Eye, FileText, FolderKanban, Link2, Plus, RefreshCw, Save, Sparkles, X } from "lucide-react";
import AppNav from "../../components/layout/AppNav.jsx";
import Button from "../../components/ui/Button.jsx";
import { Badge, Card } from "../../components/ui/Card.jsx";
import { ApiError } from "../../services/apiClient.js";
import * as portfolioApi from "../../services/portfolioService.js";
import * as projectApi from "../../services/projectService.js";
import * as skillApi from "../../services/skillService.js";
import "./PortfolioPage.css";

const emptyLink = () => ({ label: "", url: "" });
const emptyAchievement = () => ({ title: "", description: "", achievedOn: "" });

function asForm(portfolio) {
  return {
    slug: portfolio.slug || "",
    isPublic: Boolean(portfolio.isPublic),
    biography: portfolio.biography || "",
    education: portfolio.education || "",
    showCareerGoal: portfolio.showCareerGoal !== false,
    template: portfolio.template || "classic",
    publishConsent: false,
    projectIds: (portfolio.projects || []).map((project) => project.projectId),
    skillIds: (portfolio.skills || []).map((skill) => skill.skillId),
    links: (portfolio.links || []).map(({ label, url }) => ({ label, url })),
    achievements: (portfolio.achievements || []).map(({ title, description, achievedOn }) => ({ title, description: description || "", achievedOn: achievedOn || "" })),
    evidenceEntries: (portfolio.evidenceEntries || []).map((entry, index) => ({ ...entry, displayOrder: index + 1, headline: entry.headline || "", description: entry.description || "" })),
  };
}

export default function PortfolioPage() {
  const [state, setState] = useState({ status: "loading", error: "", portfolio: null, projects: [], skills: [] });
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const [portfolio, projects, skills] = await Promise.all([
        portfolioApi.getMyPortfolio(), projectApi.getMyProjects(), skillApi.getMySkills(),
      ]);
      setState({ status: "ready", error: "", portfolio, projects, skills });
      setForm(asForm(portfolio));
      setNotice("");
    } catch (error) {
      setState({ status: "error", error: error instanceof ApiError ? error.message : "Could not load your portfolio.", portfolio: null, projects: [], skills: [] });
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const completedProjects = useMemo(
    () => state.projects.filter((project) => project.status === "completed"),
    [state.projects]
  );
  const selectedProjects = useMemo(
    () => completedProjects.filter((project) => form?.projectIds.includes(project.projectId)),
    [completedProjects, form]
  );
  const selectedSkills = useMemo(
    () => state.skills.filter((skill) => form?.skillIds.includes(skill.skillId)),
    [state.skills, form]
  );

  function setField(field, value) { setForm((current) => ({ ...current, [field]: value })); setNotice(""); }
  function toggleId(field, id) {
    setForm((current) => ({ ...current, [field]: current[field].includes(id) ? current[field].filter((item) => item !== id) : [...current[field], id] }));
    setNotice("");
  }
  function updateList(field, index, key, value) {
    setForm((current) => ({ ...current, [field]: current[field].map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  }
  function removeListItem(field, index) { setForm((current) => ({ ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) })); }
  function updateEvidence(index, field, value) { setForm((current) => ({ ...current, evidenceEntries: current.evidenceEntries.map((entry, itemIndex) => itemIndex === index ? { ...entry, [field]: value } : entry) })); setNotice(""); }
  function moveEvidence(index, direction) { setForm((current) => { const entries = [...current.evidenceEntries]; const target = index + direction; if (target < 0 || target >= entries.length) return current; [entries[index], entries[target]] = [entries[target], entries[index]]; return { ...current, evidenceEntries: entries.map((entry, itemIndex) => ({ ...entry, displayOrder: itemIndex + 1 })) }; }); }

  async function save(event) {
    event.preventDefault();
    setSaving(true); setNotice("");
    try {
      const profile = await portfolioApi.updateMyPortfolio({
        slug: form.slug.trim().toLowerCase(), isPublic: form.isPublic,
        biography: form.biography.trim() || null, education: form.education.trim() || null,
        showCareerGoal: form.showCareerGoal, template: form.template, publishConsent: form.publishConsent,
      });
      const content = await portfolioApi.updateMyPortfolioContent({
        projectIds: form.projectIds, skillIds: form.skillIds,
        links: form.links.filter((link) => link.label.trim() || link.url.trim()).map((link) => ({ label: link.label.trim(), url: link.url.trim() })),
        achievements: form.achievements.filter((item) => item.title.trim()).map((item) => ({ title: item.title.trim(), description: item.description.trim() || null, achievedOn: item.achievedOn || undefined })),
      });
      const evidence = await portfolioApi.updateMyEvidenceEntries(form.evidenceEntries.map((entry) => ({ entryId: entry.entryId, isVisible: entry.isVisible, showEvidenceLinks: entry.showEvidenceLinks, displayOrder: entry.displayOrder, headline: entry.headline.trim() || null, description: entry.description.trim() || null })));
      const merged = { ...profile, ...content, ...evidence };
      setState((current) => ({ ...current, portfolio: merged }));
      setForm(asForm(merged));
      setNotice("Portfolio saved. Your public visibility setting has been updated.");
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Could not save your portfolio. Please try again.");
    } finally { setSaving(false); }
  }

  if (state.status === "loading") return <PageState icon={<RefreshCw className="spin" size={25} />} title="Loading your portfolio…" detail="Gathering your completed projects and skills." />;
  if (state.status === "error") return <PageState error icon={<FolderKanban size={25} />} title="Portfolio builder is unavailable" detail={state.error} action={<Button variant="secondary" onClick={load}>Try again</Button>} />;

  return <div><AppNav /><main id="main-content" tabIndex="-1" className="container sf-portfolio">
    <header className="sf-portfolio__header">
      <div><p className="sf-portfolio__eyebrow mono"><Sparkles size={14} /> Portfolio builder</p><h1>Shape your public story</h1><p>Choose the work and details you want to share. Nothing becomes visible until you turn on publishing.</p></div>
      <Badge tone={form.isPublic ? "teal" : "neutral"}>{form.isPublic ? "Public" : "Private"}</Badge>
    </header>

    <form onSubmit={save} className="sf-portfolio__layout">
      <div className="sf-portfolio__editor">
        {notice && <div className={`sf-portfolio__notice${notice.startsWith("Portfolio saved") ? " sf-portfolio__notice--success" : ""}`} role={notice.startsWith("Portfolio saved") ? "status" : "alert"}>{notice}</div>}
        <Card className="sf-portfolio__section"><SectionHeading icon={<Eye size={18} />} title="Visibility" detail="Control whether the portfolio can be viewed publicly." />
          <label className="sf-portfolio__toggle"><input type="checkbox" checked={form.isPublic} onChange={(event) => setField("isPublic", event.target.checked)} /><span><strong>Publish my portfolio</strong><small>{form.isPublic ? "Anyone with your future portfolio link will be able to view the selected details." : "Your portfolio stays private and is visible only to you."}</small></span></label>
          {form.isPublic && !state.portfolio.isPublic && <label className="sf-portfolio__toggle"><input type="checkbox" checked={form.publishConsent} onChange={(event) => setField("publishConsent", event.target.checked)} /><span><strong>I consent to publishing the selected information</strong><small>Only selected manual content and evidence entries marked visible will appear publicly.</small></span></label>}
          <label className="sf-portfolio__field"><span>Template</span><select value={form.template} onChange={(event) => setField("template", event.target.value)}><option value="classic">Classic</option><option value="compact">Compact</option><option value="showcase">Showcase</option></select></label>
          <label className="sf-portfolio__field"><span>Public username</span><div className="sf-portfolio__slug"><i>/u/</i><input value={form.slug} onChange={(event) => setField("slug", event.target.value.toLowerCase())} pattern="[a-z0-9][a-z0-9-]{1,78}[a-z0-9]" minLength="3" maxLength="80" required aria-describedby="slug-help" /></div><small id="slug-help">Lowercase letters, numbers, and hyphens only. Your public link is available after publishing.</small></label>
        </Card>

        <Card className="sf-portfolio__section"><SectionHeading icon={<FileText size={18} />} title="About you" detail="Add only information you are comfortable sharing." />
          <label className="sf-portfolio__field"><span>Biography</span><textarea rows="5" maxLength="4000" value={form.biography} onChange={(event) => setField("biography", event.target.value)} placeholder="A short introduction to your interests, strengths, and goals." /><small>{form.biography.length}/4000</small></label>
          <label className="sf-portfolio__field"><span>Education</span><textarea rows="2" maxLength="1000" value={form.education} onChange={(event) => setField("education", event.target.value)} placeholder="e.g. BSc Computer Science, Example University" /><small>{form.education.length}/1000</small></label>
          <label className="sf-portfolio__toggle"><input type="checkbox" checked={form.showCareerGoal} onChange={(event) => setField("showCareerGoal", event.target.checked)} /><span><strong>Show career goal</strong><small>{state.portfolio.careerGoal ? `Current goal: ${state.portfolio.careerGoal}` : "Set a career goal from your dashboard to show it here."}</small></span></label>
        </Card>

        <SelectionSection title="Completed projects" icon={<FolderKanban size={18} />} detail="Only projects you marked completed can be featured." empty="Complete a project first, then return here to feature it." items={completedProjects} selectedIds={form.projectIds} onToggle={(id) => toggleId("projectIds", id)} render={(project) => <><strong>{project.title}</strong><small>{project.projectType} · {project.difficulty}</small></>} />
        <SelectionSection title="Skills" icon={<Check size={18} />} detail="Select the skills you want visitors to see." empty="Add skills in Skill Analysis to feature them here." items={state.skills} selectedIds={form.skillIds} onToggle={(id) => toggleId("skillIds", id)} render={(skill) => <><strong>{skill.name}</strong><small>{skill.category || "Skill"} · Level {skill.level}/5</small></>} />

        <Card className="sf-portfolio__section"><SectionHeading icon={<Sparkles size={18} />} title="Approved evidence" detail="Approval adds entries here privately. You choose what becomes public and whether evidence links are shown." />
          {form.evidenceEntries.length ? <div className="sf-portfolio__evidence-list">{form.evidenceEntries.map((entry, index) => <article className="sf-portfolio__evidence" key={entry.entryId}><div className="sf-portfolio__evidence-head"><div><Badge tone={entry.revoked ? "red" : "teal"}>{entry.revoked ? "Revoked" : "Reviewer approved"}</Badge><h3>{entry.title}</h3></div><div><button type="button" onClick={() => moveEvidence(index, -1)} disabled={index === 0} aria-label={`Move ${entry.title} up`}><ArrowUp size={15} /></button><button type="button" onClick={() => moveEvidence(index, 1)} disabled={index === form.evidenceEntries.length - 1} aria-label={`Move ${entry.title} down`}><ArrowDown size={15} /></button></div></div><label className="sf-portfolio__toggle"><input type="checkbox" checked={entry.isVisible} disabled={entry.revoked} onChange={(event) => updateEvidence(index, "isVisible", event.target.checked)} /><span><strong>Show this approved project</strong><small>Hidden by default, even after approval.</small></span></label><label className="sf-portfolio__field"><span>Public headline</span><input maxLength="200" value={entry.headline} onChange={(event) => updateEvidence(index, "headline", event.target.value)} placeholder={entry.title} /></label><label className="sf-portfolio__field"><span>Public description</span><textarea rows="3" maxLength="4000" value={entry.description} onChange={(event) => updateEvidence(index, "description", event.target.value)} placeholder={entry.reviewedSummary} /></label><label className="sf-portfolio__toggle"><input type="checkbox" checked={entry.showEvidenceLinks} disabled={!entry.isVisible || entry.revoked} onChange={(event) => updateEvidence(index, "showEvidenceLinks", event.target.checked)} /><span><strong>Show reviewed evidence links</strong><small>Repository, demo, and evidence links remain hidden unless selected.</small></span></label></article>)}</div> : <p className="sf-portfolio__empty">Approved project submissions will appear here automatically and remain private.</p>}
        </Card>

        <Card className="sf-portfolio__section"><SectionHeading icon={<Link2 size={18} />} title="Links" detail="Use trusted HTTPS links to share your work elsewhere." />
          <div className="sf-portfolio__repeater">{form.links.map((link, index) => <div className="sf-portfolio__link-row" key={`link-${index}`}><input value={link.label} onChange={(event) => updateList("links", index, "label", event.target.value)} maxLength="80" placeholder="Label (e.g. GitHub)" aria-label="Link label" /><input type="url" value={link.url} onChange={(event) => updateList("links", index, "url", event.target.value)} placeholder="https://" aria-label="Link URL" /><button type="button" className="sf-portfolio__remove" onClick={() => removeListItem("links", index)} aria-label="Remove link"><X size={17} /></button></div>)}</div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setField("links", [...form.links, emptyLink()])} icon={<Plus size={15} />} iconPosition="left">Add link</Button>
        </Card>

        <Card className="sf-portfolio__section"><SectionHeading icon={<Award size={18} />} title="Achievements" detail="Highlight milestones, credentials, awards, or accomplishments." />
          <div className="sf-portfolio__repeater">{form.achievements.map((achievement, index) => <div className="sf-portfolio__achievement" key={`achievement-${index}`}><div><input value={achievement.title} onChange={(event) => updateList("achievements", index, "title", event.target.value)} maxLength="160" placeholder="Achievement title" aria-label="Achievement title" /><textarea rows="2" value={achievement.description} onChange={(event) => updateList("achievements", index, "description", event.target.value)} maxLength="1000" placeholder="Optional description" aria-label="Achievement description" /></div><div className="sf-portfolio__achievement-actions"><input type="date" value={achievement.achievedOn} onChange={(event) => updateList("achievements", index, "achievedOn", event.target.value)} aria-label="Achievement date" /><button type="button" className="sf-portfolio__remove" onClick={() => removeListItem("achievements", index)} aria-label="Remove achievement"><X size={17} /></button></div></div>)}</div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setField("achievements", [...form.achievements, emptyAchievement()])} icon={<Plus size={15} />} iconPosition="left">Add achievement</Button>
        </Card>
      </div>

      <aside className="sf-portfolio__preview"><Card className="sf-portfolio__preview-card"><div className="sf-portfolio__preview-heading"><div><p className="mono">Private preview</p><h2>{state.portfolio?.name || "Your portfolio"}</h2></div><Eye size={19} /></div><p className="sf-portfolio__preview-slug">skillforge.ai/u/{form.slug || "username"}</p>{form.biography ? <p>{form.biography}</p> : <p className="sf-portfolio__muted">Your biography will appear here.</p>}{form.showCareerGoal && state.portfolio.careerGoal && <Badge tone="blue">{state.portfolio.careerGoal}</Badge>}<PreviewList title="Featured projects" items={selectedProjects.map((project) => project.title)} empty="No projects selected" /><PreviewList title="Skills" items={selectedSkills.map((skill) => skill.name)} empty="No skills selected" /><PreviewList title="Achievements" items={form.achievements.filter((item) => item.title.trim()).map((item) => item.title)} empty="No achievements selected" /></Card>
        <Button type="submit" className="sf-portfolio__save" disabled={saving} icon={<Save size={16} />} iconPosition="left">{saving ? "Saving…" : "Save portfolio"}</Button>
        <p className="sf-portfolio__preview-note"><ExternalLink size={14} /> Published at /u/{form.slug || "username"}; visitors see only your selected content.</p>
      </aside>
    </form>
  </main></div>;
}

function SectionHeading({ icon, title, detail }) { return <div className="sf-portfolio__section-heading"><span>{icon}</span><div><h2>{title}</h2><p>{detail}</p></div></div>; }
function SelectionSection({ title, icon, detail, empty, items, selectedIds, onToggle, render }) { return <Card className="sf-portfolio__section"><SectionHeading icon={icon} title={title} detail={detail} />{items.length ? <div className="sf-portfolio__choices">{items.map((item) => { const id = item.projectId || item.skillId; const selected = selectedIds.includes(id); return <label className={`sf-portfolio__choice${selected ? " sf-portfolio__choice--selected" : ""}`} key={id}><input type="checkbox" checked={selected} onChange={() => onToggle(id)} /><span className="sf-portfolio__choice-check"><Check size={14} /></span><span>{render(item)}</span></label>; })}</div> : <p className="sf-portfolio__empty">{empty}</p>}</Card>; }
function PreviewList({ title, items, empty }) { return <section className="sf-portfolio__preview-list"><h3>{title}</h3>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{empty}</p>}</section>; }
function PageState({ icon, title, detail, action, error = false }) { return <div><AppNav /><main id="main-content" tabIndex="-1" className="container sf-portfolio"><Card className={`sf-portfolio__state${error ? " sf-portfolio__state--error" : ""}`}>{icon}<h1>{title}</h1><p>{detail}</p>{action}</Card></main></div>; }
