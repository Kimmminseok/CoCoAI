const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { getDashboardSummary } = require("../controllers/dashboard.controller");

router.get("/summary", authMiddleware, getDashboardSummary);

module.exports = router;