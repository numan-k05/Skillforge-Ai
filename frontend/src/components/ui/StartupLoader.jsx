export default function StartupLoader({ message = "Getting things ready for you…" }) {
  return (
    <main id="main-content" tabIndex={-1} className="sf-startup" role="status" aria-live="polite" aria-label={message}>
      <div className="sf-startup__content">
        <div className="sf-startup__symbol" aria-hidden="true">
          <div className="sf-startup__mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3v12M18 9a6 6 0 0 1-6 6H6" />
              <circle cx="6" cy="18" r="3" /><circle cx="18" cy="6" r="3" />
            </svg>
          </div>
        </div>
        <p className="sf-startup__brand" aria-hidden="true">SkillForge <span>AI</span></p>
        <p className="sf-startup__message" aria-hidden="true">{message}</p>
        <div className="sf-startup__track" aria-hidden="true"><span /></div>
        <p className="sf-startup__caption" aria-hidden="true">Skills. Direction. Progress.</p>
      </div>
    </main>
  );
}
