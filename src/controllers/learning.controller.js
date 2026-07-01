const pool = require("../config/db");

// 학습 분야 조회
async function getFields(req, res) {
  try {
    const [fields] = await pool.query(
      `SELECT field_id, field_name
       FROM fields
       ORDER BY field_id ASC`
    );

    return res.json({
      success: true,
      message: "학습 분야 조회 성공",
      data: fields,
    });
  } catch (error) {
    console.error("학습 분야 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}

// 학습 언어 조회
async function getLanguages(req, res) {
  try {
    const [languages] = await pool.query(
      `SELECT 
         l.language_id,
         l.language_name,
         f.field_id,
         f.field_name
       FROM languages l
       JOIN fields f ON l.field_id = f.field_id
       ORDER BY l.language_id ASC`
    );

    return res.json({
      success: true,
      message: "학습 언어 조회 성공",
      data: languages,
    });
  } catch (error) {
    console.error("학습 언어 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}
// 학습 설정 저장
async function saveLearningSetting(req, res) {
  const userId = req.user.user_id;
  const { language_id, difficulty } = req.body;

  if (!language_id || !difficulty) {
    return res.status(400).json({
      success: false,
      message: "학습 언어와 난이도는 필수입니다.",
    });
  }

  if (!["EASY", "NORMAL", "HARD"].includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: "난이도는 EASY, NORMAL, HARD 중 하나여야 합니다.",
    });
  }

  try {
    const [languages] = await pool.query(
      `SELECT language_id FROM languages WHERE language_id = ?`,
      [language_id]
    );

    if (languages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "존재하지 않는 학습 언어입니다.",
      });
    }

    const [existingSettings] = await pool.query(
      `SELECT setting_id
       FROM learning_settings
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (existingSettings.length > 0) {
      await pool.query(
        `UPDATE learning_settings
         SET language_id = ?, difficulty = ?
         WHERE setting_id = ?`,
        [language_id, difficulty, existingSettings[0].setting_id]
      );
    } else {
      await pool.query(
        `INSERT INTO learning_settings
         (user_id, language_id, difficulty)
         VALUES (?, ?, ?)`,
        [userId, language_id, difficulty]
      );
    }

    return res.json({
      success: true,
      message: "학습 설정 저장 성공",
    });
  } catch (error) {
    console.error("학습 설정 저장 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}

// 내 학습 설정 조회
async function getMyLearningSetting(req, res) {
  const userId = req.user.user_id;

  try {
    const [settings] = await pool.query(
      `SELECT 
         ls.setting_id,
         ls.language_id,
         l.language_name,
         f.field_name,
         ls.difficulty,
         ls.created_at,
         ls.updated_at
       FROM learning_settings ls
       JOIN languages l ON ls.language_id = l.language_id
       JOIN fields f ON l.field_id = f.field_id
       WHERE ls.user_id = ?
       ORDER BY ls.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (settings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "저장된 학습 설정이 없습니다.",
      });
    }

    return res.json({
      success: true,
      message: "내 학습 설정 조회 성공",
      data: settings[0],
    });
  } catch (error) {
    console.error("내 학습 설정 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  getFields,
  getLanguages,
  saveLearningSetting,
  getMyLearningSetting,
};