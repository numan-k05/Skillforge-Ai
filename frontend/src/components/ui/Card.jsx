import "./Card.css";

export function Card({ as: Tag = "div", className = "", padded = true, glass = false, children, ...rest }) {
  const classes = `sf-card ${padded ? "sf-card--padded" : ""} ${glass ? "sf-card--glass" : ""} ${className}`.trim();
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export function Badge({ tone = "neutral", children, className = "" }) {
  return <span className={`sf-badge sf-badge--${tone} ${className}`.trim()}>{children}</span>;
}

export default Card;
