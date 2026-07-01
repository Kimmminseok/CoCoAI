const pool = require("../config/db");

function getDetailTier(totalScore, tier) {
  if (!tier) return null;

  const min = tier.min_score;
  const max = tier.max_score;
  const tierName = tier.tier_name;

  const section = (max - min) / 4;
  const progress = totalScore - min;

  if (progress >= section * 3) return `3${tierName}`;
  if (progress >= section * 2) return `2${tierName}`;
  if (progress >= section * 1) return `1${tierName}`;

  return tierName;
}

async function getDashboardSummary(req, res) {
  const userId = req.user.user_id;

  try {
    const [users] = await pool.query(
      `SELECT user_id, login_id, email, name, profile_image_url
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

    const user = users[0];

    const [scores] = await pool.query(
      `SELECT total_score, streak_days, last_study_date
       FROM user_scores
       WHERE user_id = ?`,
      [userId]
    );

    const score = scores[0] || {
      total_score: 0,
      streak_days: 0,
      last_study_date: null,
    };

    const totalScore = score.total_score;

    const [tiers] = await pool.query(
      `SELECT tier_id, tier_name, min_score, max_score
       FROM tiers
       WHERE ? >= min_score
         AND ? < max_score
       ORDER BY min_score DESC
       LIMIT 1`,
      [totalScore, totalScore]
    );

    const currentTier = tiers[0] || null;
    const detailTier = getDetailTier(totalScore, currentTier);

    const [settings] = await pool.query(
      `SELECT 
         ls.setting_id,
         ls.language_id,
         l.language_name,
         f.field_name,
         ls.difficulty,
         ls.updated_at
       FROM learning_settings ls
       JOIN languages l ON ls.language_id = l.language_id
       JOIN fields f ON l.field_id = f.field_id
       WHERE ls.user_id = ?
       ORDER BY ls.updated_at DESC
       LIMIT 1`,
      [userId]
    );

    const learningSetting = settings.length > 0 ? settings[0] : null;

    const [recentSessions] = await pool.query(
      `SELECT
         ss.session_id,
         ss.language_id,
         l.language_name,
         f.field_name,
         ss.difficulty,
         ss.total_count,
         ss.correct_count,
         ss.studied_at
       FROM study_sessions ss
       JOIN languages l ON ss.language_id = l.language_id
       JOIN fields f ON l.field_id = f.field_id
       WHERE ss.user_id = ?
       ORDER BY ss.studied_at DESC
       LIMIT 5`,
      [userId]
    );

    const recentSessionsData = recentSessions.map((session) => ({
      session_id: session.session_id,
      language_id: session.language_id,
      language_name: session.language_name,
      field_name: session.field_name,
      difficulty: session.difficulty,
      total_count: session.total_count,
      correct_count: session.correct_count,
      wrong_count: session.total_count - session.correct_count,
      accuracy_rate:
        session.total_count > 0
          ? Number(((session.correct_count / session.total_count) * 100).toFixed(2))
          : 0,
      studied_at: session.studied_at,
    }));

    return res.json({
      success: true,
      message: "대시보드 요약 조회 성공",
      data: {
        user: {
          user_id: user.user_id,
          login_id: user.login_id,
          email: user.email,
          name: user.name,
          profile_image_url: user.profile_image_url,
        },

        score: {
          total_score: score.total_score,
          streak_days: score.streak_days,
          last_study_date: score.last_study_date,
          tier_name: currentTier ? currentTier.tier_name : null,
          detail_tier: detailTier,
          tier_min_score: currentTier ? currentTier.min_score : null,
          tier_max_score: currentTier ? currentTier.max_score : null,
        },

        learning_setting: learningSetting
          ? {
              setting_id: learningSetting.setting_id,
              language_id: learningSetting.language_id,
              language_name: learningSetting.language_name,
              field_name: learningSetting.field_name,
              difficulty: learningSetting.difficulty,
              updated_at: learningSetting.updated_at,
            }
          : null,

        recent_sessions: recentSessionsData,
      },
    });
  } catch (error) {
    console.error("대시보드 요약 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  getDashboardSummary,
};