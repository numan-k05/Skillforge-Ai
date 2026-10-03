import "./SkillGraph.css";

/**
 * A literal rendering of the product's core mental model: skills as nodes,
 * dependencies as edges, and one path lit up as "the recommended route."
 * This replaces a generic hero gradient/blob with something that explains
 * the product on sight.
 */
const NODES = [
  { id: "html", label: "HTML", x: 40, y: 60, state: "done" },
  { id: "css", label: "CSS", x: 40, y: 160, state: "done" },
  { id: "js", label: "JavaScript", x: 180, y: 110, state: "active" },
  { id: "git", label: "Git", x: 40, y: 260, state: "done" },
  { id: "react", label: "React", x: 330, y: 60, state: "next" },
  { id: "node", label: "Node.js", x: 330, y: 160, state: "locked" },
  { id: "sql", label: "SQL", x: 330, y: 260, state: "locked" },
  { id: "api", label: "APIs", x: 470, y: 110, state: "locked" },
  { id: "deploy", label: "Deploy", x: 470, y: 220, state: "locked" },
];

const EDGES = [
  ["html", "js"],
  ["css", "js"],
  ["git", "js"],
  ["js", "react"],
  ["js", "node"],
  ["node", "sql"],
  ["react", "api"],
  ["node", "api"],
  ["api", "deploy"],
  ["sql", "deploy"],
];

const STATE_COLOR = {
  done: "var(--accent-teal)",
  active: "var(--accent-blue-strong)",
  next: "var(--accent-blue)",
  locked: "var(--border-strong)",
};

function nodeById(id) {
  return NODES.find((n) => n.id === id);
}

export default function SkillGraph() {
  return (
    <svg
      className="skill-graph"
      viewBox="0 0 520 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Diagram of skills connected as a dependency graph, with the next recommended skill highlighted"
    >
      <g className="skill-graph__edges">
        {EDGES.map(([from, to]) => {
          const a = nodeById(from);
          const b = nodeById(to);
          const lit = a.state !== "locked" && b.state !== "locked";
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={lit ? "var(--accent-blue-dim)" : "var(--border-subtle)"}
              strokeWidth={lit ? 1.6 : 1.2}
            />
          );
        })}
      </g>

      <g className="skill-graph__nodes">
        {NODES.map((n) => (
          <g key={n.id} transform={`translate(${n.x} ${n.y})`} className={`skill-graph__node skill-graph__node--${n.state}`}>
            {n.state === "active" && <circle r="17" className="skill-graph__pulse" />}
            <circle r="12" fill="var(--bg-surface)" stroke={STATE_COLOR[n.state]} strokeWidth="2" />
            <circle r="4" fill={STATE_COLOR[n.state]} />
            <text x="0" y="30" textAnchor="middle" className="skill-graph__label">
              {n.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
