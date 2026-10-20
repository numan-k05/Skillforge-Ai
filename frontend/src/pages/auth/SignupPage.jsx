import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.js";
import { ApiError } from "../../services/apiClient.js";
import Button from "../../components/ui/Button.jsx";
import AuthField from "../../components/ui/AuthField.jsx";
import { ArrowRight, LoaderCircle } from "lucide-react";
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
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors(current => ({ ...current, [field]: undefined }));
    };
  }

  function validateClientSide() {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters";
    if (!form.confirmPassword) next.confirmPassword = "Confirm your password";
    else if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
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
      <p className="sf-auth-form__eyebrow">START YOUR NEXT CHAPTER</p>
      <h1>A fresh start.</h1>
      <p className="sf-auth-form__subtitle">Create your free account and make room for what&apos;s next.</p>

      {formError && (
        <div className="sf-auth-form__alert" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        <AuthField label="Full name" name="name" value={form.name} onChange={update("name")} autoComplete="name" placeholder="Your full name" required error={errors.name} />
        <AuthField label="Email address" name="email" type="email" value={form.email} onChange={update("email")} autoComplete="email" inputMode="email" placeholder="you@example.com" autoCapitalize="none" spellCheck={false} required error={errors.email} />
        <AuthField label="Password" name="password" type="password" value={form.password} onChange={update("password")} autoComplete="new-password" placeholder="Create a password" required hint="Use at least 8 characters." error={errors.password} />
        <AuthField label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={update("confirmPassword")} autoComplete="new-password" placeholder="Enter your password again" required error={errors.confirmPassword} />

        <Button type="submit" variant="primary" size="lg" className="sf-auth-form__submit" disabled={submitting} icon={submitting ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="sf-auth-form__switch">
        Already have an account? <Link to="/login" state={location.state}>Log in</Link>
      </p>
    </div>
  );
}
