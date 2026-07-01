const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  saveStudyResult,
  getMyStudySessions,
} = require("../controllers/study.controller");

router.post("/result", authMiddleware, saveStudyResult);
router.get("/me", authMiddleware, getMyStudySessions);

module.exports = router;