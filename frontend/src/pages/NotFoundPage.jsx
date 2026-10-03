import { Link } from "react-router-dom";
import "../styles/global.css";

export default function NotFoundPage() {
  return (
    <div
      id="main-content" tabIndex="-1" style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "0.75rem",
        padding: "2rem",
      }}
    >
      <p className="mono" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        404
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)" }}>This page doesn't exist yet.</h1>
      <p style={{ color: "var(--text-secondary)" }}>Check the URL, or head back to the homepage.</p>
      <Link to="/" style={{ color: "var(--accent-blue-strong)", marginTop: "0.5rem" }}>
        ← Back to home
      </Link>
    </div>
  );
}
