import { forwardRef } from "react";
import { Link } from "react-router-dom";
import "./Button.css";

/**
 * Button — primary interactive primitive.
 * variant: "primary" | "secondary" | "ghost" | "danger"
 * size: "md" | "lg"
 * Renders a <Link> when `to` is provided, an <a> when `href` is provided,
 * otherwise a native <button>.
 */
const Button = forwardRef(function Button(
  { variant = "primary", size = "md", to, href, icon, iconPosition = "right", className = "", children, ...rest },
  ref
) {
  const classes = `sf-btn sf-btn--${variant} sf-btn--${size} ${className}`.trim();

  const content = (
    <>
      {icon && iconPosition === "left" && <span className="sf-btn__icon">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === "right" && <span className="sf-btn__icon">{icon}</span>}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button ref={ref} type="button" className={classes} {...rest}>
      {content}
    </button>
  );
});

export default Button;
