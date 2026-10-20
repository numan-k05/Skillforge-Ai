import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.js";
import { ApiError } from "../../services/apiClient.js";
import Button from "../../components/ui/Button.jsx";
import AuthField from "../../components/ui/AuthField.jsx";
import { ArrowRight, LoaderCircle } from "lucide-react";
import "./AuthForm.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors(current => ({ ...current, [field]: undefined }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setFormError("");

    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = "Enter a valid email address";
    if (!form.password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(form);
      const from=location.state?.from;
      const redirectTo = from?.pathname ? from.pathname+(from.search||"") : "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const fieldErrors = {};
        err.details.forEach((d) => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      } else {
        setFormError(err.message || "Unable to log in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sf-auth-form">
      <p className="sf-auth-form__eyebrow">YOUR PERSONAL LEARNING SPACE</p>
      <h1>Welcome back.</h1>
      <p className="sf-auth-form__subtitle">Good to see you again. Let&apos;s keep growing.</p>

      {location.state?.passwordReset && (
        <div className="sf-auth-form__success" role="status">
          Password reset successful. Log in with your new password.
        </div>
      )}

      {formError && (
        <div className="sf-auth-form__alert" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        <AuthField label="Email address" name="email" type="email" value={form.email} onChange={update("email")} autoComplete="email" inputMode="email" placeholder="you@example.com" autoCapitalize="none" spellCheck={false} required error={errors.email} />
        <AuthField label="Password" name="password" type="password" value={form.password} onChange={update("password")} autoComplete="current-password" placeholder="Enter your password" required error={errors.password} />

        <p className="sf-auth-form__forgot">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <Button type="submit" variant="primary" size="lg" className="sf-auth-form__submit" disabled={submitting} icon={submitting ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="sf-auth-form__switch">
        Don&apos;t have an account? <Link to="/signup" state={location.state}>Create one</Link>
      </p>
    </div>
  );
}
