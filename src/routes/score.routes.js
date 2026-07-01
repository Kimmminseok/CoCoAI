const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { getMyScore } = require("../controllers/score.controller");

router.get("/me", authMiddleware, getMyScore);

module.exports = router;