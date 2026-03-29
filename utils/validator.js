"use strict";

// All language codes supported by LibreTranslate
const SUPPORTED_LANGUAGES = new Set([
  "ar", "az", "ca", "cs", "da", "de", "el", "en", "eo", "es",
  "et", "fa", "fi", "fr", "ga", "gl", "gu", "he", "hi", "hr",
  "hu", "hy", "id", "is", "it", "ja", "ka", "ko", "lt", "lv",
  "mk", "ml", "mr", "ms", "mt", "nb", "nl", "pl", "pt", "ro",
  "ru", "sk", "sl", "sq", "sr", "sv", "sw", "ta", "te", "th",
  "tl", "tr", "uk", "ur", "vi", "zh",
]);

/**
 * validateTranslateInput
 * Validates the request body for POST /api/translate.
 * Returns { valid: true } or { valid: false, message: "..." }
 */
function validateTranslateInput(body) {
  const { text, target, source } = body || {};

  // Check text
  if (!text)
    return { valid: false, message: '"text" field is required.' };

  if (typeof text !== "string")
    return { valid: false, message: '"text" must be a string.' };

  if (text.trim().length === 0)
    return { valid: false, message: '"text" cannot be empty.' };

  if (text.trim().length > 5000)
    return { valid: false, message: '"text" is too long. Maximum 5000 characters.' };

  // Check target
  if (!target)
    return { valid: false, message: '"target" language code is required. Example: "hi", "fr", "es"' };

  if (typeof target !== "string")
    return { valid: false, message: '"target" must be a string.' };

  const targetCode = target.trim().toLowerCase();
  if (!SUPPORTED_LANGUAGES.has(targetCode))
    return { valid: false, message: `"${target}" is not a supported language. Use GET /api/languages to see all supported codes.` };

  // Check source (optional)
  if (source && typeof source === "string") {
    const sourceCode = source.trim().toLowerCase();
    if (sourceCode !== "auto" && !SUPPORTED_LANGUAGES.has(sourceCode))
      return { valid: false, message: `"${source}" is not a supported source language. Use "auto" for automatic detection.` };
  }

  return { valid: true };
}

module.exports = { validateTranslateInput, SUPPORTED_LANGUAGES };