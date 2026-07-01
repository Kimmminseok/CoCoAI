const pool = require("../config/db");

async function getMyInfo(req, res) {
  try {
    const userId = req.user.user_id;

    const [users] = await pool.query(
      `SELECT user_id, login_id, email, name, phone, profile_image_url, role, status, created_at
       FROM users
       WHERE user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    return res.json({
      success: true,
      message: "내 정보 조회 성공",
      data: users[0],
    });
  } catch (error) {
    console.error("내 정보 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  getMyInfo,
};