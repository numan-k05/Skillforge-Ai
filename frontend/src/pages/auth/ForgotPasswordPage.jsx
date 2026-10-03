import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { requestPasswordReset, resetPassword } from "../../services/authService.js";
import { ApiError } from "../../services/apiClient.js";
import "./AuthForm.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ otp: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function sendCode(event) {
    event.preventDefault();
    setError("");
    if (!email.trim()) return setError("Email is required");
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
      setStep("reset");
    } catch (err) {
      setError(err.message || "Unable to send a reset code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(form.otp)) return setError("Enter the 6-digit code from your email");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    setSubmitting(true);
    try {
      await resetPassword({ email, ...form });
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) setError(err.details[0].message);
      else setError(err.message || "Unable to reset your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sf-auth-form">
      <h1>{step === "request" ? "Reset your password" : "Enter your reset code"}</h1>
      <p className="sf-auth-form__subtitle">
        {step === "request" ? "We’ll email a six-digit code to reset your password." : `Enter the code sent to ${email}. It expires in 10 minutes.`}
      </p>

      {error && <div className="sf-auth-form__alert" role="alert">{error}</div>}
      {message && <div className="sf-auth-form__success" role="status">{message}</div>}

      {step === "request" ? (
        <form onSubmit={sendCode} noValidate>
          <label className="sf-auth-form__field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>
          <Button type="submit" variant="primary" size="lg" className="sf-auth-form__submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitReset} noValidate>
          <label className="sf-auth-form__field">
            <span>6-digit code</span>
            <input inputMode="numeric" maxLength="6" value={form.otp} onChange={update("otp")} autoComplete="one-time-code" />
          </label>
          <label className="sf-auth-form__field">
            <span>New password</span>
            <input type="password" value={form.password} onChange={update("password")} autoComplete="new-password" />
          </label>
          <label className="sf-auth-form__field">
            <span>Confirm new password</span>
            <input type="password" value={form.confirmPassword} onChange={update("confirmPassword")} autoComplete="new-password" />
          </label>
          <Button type="submit" variant="primary" size="lg" className="sf-auth-form__submit" disabled={submitting}>
            {submitting ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}

      <p className="sf-auth-form__switch"><Link to="/login">Back to log in</Link></p>
    </div>
  );
}
