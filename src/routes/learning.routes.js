const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  getFields,
  getLanguages,
  saveLearningSetting,
  getMyLearningSetting,
} = require("../controllers/learning.controller");

router.get("/fields", getFields);
router.get("/languages", getLanguages);

router.post("/settings", authMiddleware, saveLearningSetting);
router.get("/settings/me", authMiddleware, getMyLearningSetting);

module.exports = router;