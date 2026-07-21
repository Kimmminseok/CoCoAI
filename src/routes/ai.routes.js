const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createProblems,
  submitProblems,
  createTheory,
} = require("../controllers/ai.controller");

router.post("/problems", authMiddleware, createProblems);
router.post("/theory", authMiddleware, createTheory);
router.post("/problems/submit", authMiddleware, submitProblems);

module.exports = router;