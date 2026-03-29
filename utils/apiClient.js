"use strict";

const axios = require("axios");

// All public LibreTranslate mirrors
const MIRRORS = [
  "https://libretranslate.com/translate",
  "https://translate.argosopentech.com/translate",
  "https://translate.terraprint.co/translate",
  "https://libretranslate.de/translate",
];

/**
 * postWithFallback
 * Sends POST request to each mirror until one succeeds.
 * Returns response data on success, throws error if all fail.
 */
async function postWithFallback(payload) {
  let lastError;

  for (const url of MIRRORS) {
    try {
      console.log(`[ApiClient] Trying: ${url}`);

      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      console.log(`[ApiClient] Success: ${url}`);
      return response.data;

    } catch (err) {
      console.warn(`[ApiClient] Failed: ${url} — ${err.message}`);
      lastError = err;
    }
  }

  // All mirrors failed
  const error  = new Error("All translation servers unavailable. Try again later.");
  error.status = 503;
  throw error;
}

module.exports = { postWithFallback };