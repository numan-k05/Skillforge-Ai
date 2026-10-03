import { env } from "../config/env.js";

const DEFAULT_MAX_TOKENS = 1800;
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT_MS = 30_000;

export class AIServiceError extends Error {
  constructor(message, { code = "AI_REQUEST_FAILED", statusCode = 502, cause } = {}) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "https://api.anthropic.com").replace(/\/+$/, "");
}

function messagesUrl(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  return normalized.endsWith("/v1") ? `${normalized}/messages` : `${normalized}/v1/messages`;
}

function extractAnthropicText(payload) {
  if (!payload || !Array.isArray(payload.content)) return "";
  return payload.content
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function createMockResponse({ system, prompt }) {
  const focus = prompt?.slice(0, 180).replace(/\s+/g, " ") || "the student's career goal";
  return [
    "MOCK_AI_RESPONSE",
    `AI integration is configured for fallback mode. Focus: ${focus}`,
    system ? "The future roadmap generator can use the same service contract when an API key is configured." : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function capabilityEnabled(capability) {
  return capability === "assessments" ? env.aiAssessmentsEnabled : env.aiEnabled;
}

export function isAIConfigured(capability = "general") {
  return Boolean(capabilityEnabled(capability) && env.aiApiKey);
}

export function getAIStatus(capability = "general") {
  const configured = isAIConfigured(capability);
  return {
    configured,
    provider: configured ? "anthropic" : "internal",
    model: configured ? env.aiModel : null,
    mode: configured ? "live" : "deterministic",
  };
}

/**
 * Provider boundary for all future AI features.
 * Phase 6C-1 intentionally exposes a generic text-generation contract;
 * roadmap prompt construction/validation belongs to Phase 6C-2.
 */
export async function generateText({
  system = "You are a helpful career-learning assistant.",
  prompt,
  maxTokens = env.aiMaxTokens || DEFAULT_MAX_TOKENS,
  temperature = DEFAULT_TEMPERATURE,
  timeoutMs = env.aiTimeoutMs || DEFAULT_TIMEOUT_MS,
  capability = "general",
} = {}) {
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new AIServiceError("AI prompt is required.", {
      code: "AI_PROMPT_REQUIRED",
      statusCode: 400,
    });
  }

  // The fallback keeps local development and the rest of the product usable
  // without an external provider. Phase 6C-2 will validate/handle this output.
  if (!isAIConfigured(capability)) {
    return {
      text: createMockResponse({ system, prompt }),
      provider: "anthropic",
      model: env.aiModel,
      fallback: true,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(messagesUrl(env.aiApiBaseUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.aiApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.aiModel,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: "user", content: prompt.trim() }],
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const providerMessage = payload?.error?.message;
      throw new AIServiceError(providerMessage || `AI provider returned HTTP ${response.status}.`, {
        code: "AI_PROVIDER_ERROR",
        statusCode: response.status === 429 ? 429 : 502,
      });
    }

    const text = extractAnthropicText(payload);
    if (!text) {
      throw new AIServiceError("AI provider returned an empty response.", {
        code: "AI_EMPTY_RESPONSE",
        statusCode: 502,
      });
    }

    return {
      text,
      provider: "anthropic",
      model: payload.model || env.aiModel,
      fallback: false,
      usage: payload.usage || null,
    };
  } catch (err) {
    if (err instanceof AIServiceError) throw err;

    if (err?.name === "AbortError") {
      throw new AIServiceError("The AI request timed out. Please try again.", {
        code: "AI_TIMEOUT",
        statusCode: 504,
      });
    }

    throw new AIServiceError("Unable to reach the AI provider. Please try again later.", {
      code: "AI_NETWORK_ERROR",
      statusCode: 502,
      cause: err,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  generateText,
  isAIConfigured,
  getAIStatus,
};
