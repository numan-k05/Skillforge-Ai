import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.js";
import { ApiError } from "../../services/apiClient.js";
import Button from "../../components/ui/Button.jsx";
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
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = "Email is required";
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
      <h1>Welcome back</h1>
      <p className="sf-auth-form__subtitle">Log in to continue building your roadmap.</p>

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

      <form onSubmit={handleSubmit} noValidate>
        <label className="sf-auth-form__field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={update("email")} autoComplete="email" />
          {errors.email && <span className="sf-auth-form__error">{errors.email}</span>}
        </label>

        <label className="sf-auth-form__field">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            autoComplete="current-password"
          />
          {errors.password && <span className="sf-auth-form__error">{errors.password}</span>}
        </label>

        <p className="sf-auth-form__forgot">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <Button type="submit" variant="primary" size="lg" className="sf-auth-form__submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="sf-auth-form__switch">
        Don&apos;t have an account? <Link to="/signup" state={location.state}>Create one</Link>
      </p>
    </div>
  );
}
