import "./StatementHero.css";

export default function StatementHero({ children, id }) {
  return (
    <header className="statement-hero">
      <h1 id={id}>{typeof children === "string" ? children.split(" ").map((word, index) => <span className="statement-word" key={`${word}-${index}`} style={{ "--word-delay": `${index * 35}ms` }}>{word}{" "}</span>) : children}</h1>
    </header>
  );
}
