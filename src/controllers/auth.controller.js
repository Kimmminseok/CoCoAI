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

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: "소셜 로그인으로 가입된 계정입니다.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

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

async function findOrCreateSocialUser({
  provider,
  providerUserId,
  email,
  name,
  profileImageUrl,
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. 이미 같은 소셜 계정으로 가입했는지 확인
    const [providerUsers] = await connection.query(
      `SELECT user_id, login_id, email, name, role, status
       FROM users
       WHERE signup_type = ? AND provider_user_id = ?`,
      [provider, providerUserId]
    );

    if (providerUsers.length > 0) {
      const user = providerUsers[0];

      if (user.status !== "ACTIVE") {
        throw new Error("탈퇴했거나 비활성화된 계정입니다.");
      }

      await connection.commit();
      return user;
    }

    // 2. 같은 이메일을 사용하는 기존 계정 확인
    if (email) {
      const [emailUsers] = await connection.query(
        `SELECT user_id, login_id, email, name, role, status,
                signup_type, provider_user_id
         FROM users
         WHERE email = ?`,
        [email]
      );

      if (emailUsers.length > 0) {
        const existingUser = emailUsers[0];

        if (existingUser.status !== "ACTIVE") {
          throw new Error("탈퇴했거나 비활성화된 계정입니다.");
        }

        // 기존 로컬 계정에 소셜 로그인 정보 연결
        if (existingUser.signup_type === "LOCAL") {
          await connection.query(
            `UPDATE users
             SET signup_type = ?,
                 provider_user_id = ?,
                 profile_image_url = COALESCE(?, profile_image_url)
             WHERE user_id = ?`,
            [
              provider,
              providerUserId,
              profileImageUrl || null,
              existingUser.user_id,
            ]
          );

          await connection.commit();

          return {
            user_id: existingUser.user_id,
            login_id: existingUser.login_id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            status: existingUser.status,
          };
        }

        throw new Error(
          `이미 ${existingUser.signup_type} 방식으로 가입된 이메일입니다.`
        );
      }
    }

    // 3. 기존 계정이 없으면 새 소셜 회원 생성
    const safeEmail =
      email ||
      `${provider.toLowerCase()}_${providerUserId}@social.cocoai.local`;

    const safeName = name || `${provider} 사용자`;
    const loginId = `${provider.toLowerCase()}_${providerUserId}`;

    const [result] = await connection.query(
      `INSERT INTO users
       (
         login_id,
         email,
         password_hash,
         name,
         phone,
         profile_image_url,
         signup_type,
         provider_user_id,
         role,
         status
       )
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

function githubLogin(req, res) {
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GITHUB_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent("read:user user:email")}`;

  return res.redirect(githubAuthUrl);
}

async function githubCallback(req, res) {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    const githubUser = userResponse.data;

    let email = githubUser.email;

    if (!email) {
      const emailResponse = await axios.get("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      });

      const primaryEmail = emailResponse.data.find(
        (item) => item.primary && item.verified
      );

      email = primaryEmail?.email || emailResponse.data[0]?.email;
    }

    const user = await findOrCreateSocialUser({
      provider: "GITHUB",
      providerUserId: String(githubUser.id),
      email,
      name: githubUser.name || githubUser.login,
      profileImageUrl: githubUser.avatar_url,
    });

    const token = createJwt(user);
    return redirectWithToken(res, token);
  } catch (error) {
    console.error("깃허브 로그인 오류:", error.response?.data || error);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=github`);
  }
}


module.exports = {
  signup,
  login,
  kakaoLogin,
  kakaoCallback,
  naverLogin,
  naverCallback,
  githubLogin,
  githubCallback,
};
