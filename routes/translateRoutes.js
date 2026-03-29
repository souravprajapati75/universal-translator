"use strict";

const express = require("express");
const router  = express.Router();

const {
  translateText,
  listLanguages,
  healthCheck,
} = require("../controllers/translateController");

// POST /api/translate
router.post("/translate", translateText);

// GET /api/languages
router.get("/languages", listLanguages);

// GET /api/health
router.get("/health", healthCheck);

module.exports = router;