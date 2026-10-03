import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";

export const signupController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated;
  const { token, user } = await authService.signup({ name, email, password });
  res.status(201).json({ token, user });
});

export const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.validated;
  const { token, user } = await authService.login({ email, password });
  res.status(200).json({ token, user });
});

export const requestPasswordResetController = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.validated);
  res.status(200).json({ message: "If that email is registered, a reset code has been sent." });
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.validated);
  res.status(200).json({ message: "Your password has been reset. You can now log in." });
});

// JWT auth is stateless: there is no server-side session to invalidate.
// Logging out is really the client discarding its token — this endpoint
// exists so the frontend has a single, consistent place to call, and so
// it's protected (only a logged-in caller can hit it).
export const logoutController = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "Logged out successfully." });
});

export const meController = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({ user });
});

export default { signupController, loginController, requestPasswordResetController, resetPasswordController, logoutController, meController };
