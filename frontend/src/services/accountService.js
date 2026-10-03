import { apiRequest } from "./apiClient.js";

export const getAccountPrivacy = () => apiRequest("/account/privacy", { auth: true });
export const updatePreferences = (body) => apiRequest("/account/preferences", { method: "PUT", auth: true, body }).then((data) => data.preferences);
export const recordConsent = (body) => apiRequest("/account/consents", { method: "POST", auth: true, body }).then((data) => data.consent);
export const exportAccount = () => apiRequest("/account/export", { auth: true });
export const deleteAccount = (body) => apiRequest("/account", { method: "DELETE", auth: true, body });

export function downloadAccountExport(data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `skillforge-account-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export default { getAccountPrivacy, updatePreferences, recordConsent, exportAccount, deleteAccount };
