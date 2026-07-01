const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

module.exports = {
  signup,
  login,
};