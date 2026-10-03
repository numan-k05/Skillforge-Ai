import { FileText } from "lucide-react";
import "./PublicMarketingPage.css";

const CONTENT = {
  privacy: { title: "Privacy notice", intro: "This notice describes the data SkillForge AI currently processes and the controls available in the product.", sections: [
    ["Data we use", "Account and profile details, learning activity, submitted project evidence, portfolio choices, purchases, certificates, referrals, and security/audit records needed to provide the service."],
    ["Your controls", "Account settings provide communication choices, public-profile control, a JSON data export, and reauthenticated account deletion."],
    ["Retention", "Account deletion removes profile and learning data and anonymizes the account. Pseudonymous financial, certificate, referral, and audit records may be retained where needed for transaction integrity and abuse prevention."],
    ["Contact and legal identity", "OWNER REVIEW REQUIRED: add the service operator’s legal name, postal address, privacy contact, applicable jurisdiction, retention periods, and legally required request process before production release."],
  ]},
  terms: { title: "Terms of use", intro: "These draft product terms explain the current service boundaries and require owner/legal review before production use.", sections: [
    ["Learning service", "SkillForge provides learning tools, evidence workflows, and SkillForge completion certificates. It does not provide an accredited degree, professional license, or employment guarantee."],
    ["Account responsibilities", "Users must provide accurate account information, protect their sign-in credentials, and submit only content and links they are allowed to share."],
    ["Payments and access", "Permanent access is granted only after the server verifies a successful payment event. Production merchant terms and payment-provider terms are not yet active."],
    ["Owner review", "OWNER REVIEW REQUIRED: add the operator’s legal identity, governing law, age requirements, acceptable-use rules, liability terms, dispute process, and effective date before production release."],
  ]},
  refunds: { title: "Refund disclosure", intro: "The application supports audited refund and dispute states, but no production payment provider or final refund policy is active.", sections: [
    ["Current behavior", "A verified refund or dispute revokes access supplied by that purchase while preserving access granted by another valid order."],
    ["Manual payments", "Select a product, transfer its exact PKR price to a listed payment account, and submit proof. Access starts only after the owner verifies the received payment. Screenshots are private payment records. Do not send passwords, PINs, or OTPs."],
    ["Owner review", "OWNER REVIEW REQUIRED: define eligibility, request deadlines, regional cancellation rights, contact details, processing times, exceptions, and the production merchant’s legal identity before accepting real payments."],
  ]},
};

export default function LegalPage({ type }) {
  const page = CONTENT[type];
  return <div className="public-page"><div className="container"><header className="public-page__hero"><span className="public-page__eyebrow"><FileText size={18} /> POLICY</span><h1>{page.title}</h1><p>{page.intro}</p></header>{page.sections.map(([title, text]) => <section className="public-section" key={title}><h2>{title}</h2><p>{text}</p></section>)}</div></div>;
}
