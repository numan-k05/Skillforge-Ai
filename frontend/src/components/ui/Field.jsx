import { useId } from "react";

/** A field always has a visible label and associates hints/errors with its control. */
export function Field({ label, hint, error, as: Control = "input", id: suppliedId, children, className = "", ...props }) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return <div className={`sf-field ${className}`}>
    <label htmlFor={id}>{label}{props.required && <span aria-hidden="true"> *</span>}</label>
    <Control {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}>{children}</Control>
    {hint && <small id={`${id}-hint`}>{hint}</small>}
    {error && <small id={`${id}-error`} className="sf-field__error" role="alert">{error}</small>}
  </div>;
}

export function Select({ children, ...props }) { return <Field {...props} as="select">{children}</Field>; }
