"use strict";

const express = require("express");
const mysql   = require("mysql2");
const axios   = require("axios");

const app  = express();
const PORT = 3000;

// ─────────────────────────────────────────────────────────────────────────────
// 1. DATABASE CONNECTION (XAMPP MySQL) — NO CHANGES
// ─────────────────────────────────────────────────────────────────────────────

const db = mysql.createConnection({
  host:     "localhost",
  user:     "root",
  password: "",
  database: "translator_db",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connect nahi hua:", err.message);
  } else {
    console.log("✅ Database is connect (XAMPP)!");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TRANSLATION FUNCTION
//    Uses MyMemory API — 100% FREE, no API key needed, works instantly!
//    Fallback: LibreTranslate mirrors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * translateWithMyMemory
 * Uses MyMemory free API — no key needed, very reliable
 * URL: https://api.mymemory.translated.net/get
 */
async function translateWithMyMemory(text, targetLang, sourceLang = "en") {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;

  const response = await axios.get(url, { timeout: 8000 });
  const data     = response.data;

  // MyMemory returns responseStatus 200 on success
  if (data.responseStatus !== 200) {
    throw new Error(`MyMemory error: ${data.responseMessage}`);
  }

  const translated = data.responseData?.translatedText;
  if (!translated) throw new Error("Empty response from MyMemory");

  return translated;
}

/**
 * translateWithLibre
 * LibreTranslate free mirrors as fallback
 */
async function translateWithLibre(text, targetLang) {
  const mirrors = [
    "https://translate.terraprint.co/translate",
    "https://translate.fedilab.app/translate",
    "https://lt.vern.cc/translate",
  ];

  for (const url of mirrors) {
    try {
      const response = await axios.post(url, {
        q:      text,
        source: "auto",
        target: targetLang,
        format: "text",
      }, {
        headers: { "Content-Type": "application/json" },
        timeout: 8000,
      });

      const translated = response.data?.translatedText;
      if (translated) return translated;

    } catch (err) {
      console.warn(`[Libre Mirror Failed] ${url}: ${err.message}`);
    }
  }

  throw new Error("All LibreTranslate mirrors failed");
}

/**
 * Main translate function
 * Tries MyMemory first (most reliable), then LibreTranslate mirrors
 */
async function translateText(text, targetLang) {
  // Map common language codes for MyMemory
  const langMap = {
    "zh": "zh-CN",
    "nb": "no",
  };
  const myMemoryLang = langMap[targetLang] || targetLang;

  // Try MyMemory first
  try {
    console.log(`[Translation] Trying MyMemory: "${text}" → ${targetLang}`);
    const result = await translateWithMyMemory(text, myMemoryLang, "en");
    console.log(`[Translation] ✅ MyMemory success: "${result}"`);
    return result;
  } catch (err) {
    console.warn(`[Translation] MyMemory failed: ${err.message}`);
  }

  // Fallback to LibreTranslate mirrors
  try {
    console.log(`[Translation] Trying LibreTranslate mirrors...`);
    const result = await translateWithLibre(text, targetLang);
    console.log(`[Translation] ✅ LibreTranslate success: "${result}"`);
    return result;
  } catch (err) {
    console.warn(`[Translation] LibreTranslate failed: ${err.message}`);
  }

  // Both failed
  throw new Error("Translation service unavailable. Please try again.");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TRANSLATE ROUTE — FIXED
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/translate", async (req, res) => {
  const { text, target_lang } = req.body;

  // ── Validate input ─────────────────────────────────────────────────────────
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error:   '"text" field is required and cannot be empty.',
    });
  }

  if (!target_lang || typeof target_lang !== "string") {
    return res.status(400).json({
      success: false,
      error:   '"target_lang" is required. Example: "hi", "gu", "fr"',
    });
  }

  // ── Real Translation ───────────────────────────────────────────────────────
  let translatedResult;
  try {
    translatedResult = await translateText(text.trim(), target_lang.trim());
  } catch (translationErr) {
    console.error("[Translation Error]", translationErr.message);
    return res.status(503).json({
      success: false,
      error:   "Translation failed: " + translationErr.message,
    });
  }

  // ── Save to Database (unchanged) ───────────────────────────────────────────
  const sql    = "INSERT INTO translations (user_text, translated_text, from_lang, to_lang) VALUES (?, ?, ?, ?)";
  const values = [text.trim(), translatedResult, "auto", target_lang.trim()];

  db.query(sql, values, (dbErr, result) => {
    if (dbErr) {
      console.error("[DB Error]", dbErr.message);
      return res.status(500).json({
        success: false,
        error:   "Database error: " + dbErr.message,
      });
    }

    // ── Return response ─────────────────────────────────────────────────────
    // "translatedText" field added so frontend works correctly
    return res.json({
      success:        true,
      original:       text.trim(),
      translated:     translatedResult,
      translatedText: translatedResult,   // ← frontend uses this field
      target:         target_lang.trim(),
      db_id:          result.insertId,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. HISTORY API — NO CHANGES
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/history", (req, res) => {
  db.query(
    "SELECT * FROM translations ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: results });
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. ROOT
// ─────────────────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({
    name:     "Translator API",
    status:   "running",
    database: "connected",
    routes: {
      translate: "POST /api/translate",
      history:   "GET  /api/history",
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. START
// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});