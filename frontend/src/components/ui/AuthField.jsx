import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthField({ label, error, hint, type = "text", ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return (
    <div className="sf-auth-form__field">
      <label htmlFor={id}>{label}</label>
      <div className={`sf-auth-input${password ? " sf-auth-input--password" : ""}`}>
        <input {...props} id={id} type={password && visible ? "text" : type} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} />
        {password && <button type="button" className="sf-auth-input__toggle" onClick={() => setVisible(current => !current)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>}
      </div>
      {error ? <span id={`${id}-error`} className="sf-auth-form__error" role="status">{error}</span> : hint ? <span id={`${id}-hint`} className="sf-auth-form__hint">{hint}</span> : null}
    </div>
  );
}
