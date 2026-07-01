const pool = require("../config/db");

function getTodayDate() {
  const now = new Date();
  now.setHours(now.getHours() + 9);
  return now.toISOString().slice(0, 10);
}

function getYesterdayDate(today) {
  const date = new Date(today);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function getBaseScore(difficulty) {
  if (difficulty === "EASY") return 32;
  if (difficulty === "NORMAL") return 64;
  if (difficulty === "HARD") return 128;
  return 0;
}

function getAccuracyCoefficient(accuracyRate) {
  if (accuracyRate >= 100) return 1.5;
  if (accuracyRate >= 50) return 1.0;
  return 0.5;
}

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

async function saveStudyResultToDb({
  userId,
  languageId,
  difficulty,
  totalCount,
  correctCount,
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO study_sessions
       (user_id, language_id, difficulty, total_count, correct_count)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, languageId, difficulty, totalCount, correctCount]
    );

    const [scores] = await connection.query(
      `SELECT user_id, total_score, streak_days, last_study_date
       FROM user_scores
       WHERE user_id = ?
       FOR UPDATE`,
      [userId]
    );

    let currentScore = 0;
    let currentStreak = 0;
    let lastStudyDate = null;

    if (scores.length === 0) {
      await connection.query(
        `INSERT INTO user_scores
         (user_id, total_score, streak_days)
         VALUES (?, 0, 0)`,
        [userId]
      );
    } else {
      currentScore = scores[0].total_score;
      currentStreak = scores[0].streak_days;
      lastStudyDate = formatDate(scores[0].last_study_date);
    }

    const today = getTodayDate();
    const yesterday = getYesterdayDate(today);

    let newStreak = currentStreak;
    let isNewStudyDay = false;

    if (!lastStudyDate) {
      newStreak = 1;
      isNewStudyDay = true;
    } else if (lastStudyDate === today) {
      newStreak = currentStreak;
      isNewStudyDay = false;
    } else if (lastStudyDate === yesterday) {
      newStreak = currentStreak + 1;
      isNewStudyDay = true;
    } else {
      newStreak = 1;
      isNewStudyDay = true;
    }

    const accuracyRate = (correctCount / totalCount) * 100;
    const baseScore = getBaseScore(difficulty);
    const accuracyCoefficient = getAccuracyCoefficient(accuracyRate);

    const problemScore = Math.floor(correctCount * baseScore * accuracyCoefficient);
    const streakBonus = isNewStudyDay
      ? Math.floor(64 * Math.log2(newStreak + 1))
      : 0;

    const earnedScore = problemScore + streakBonus;
    const newTotalScore = currentScore + earnedScore;

    await connection.query(
      `UPDATE user_scores
       SET total_score = ?,
           streak_days = ?,
           last_study_date = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [newTotalScore, newStreak, today, userId]
    );

    const [tiers] = await connection.query(
      `SELECT tier_id, tier_name, min_score, max_score, description
       FROM tiers
       WHERE ? >= min_score
         AND ? < max_score
       ORDER BY min_score DESC
       LIMIT 1`,
      [newTotalScore, newTotalScore]
    );

    const currentTier = tiers[0] || null;
    const detailTier = currentTier ? getDetailTier(newTotalScore, currentTier) : null;

    await connection.commit();

    return {
      total_count: totalCount,
      correct_count: correctCount,
      wrong_count: totalCount - correctCount,
      accuracy_rate: Number(accuracyRate.toFixed(2)),
      earned_score: earnedScore,
      problem_score: problemScore,
      streak_bonus: streakBonus,
      total_score: newTotalScore,
      streak_days: newStreak,
      tier: currentTier
        ? {
            tier_name: currentTier.tier_name,
            detail_tier: detailTier,
            min_score: currentTier.min_score,
            max_score: currentTier.max_score,
          }
        : null,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  saveStudyResultToDb,
};