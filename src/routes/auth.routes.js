const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  kakaoLogin,
  kakaoCallback,
  naverLogin,
  naverCallback,
  githubLogin,
  githubCallback,
} = require("../controllers/auth.controller");

router.post("/signup", signup);
router.post("/login", login);

router.get("/kakao", kakaoLogin);
router.get("/kakao/callback", kakaoCallback);

router.get("/naver", naverLogin);
router.get("/naver/callback", naverCallback);

router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

module.exports = router;
