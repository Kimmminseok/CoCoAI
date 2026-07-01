const pool = require("../config/db");

function getDetailTier(totalScore, tier) {
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

async function getMyScore(req, res) {
  const userId = req.user.user_id;

  try {
    let [scores] = await pool.query(
      `SELECT user_id, total_score, streak_days, last_study_date, updated_at
       FROM user_scores
       WHERE user_id = ?`,
      [userId]
    );

    if (scores.length === 0) {
      await pool.query(
        `INSERT INTO user_scores
         (user_id, total_score, streak_days)
         VALUES (?, 0, 0)`,
        [userId]
      );

      scores = [
        {
          user_id: userId,
          total_score: 0,
          streak_days: 0,
          last_study_date: null,
          updated_at: null,
        },
      ];
    }

    const score = scores[0];
    const totalScore = score.total_score;

    const [tiers] = await pool.query(
      `SELECT tier_id, tier_name, min_score, max_score, description
       FROM tiers
       WHERE ? >= min_score
         AND ? < max_score
       ORDER BY min_score DESC
       LIMIT 1`,
      [totalScore, totalScore]
    );

    if (tiers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "현재 점수에 해당하는 티어를 찾을 수 없습니다.",
      });
    }

    const currentTier = tiers[0];
    const detailTier = getDetailTier(totalScore, currentTier);

    const [nextTiers] = await pool.query(
      `SELECT tier_id, tier_name, min_score, max_score
       FROM tiers
       WHERE min_score > ?
       ORDER BY min_score ASC
       LIMIT 1`,
      [totalScore]
    );

    const nextTier = nextTiers.length > 0 ? nextTiers[0] : null;

    const tierRange = currentTier.max_score - currentTier.min_score;
    const tierProgress = totalScore - currentTier.min_score;
    const progressPercent = Math.floor((tierProgress / tierRange) * 100);

    return res.json({
      success: true,
      message: "점수 및 티어 조회 성공",
      data: {
        total_score: totalScore,
        streak_days: score.streak_days,
        last_study_date: score.last_study_date,

        tier: {
          tier_name: currentTier.tier_name,
          detail_tier: detailTier,
          min_score: currentTier.min_score,
          max_score: currentTier.max_score,
          progress_percent: progressPercent,
        },

        next_tier: nextTier
          ? {
              tier_name: nextTier.tier_name,
              required_score: nextTier.min_score,
              remaining_score: nextTier.min_score - totalScore,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("점수 및 티어 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  getMyScore,
};