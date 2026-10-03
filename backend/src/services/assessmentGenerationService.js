import { generateText, isAIConfigured } from "./aiService.js";

const MAX_PROMPT_LENGTH = 1200;
const MAX_OPTION_LENGTH = 500;
const MAX_EXPLANATION_LENGTH = 1600;

function parseJsonObject(text) {
  if (typeof text !== "string") throw new Error("AI assessment output is not text.");
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("AI assessment output did not contain JSON.");
  return JSON.parse(cleaned.slice(first, last + 1));
}

function boundedText(value, label, maxLength) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  const text = value.trim();
  if (text.length > maxLength) throw new Error(`${label} is too long.`);
  return text;
}

export function normalizeGeneratedQuestions(raw, templates) {
  if (!raw || !Array.isArray(raw.questions) || raw.questions.length !== templates.length) {
    throw new Error(`AI must return exactly ${templates.length} questions.`);
  }

  const prompts = new Set();
  return raw.questions.map((question, questionIndex) => {
    const template = templates[questionIndex];
    const prompt = boundedText(question?.prompt, `Question ${questionIndex + 1}`, MAX_PROMPT_LENGTH);
    const promptKey = prompt.toLowerCase();
    if (prompts.has(promptKey)) throw new Error("AI returned duplicate questions.");
    prompts.add(promptKey);

    if (!Array.isArray(question.options) || question.options.length !== template.options.length) {
      throw new Error(`Question ${questionIndex + 1} must contain exactly ${template.options.length} options.`);
    }
    if (question.options.filter((option) => option?.isCorrect === true).length !== 1) {
      throw new Error(`Question ${questionIndex + 1} must have exactly one correct option.`);
    }

    const optionTexts = new Set();
    const options = question.options.map((option, optionIndex) => {
      const text = boundedText(option?.text, `Option ${questionIndex + 1}.${optionIndex + 1}`, MAX_OPTION_LENGTH);
      const key = text.toLowerCase();
      if (optionTexts.has(key)) throw new Error(`Question ${questionIndex + 1} has duplicate options.`);
      optionTexts.add(key);
      return {
        id: template.options[optionIndex].id,
        text,
        isCorrect: option.isCorrect === true,
        position: optionIndex + 1,
      };
    });

    return {
      id: template.id,
      prompt,
      explanation: boundedText(question.explanation, `Explanation ${questionIndex + 1}`, MAX_EXPLANATION_LENGTH),
      position: questionIndex + 1,
      points: template.points,
      options,
    };
  });
}

function assessmentPrompt(quiz, templates) {
  const sourceQuestions = templates.map((question) => ({
    topicQuestion: question.prompt,
    explanation: question.explanation,
    correctAnswers: question.options.filter((option) => option.isCorrect).map((option) => option.text),
  }));

  return `Create a fresh assessment for the course below.

Course assessment: ${quiz.title}
Description: ${quiz.description || "Use the reviewed questions as the topic guide."}

Reviewed topic and answer guide:
${JSON.stringify(sourceQuestions, null, 2)}

Return JSON only in this exact shape:
{"questions":[{"prompt":"string","explanation":"string","options":[{"text":"string","isCorrect":true},{"text":"string","isCorrect":false},{"text":"string","isCorrect":false},{"text":"string","isCorrect":false}]}]}

Rules:
- Return exactly ${templates.length} questions in the same topic order as the reviewed guide.
- Write a new scenario or wording for each question; do not merely reorder the source sentence.
- Each question must be factually consistent with its reviewed explanation and answer guide.
- Give exactly ${templates[0]?.options.length || 4} plausible options and exactly one correct option per question.
- Explanations must state why the correct option is correct without referring to this prompt.
- Do not include markdown, HTML, trick questions, opinions, or employment claims.`;
}

export async function createAttemptQuestionSet(quiz, templates) {
  const canGenerate = templates.length > 0 && templates.every((question) => question.options.length === 4);
  if (!isAIConfigured("assessments") || !canGenerate) {
    return { questions: templates, mode: "reviewed", provider: null, model: null };
  }

  try {
    const result = await generateText({
      capability: "assessments",
      system: "You create accurate, concise technical assessments. Return only valid JSON matching the requested shape.",
      prompt: assessmentPrompt(quiz, templates),
      temperature: 0.7,
      maxTokens: 5000,
    });
    if (result.fallback) throw new Error("AI provider is not active.");
    return {
      questions: normalizeGeneratedQuestions(parseJsonObject(result.text), templates),
      mode: "ai",
      provider: result.provider,
      model: result.model,
    };
  } catch (error) {
    console.warn("[assessment] AI question generation failed; using reviewed questions:", error?.message || error);
    return { questions: templates, mode: "ai_fallback", provider: null, model: null };
  }
}

export const assessmentGenerationInternals = { parseJsonObject, assessmentPrompt };

