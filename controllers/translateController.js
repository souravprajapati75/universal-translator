"use strict";

const { translate, getSupportedLanguages } = require("../services/translateService");

// ── POST /api/translate ───────────────────────────────────────────────────────
async function translateText(req, res) {
  try {
    const { text, target, source } = req.body;

    // Validate text
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error:   '"text" field is required and must not be empty.',
      });
    }

    // Validate target
    if (!target || typeof target !== "string") {
      return res.status(400).json({
        success: false,
        error:   '"target" language code is required. Example: "hi", "fr", "es"',
      });
    }

    console.log(`[Translate] "${text.substring(0, 50)}" → ${target}`);

    // Call translation service
    const result = await translate(text.trim(), target.trim(), source || "auto");

    return res.status(200).json({
      success: true,
      data: {
        translatedText:   result.translatedText,
        originalText:     result.originalText,
        source:           result.source,
        target:           result.target,
        detectedLanguage: result.detectedLanguage,
      },
    });

  } catch (err) {
    console.error("[translateText error]", err.message);
    return res.status(err.status || 500).json({
      success: false,
      error:   err.message || "Translation failed. Please try again.",
    });
  }
}

// ── GET /api/languages ────────────────────────────────────────────────────────
function listLanguages(req, res) {
  const languages = getSupportedLanguages();
  return res.status(200).json({
    success: true,
    data:    { languages },
  });
}

// ── GET /api/health ───────────────────────────────────────────────────────────
function healthCheck(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      status:    "ok",
      timestamp: new Date().toISOString(),
      uptime:    `${Math.floor(process.uptime())}s`,
    },
  });
}

module.exports = { translateText, listLanguages, healthCheck };