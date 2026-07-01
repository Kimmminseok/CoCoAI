const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { getMyInfo } = require("../controllers/user.controller");

router.get("/me", authMiddleware, getMyInfo);

module.exports = router;