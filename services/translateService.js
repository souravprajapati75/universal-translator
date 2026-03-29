"use strict";

const axios = require("axios");

// LibreTranslate public mirrors — tried in order
const MIRRORS = [
  "https://libretranslate.com/translate",
  "https://translate.argosopentech.com/translate",
  "https://translate.terraprint.co/translate",
  "https://libretranslate.de/translate",
];

// ── translate ─────────────────────────────────────────────────────────────────
async function translate(text, target, source = "auto") {
  const payload = {
    q:      text,
    source: source,
    target: target,
    format: "text",
  };

  let lastError;

  // Try each mirror until one works
  for (const url of MIRRORS) {
    try {
      console.log(`[Service] Trying: ${url}`);
      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      const data = response.data;

      if (!data || !data.translatedText) {
        throw new Error("Empty response from server");
      }

      console.log(`[Service] Success from: ${url}`);

      return {
        translatedText:   data.translatedText,
        detectedLanguage: data.detectedLanguage || null,
        source:           data.detectedLanguage?.language || source,
        target:           target,
        originalText:     text,
      };

    } catch (err) {
      console.warn(`[Service] Failed: ${url} — ${err.message}`);
      lastError = err;
    }
  }

  // All mirrors failed
  const error     = new Error("Translation service is unavailable. Please try again later.");
  error.status    = 503;
  throw error;
}

// ── getSupportedLanguages ─────────────────────────────────────────────────────
function getSupportedLanguages() {
  return [
    { code: "ar", name: "Arabic"      },
    { code: "zh", name: "Chinese"     },
    { code: "cs", name: "Czech"       },
    { code: "da", name: "Danish"      },
    { code: "nl", name: "Dutch"       },
    { code: "en", name: "English"     },
    { code: "fi", name: "Finnish"     },
    { code: "fr", name: "French"      },
    { code: "de", name: "German"      },
    { code: "el", name: "Greek"       },
    { code: "gu", name: "Gujarati"    },
    { code: "he", name: "Hebrew"      },
    { code: "hi", name: "Hindi"       },
    { code: "hu", name: "Hungarian"   },
    { code: "id", name: "Indonesian"  },
    { code: "it", name: "Italian"     },
    { code: "ja", name: "Japanese"    },
    { code: "ko", name: "Korean"      },
    { code: "mr", name: "Marathi"     },
    { code: "ms", name: "Malay"       },
    { code: "nb", name: "Norwegian"   },
    { code: "fa", name: "Persian"     },
    { code: "pl", name: "Polish"      },
    { code: "pt", name: "Portuguese"  },
    { code: "ro", name: "Romanian"    },
    { code: "ru", name: "Russian"     },
    { code: "es", name: "Spanish"     },
    { code: "sv", name: "Swedish"     },
    { code: "ta", name: "Tamil"       },
    { code: "te", name: "Telugu"      },
    { code: "th", name: "Thai"        },
    { code: "tr", name: "Turkish"     },
    { code: "uk", name: "Ukrainian"   },
    { code: "ur", name: "Urdu"        },
    { code: "vi", name: "Vietnamese"  },
  ];
}

module.exports = { translate, getSupportedLanguages };