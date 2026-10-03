import { Link } from "react-router-dom";
import { Hammer } from "lucide-react";

export default function PlaceholderPage({ title, note }) {
  return (
    <div className="container" style={{ padding: "6rem 0", textAlign: "center" }}>
      <div
        style={{
          width: 56,
          height: 56,
          margin: "0 auto 1.5rem",
          borderRadius: "var(--radius-md)",
          background: "var(--accent-blue-dim)",
          color: "var(--accent-blue-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Hammer size={24} />
      </div>
      <h1 style={{ fontSize: "var(--text-2xl)" }}>{title}</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "0.75rem" }}>{note}</p>
      <Link to="/" style={{ color: "var(--accent-blue-strong)", display: "inline-block", marginTop: "1.5rem" }}>
        ← Back to home
      </Link>
    </div>
  );
}
