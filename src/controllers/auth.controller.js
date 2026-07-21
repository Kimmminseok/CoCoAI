const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

async function signup(req, res) {
  const { login_id, email, password, name, phone } = req.body;

  if (!login_id || !email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: "아이디, 이메일, 비밀번호, 이름은 필수입니다.",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.query(
      "SELECT user_id FROM users WHERE login_id = ? OR email = ?",
      [login_id, email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "이미 사용 중인 아이디 또는 이메일입니다.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await connection.query(
      `INSERT INTO users
       (login_id, email, password_hash, name, phone, signup_type, role, status)
       VALUES (?, ?, ?, ?, ?, 'LOCAL', 'USER', 'ACTIVE')`,
      [login_id, email, passwordHash, name, phone || null]
    );

    const userId = result.insertId;

    await connection.query(
      `INSERT INTO user_scores
       (user_id, total_score, streak_days)
       VALUES (?, 0, 0)`,
      [userId]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "회원가입 성공",
      data: {
        user_id: userId,
        login_id,
        email,
        name,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("회원가입 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  } finally {
    connection.release();
  }
}

async function login(req, res) {
  const { login_id, password } = req.body;

  if (!login_id || !password) {
    return res.status(400).json({
      success: false,
      message: "아이디와 비밀번호는 필수입니다.",
    });
  }

  try {
    const [users] = await pool.query(
      `SELECT user_id, login_id, email, password_hash, name, role, status
       FROM users
       WHERE login_id = ?`,
      [login_id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "아이디 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const user = users[0];

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "탈퇴했거나 비활성화된 계정입니다.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "아이디 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        login_id: user.login_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.json({
      success: true,
      message: "로그인 성공",
      data: {
        token,
        user: {
          user_id: user.user_id,
          login_id: user.login_id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("로그인 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}

function createJwt(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      login_id: user.login_id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
}

function redirectWithToken(res, token) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return res.redirect(`${frontendUrl}/social-login-success?token=${token}`);
}

async function findOrCreateSocialUser({ provider, providerUserId, email, name, profileImageUrl }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.query(
      `SELECT user_id, login_id, email, name, role, status
       FROM users
       WHERE signup_type = ? AND provider_user_id = ?`,
      [provider, providerUserId]
    );

    if (existingUsers.length > 0) {
      const user = existingUsers[0];

      if (user.status !== "ACTIVE") {
        throw new Error("탈퇴했거나 비활성화된 계정입니다.");
      }

      await connection.commit();
      return user;
    }

    const safeEmail = email || `${provider.toLowerCase()}_${providerUserId}@social.cocoai.local`;
    const safeName = name || `${provider} 사용자`;
    const loginId = `${provider.toLowerCase()}_${providerUserId}`;

    const [result] = await connection.query(
      `INSERT INTO users
       (login_id, email, password_hash, name, phone, profile_image_url, signup_type, provider_user_id, role, status)
       VALUES (?, ?, NULL, ?, NULL, ?, ?, ?, 'USER', 'ACTIVE')`,
      [
        loginId,
        safeEmail,
        safeName,
        profileImageUrl || null,
        provider,
        providerUserId,
      ]
    );

    const userId = result.insertId;

    await connection.query(
      `INSERT INTO user_scores
       (user_id, total_score, streak_days)
       VALUES (?, 0, 0)`,
      [userId]
    );

    await connection.commit();

    return {
      user_id: userId,
      login_id: loginId,
      email: safeEmail,
      name: safeName,
      role: "USER",
      status: "ACTIVE",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function kakaoLogin(req, res) {
  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?response_type=code` +
    `&client_id=${process.env.KAKAO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.KAKAO_REDIRECT_URI)}`;

  return res.redirect(kakaoAuthUrl);
}

async function kakaoCallback(req, res) {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code,
        ...(process.env.KAKAO_CLIENT_SECRET
          ? { client_secret: process.env.KAKAO_CLIENT_SECRET }
          : {}),
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUser = userResponse.data;
    const account = kakaoUser.kakao_account || {};
    const profile = account.profile || {};

    const user = await findOrCreateSocialUser({
      provider: "KAKAO",
      providerUserId: String(kakaoUser.id),
      email: account.email,
      name: profile.nickname,
      profileImageUrl: profile.profile_image_url,
    });

    const token = createJwt(user);
    return redirectWithToken(res, token);
  } catch (error) {
    console.error("카카오 로그인 오류:", error.response?.data || error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=kakao`);
  }
}

function naverLogin(req, res) {
  const state = Math.random().toString(36).slice(2);

  const naverAuthUrl =
    `https://nid.naver.com/oauth2.0/authorize` +
    `?response_type=code` +
    `&client_id=${process.env.NAVER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.NAVER_REDIRECT_URI)}` +
    `&state=${state}`;

  return res.redirect(naverAuthUrl);
}

async function naverCallback(req, res) {
  const { code, state } = req.query;

  try {
    const tokenResponse = await axios.get("https://nid.naver.com/oauth2.0/token", {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code,
        state,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://openapi.naver.com/v1/nid/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const naverUser = userResponse.data.response;

    const user = await findOrCreateSocialUser({
      provider: "NAVER",
      providerUserId: String(naverUser.id),
      email: naverUser.email,
      name: naverUser.name || naverUser.nickname,
      profileImageUrl: naverUser.profile_image,
    });

    const token = createJwt(user);
    return redirectWithToken(res, token);
  } catch (error) {
    console.error("네이버 로그인 오류:", error.response?.data || error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=naver`);
  }
}

function googleLogin(req, res) {
  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?response_type=code` +
    `&client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent("openid email profile")}`;

  return res.redirect(googleAuthUrl);
}

async function googleCallback(req, res) {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        code,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const googleUser = userResponse.data;

    const user = await findOrCreateSocialUser({
      provider: "GOOGLE",
      providerUserId: String(googleUser.id),
      email: googleUser.email,
      name: googleUser.name,
      profileImageUrl: googleUser.picture,
    });

    const token = createJwt(user);
    return redirectWithToken(res, token);
  } catch (error) {
    console.error("구글 로그인 오류:", error.response?.data || error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google`);
  }
}


module.exports = {
  signup,
  login,
  kakaoLogin,
  kakaoCallback,
  naverLogin,
  naverCallback,
  googleLogin,
  googleCallback,
};