import { Check, ArrowRight, Info, Clock3, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth.js";
import Button from "../../components/ui/Button.jsx";
import useRemoteData from '../../hooks/useRemoteData.js';
import {getProducts} from '../../services/commerceService.js';
import "./PricingPage.css";

const fetchPrices=()=>getProducts();
function productPrice(products,kind){
  const prices=(products||[]).filter(p=>p.kind===kind&&p.manualPrice).map(p=>p.manualPrice.amountMinor/100);
  if(!prices.length)return 'See selection';
  const min=Math.min(...prices),max=Math.max(...prices);
  return `PKR ${min.toLocaleString()}${min===max?'':` – ${max.toLocaleString()}`}`;
}

const PLANS = [
  {
    name: "SkillForge Free",
    price: "$0",
    cadence: "forever",
    description: "Explore skills and careers, build a learning plan, and use the core planning workflow without payment.",
    features: ["Skill and career exploration", "Skill-gap analysis and roadmaps", "Daily missions and progress tracking", "Course previews and free learning resources", "Free projects, portfolio, and readiness tools"],
    note: "Full Skill Pass lessons, final assessments, premium projects, and completion certificates require access to the related Skill Pass.",
    status: "available",
    cta: "Start free",
  },
  {
    name: "Skill Pass",
    price: "PKR 999",
    cadence: "one-time per skill",
    description: "Permanent access to one complete skill track after a verified purchase or administrative grant.",
    features: ["One complete course (18–28 estimated hours)", "One final assessment", "Two practical portfolio projects", "Certificate eligibility after requirements", "Permanent access to that Skill Pass"],
    note: "Certificate issuance requires the specified lessons and assessment, approval of both required projects, and the required evidence-readiness score.",
    status: "preview",
    highlighted: true,
    previewPath: "/store?type=skill_pass",
    previewCta: "Choose a skill",
  },
  {
    name: "Career Bundle",
    price: "PKR 1,999",
    cadence: "one-time per bundle",
    description: "A permanent collection of related skills organized around one career direction.",
    features: ["Multiple connected skill tracks", "Career-focused projects", "Track assessments", "Career completion certificate", "Bundle discount"],
    note: "Five prepared bundles cover Frontend Developer, Backend Developer, Full Stack Developer, Python Developer, and Data Analyst paths. Review the included courses and exact PKR price before paying.",
    status: "preview",
    previewPath: "/store?type=career_bundle",
    previewCta: "Choose a career",
  },
  {
    name: "SkillForge Pro Annual",
    price: "$77.99",
    cadence: "per year",
    description: "Access every published premium track while the annual membership is active.",
    features: ["All premium skill tracks", "All career bundles", "New content during membership", "Premium projects and certificates", "Lower annual effective price"],
    status: "future",
    reason: "Recurring billing, renewal, cancellation, grace periods, and subscription access expiration are not implemented yet.",
  },
  {
    name: "SkillForge Pro Monthly",
    price: "PKR 649",
    cadence: "per 30 days",
    description: "Thirty days of access to every published Skill Pass and Career Bundle after manual payment approval.",
    features: ["All published premium skill tracks", "All published career bundles", "Premium projects and assessments", "Certificate eligibility while access is active", "Manual renewal extends the current expiry"],
    note: "No automatic charge. Each renewal uses manual payment review. If you do not renew, premium access ends on the displayed expiry date while your completed progress remains saved.",
    status: "preview",
    subscription: true,
    previewCta: "Choose monthly access",
  },
  {
    name: "Founding All Access",
    price: "$120.99",
    cadence: "one-time lifetime offer",
    description: "A limited founding offer for permanent access to the growing premium catalog.",
    features: ["Permanent all-access account", "Existing premium tracks", "Future premium tracks", "Founding member recognition", "Single payment"],
    status: "future",
    reason: "A lifetime offer needs a substantial content catalog and should be available only for a limited launch period.",
  },
];

const STATUS_LABELS = { available: "Available now", preview: "Manual payment available", preparing: "Preparing for launch", future: "Future phase" };

export default function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {data:products}=useRemoteData(fetchPrices);
  const startFree = () => navigate(isAuthenticated ? "/dashboard" : "/signup");

  return (
    <section className="pricing" aria-labelledby="pricing-title">
      <div className="container">
        <div className="section-head pricing__head">
          <p className="pricing__eyebrow">SkillForge plans</p>
          <h1 id="pricing-title">Start free. Choose one skill or a career bundle.</h1>
          <p>Choose your skill or career first, review its price, then pay by bank transfer or Easypaisa. Your selection unlocks after owner approval.</p>
        </div>

        <div className="pricing__notice" role="status">
          <Info size={18} aria-hidden="true" />
          <span><strong>Manual payment with owner verification.</strong> Upload your transaction reference and screenshot after transferring the exact PKR amount. Other premium selections remain locked.</span>
        </div>

        <div className="pricing__grid">
          {PLANS.map((plan) => {
            const available = plan.status === "available";
            const monthly=plan.subscription?products?.find(product=>product.kind==='subscription'):null;
            const previewPath=monthly?`/purchase/${monthly.id}/confirm`:plan.previewPath;
            const previewable = Boolean(previewPath);
            return (
              <article
                key={plan.name}
                className={`pricing-card ${plan.highlighted ? "pricing-card--highlighted" : ""}`}
              >
                <span className={`pricing-card__status pricing-card__status--${plan.status}`}>
                  {available || plan.status === "preview" ? <Check size={13} aria-hidden="true" /> : <Clock3 size={13} aria-hidden="true" />}
                  {STATUS_LABELS[plan.status]}
                </span>
                {plan.highlighted && <span className="pricing-card__flag">Recommended first paid plan</span>}
                <h2 className="pricing-card__name">{plan.name}</h2>
                <p className="pricing-card__price">{plan.name==='Skill Pass'?productPrice(products,'skill_pass'):plan.name==='Career Bundle'?productPrice(products,'career_bundle'):plan.price} <span>{plan.cadence}</span></p>
                <p className="pricing-card__desc">{plan.description}</p>
                <ul className="pricing-card__features">
                  {plan.features.map((feature) => <li key={feature}><Check size={15} aria-hidden="true" />{feature}</li>)}
                </ul>
                {plan.note && <p className="pricing-card__availability">{plan.note}</p>}
                {plan.missing && <div className="pricing-card__missing"><strong>Still needed before launch</strong><ul>{plan.missing.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                {plan.reason && <div className="pricing-card__reason"><LockKeyhole size={15} aria-hidden="true" /><p><strong>Why it is not available:</strong> {plan.reason}</p></div>}
                <Button
                  variant={available || previewable ? "primary" : "secondary"}
                  size="md"
                  onClick={available ? startFree : undefined}
                  to={previewPath}
                  disabled={!available && !previewable ? true : undefined}
                  className="pricing-card__cta"
                >
                  {available ? (isAuthenticated ? "Open dashboard" : plan.cta) : previewable ? (plan.previewCta || "View Skill Pass courses") : STATUS_LABELS[plan.status]}
                  {(available || previewable) && <ArrowRight size={16} aria-hidden="true" />}
                </Button>
              </article>
            );
          })}
        </div>

        <div className="pricing__bottom">
          <h2>How your access works</h2>
          <p>Start Free to explore and plan. Choose a Skill Pass for one course or a Career Bundle for its listed courses. Review the exact content and price before checkout. After confirmed payment, open My access to see only your selected product&apos;s material.</p>
          <Button variant="primary" size="lg" onClick={startFree}>{isAuthenticated ? "Open your dashboard" : "Create your free account"}<ArrowRight size={18} aria-hidden="true" /></Button>
        </div>
      </div>
    </section>
  );
}
