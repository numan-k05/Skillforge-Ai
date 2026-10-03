import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.js";
import { ApiError } from "../../services/apiClient.js";
import Button from "../../components/ui/Button.jsx";
import "./AuthForm.css";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validateClientSide() {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const clientErrors = validateClientSide();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signup(form);
      const from=location.state?.from;
      navigate(from?.pathname?from.pathname+(from.search||""):"/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const fieldErrors = {};
        err.details.forEach((d) => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      } else {
        setFormError(err.message || "Unable to create your account. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sf-auth-form">
      <h1>Create your account</h1>
      <p className="sf-auth-form__subtitle">Start turning your skills into a career roadmap.</p>

      {formError && (
        <div className="sf-auth-form__alert" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <label className="sf-auth-form__field">
          <span>Name</span>
          <input type="text" value={form.name} onChange={update("name")} autoComplete="name" />
          {errors.name && <span className="sf-auth-form__error">{errors.name}</span>}
        </label>

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
            autoComplete="new-password"
          />
          {errors.password && <span className="sf-auth-form__error">{errors.password}</span>}
        </label>

        <label className="sf-auth-form__field">
          <span>Confirm password</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            autoComplete="new-password"
          />
          {errors.confirmPassword && <span className="sf-auth-form__error">{errors.confirmPassword}</span>}
        </label>

        <Button type="submit" variant="primary" size="lg" className="sf-auth-form__submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="sf-auth-form__switch">
        Already have an account? <Link to="/login" state={location.state}>Log in</Link>
      </p>
    </div>
  );
}
