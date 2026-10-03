import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, BriefcaseBusiness, ExternalLink, FolderKanban, GraduationCap, Layers3, LoaderCircle, Printer, Sparkles, Target } from "lucide-react";
import { ApiError } from "../../services/apiClient.js";
import * as portfolioApi from "../../services/portfolioService.js";
import { Badge, Card } from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import "./PublicPortfolioPage.css";
import { setPageMeta } from "../../utils/seo.js";

const defaultTitle = "SkillForge Portfolio";

function descriptionFor(portfolio) {
  const bio = portfolio.biography?.trim();
  if (bio) return bio.slice(0, 155);
  return `${portfolio.name}'s portfolio on SkillForge.`;
}

export default function PublicPortfolioPage() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: "loading", portfolio: null });

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) setState({ status: "loading", portfolio: null }); });
    portfolioApi.getPublicPortfolio(slug)
      .then((portfolio) => { if (active) setState({ status: "ready", portfolio }); })
      .catch((error) => { if (active) setState({ status: error instanceof ApiError && error.status === 404 ? "unavailable" : "error", portfolio: null }); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (state.status === "ready" && state.portfolio) {
      setPageMeta({ title: `${state.portfolio.name} — Portfolio`, description: descriptionFor(state.portfolio), type: "profile" });
    } else if (state.status !== "loading") {
      setPageMeta({ title: "Portfolio unavailable", description: "This SkillForge portfolio is unavailable or not published." });
    }
    return () => { document.title = defaultTitle; };
  }, [state]);

  if (state.status === "loading") return <PublicState loading icon={<LoaderCircle className="spin" size={28} />} title="Loading portfolio…" detail="Just a moment while we prepare this profile." />;
  if (state.status === "unavailable") return <PublicState icon={<FolderKanban size={28} />} title="Portfolio unavailable" detail="This portfolio may be private, unpublished, or no longer available." />;
  if (state.status === "error") return <PublicState error icon={<FolderKanban size={28} />} title="Couldn’t load this portfolio" detail="Please check your connection and try again." />;

  const portfolio = state.portfolio;
  return <div className={`sf-public-portfolio sf-public-portfolio--${portfolio.template || "classic"}`}>
    <header className="sf-public-portfolio__nav"><Link to="/" className="sf-public-portfolio__brand"><Sparkles size={18} /> SkillForge</Link><Link to="/signup" className="sf-public-portfolio__join">Build your own <span>→</span></Link></header>
    <main id="main-content" tabIndex="-1">
      <section className="sf-public-portfolio__hero"><div className="sf-public-portfolio__orb" aria-hidden="true" /><div className="sf-public-portfolio__hero-inner"><p className="sf-public-portfolio__eyebrow"><Sparkles size={14} /> Student portfolio</p><h1>{portfolio.name}</h1>{portfolio.careerGoal && <p className="sf-public-portfolio__goal"><Target size={17} /> Aspiring {portfolio.careerGoal}</p>}{portfolio.biography ? <p className="sf-public-portfolio__bio">{portfolio.biography}</p> : <p className="sf-public-portfolio__bio sf-public-portfolio__bio--muted">A SkillForge learner building skills through real projects.</p>}{portfolio.links?.length > 0 && <div className="sf-public-portfolio__links">{portfolio.links.map((link) => <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer noopener"><span>{link.label}</span><ExternalLink size={14} /></a>)}</div>}</div></section>

      <div className="sf-public-portfolio__content">
        {portfolio.education && <Card className="sf-public-portfolio__education"><GraduationCap size={20} /><div><p>Education</p><strong>{portfolio.education}</strong></div></Card>}

        <PortfolioSection icon={<FolderKanban size={19} />} eyebrow="Selected work" title="Featured projects" empty="No projects have been selected for this portfolio yet.">{portfolio.projects?.length > 0 && <div className="sf-public-portfolio__projects">{portfolio.projects.map((project) => <article className="sf-public-project" key={project.slug}><div className="sf-public-project__top"><Badge tone={project.difficulty === "advanced" ? "amber" : "blue"}>{project.difficulty}</Badge><span>{project.projectType}</span></div><h3>{project.title}</h3><p>{project.description || project.shortDescription}</p></article>)}</div>}</PortfolioSection>
        {portfolio.evidenceProjects?.length > 0 && <PortfolioSection icon={<Sparkles size={19} />} eyebrow="Reviewer approved" title="Verified project evidence"><div className="sf-public-portfolio__projects">{portfolio.evidenceProjects.map((project) => <article className="sf-public-project sf-public-project--verified" key={`evidence-${project.slug}`}><div className="sf-public-project__top"><Badge tone="teal">Approved</Badge><span>{project.projectType}</span></div><h3>{project.title}</h3><p>{project.description}</p><div className="sf-public-project__links">{project.repositoryUrl&&<a href={project.repositoryUrl} target="_blank" rel="noreferrer noopener">Repository <ExternalLink size={13}/></a>}{project.demoUrl&&<a href={project.demoUrl} target="_blank" rel="noreferrer noopener">Demo <ExternalLink size={13}/></a>}{project.evidenceUrl&&<a href={project.evidenceUrl} target="_blank" rel="noreferrer noopener">Evidence <ExternalLink size={13}/></a>}</div></article>)}</div></PortfolioSection>}

        <div className="sf-public-portfolio__split"><PortfolioSection icon={<Layers3 size={19} />} eyebrow="Capabilities" title="Skills" compact empty="No skills have been selected yet.">{portfolio.skills?.length > 0 && <div className="sf-public-portfolio__skills">{portfolio.skills.map((skill) => <div className="sf-public-skill" key={`${skill.category}-${skill.name}`}><div><strong>{skill.name}</strong><span>{skill.category || "Skill"}</span></div><span className="sf-public-skill__level">Level {skill.proficiencyLevel}/5</span></div>)}</div>}</PortfolioSection>
          <PortfolioSection icon={<Award size={19} />} eyebrow="Milestones" title="Achievements" compact empty="No achievements have been selected yet.">{portfolio.achievements?.length > 0 && <div className="sf-public-portfolio__achievements">{portfolio.achievements.map((achievement) => <article key={`${achievement.title}-${achievement.achievedOn || ""}`}><strong>{achievement.title}</strong>{achievement.description && <p>{achievement.description}</p>}{achievement.achievedOn && <time dateTime={achievement.achievedOn}>{formatDate(achievement.achievedOn)}</time>}</article>)}</div>}</PortfolioSection></div>
      </div>
    </main>
    <footer className="sf-public-portfolio__footer"><p>Built with <strong>SkillForge</strong></p><div><Button type="button" variant="ghost" size="sm" icon={<Printer size={15}/>} onClick={()=>window.print()}>Print portfolio</Button><Button to="/signup" variant="secondary" size="sm" icon={<BriefcaseBusiness size={15} />}>Create your portfolio</Button></div></footer>
  </div>;
}

function PortfolioSection({ icon, eyebrow, title, empty, children, compact = false }) { const hasContent = Boolean(children); return <section className={`sf-public-portfolio__section${compact ? " sf-public-portfolio__section--compact" : ""}`}><div className="sf-public-portfolio__heading"><span>{icon}</span><div><p>{eyebrow}</p><h2>{title}</h2></div></div>{hasContent ? children : <div className="sf-public-portfolio__empty">{empty}</div>}</section>; }
function PublicState({ icon, title, detail, loading = false, error = false }) { useEffect(() => { document.title = `${title} | ${defaultTitle}`; setDescription(detail); return () => { document.title = defaultTitle; }; }, [title, detail]); return <div className="sf-public-portfolio"><header className="sf-public-portfolio__nav"><Link to="/" className="sf-public-portfolio__brand"><Sparkles size={18} /> SkillForge</Link></header><main id="main-content" tabIndex="-1" className="sf-public-portfolio__state-wrap"><Card className={`sf-public-portfolio__state${error ? " sf-public-portfolio__state--error" : ""}`}>{icon}<h1>{title}</h1><p>{detail}</p>{!loading && <Button to="/" variant="secondary">Back to SkillForge</Button>}</Card></main></div>; }
function formatDate(value) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString(undefined, { month: "short", year: "numeric" }); }
function setDescription(content) { let meta = document.querySelector('meta[name="description"]'); if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); } meta.content = content; }
