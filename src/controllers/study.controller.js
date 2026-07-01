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

async function saveStudyResult(req, res) {
  const userId = req.user.user_id;
  const { language_id, difficulty, total_count, correct_count } = req.body;

  if (!language_id || !difficulty || total_count == null || correct_count == null) {
    return res.status(400).json({
      success: false,
      message: "학습 언어, 난이도, 전체 문제 수, 정답 수는 필수입니다.",
    });
  }

  if (!["EASY", "NORMAL", "HARD"].includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: "난이도는 EASY, NORMAL, HARD 중 하나여야 합니다.",
    });
  }

  if (total_count <= 0 || correct_count < 0 || correct_count > total_count) {
    return res.status(400).json({
      success: false,
      message: "문제 수 또는 정답 수가 올바르지 않습니다.",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [languages] = await connection.query(
      `SELECT language_id FROM languages WHERE language_id = ?`,
      [language_id]
    );

    if (languages.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "존재하지 않는 학습 언어입니다.",
      });
    }

    await connection.query(
      `INSERT INTO study_sessions
       (user_id, language_id, difficulty, total_count, correct_count)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, language_id, difficulty, total_count, correct_count]
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

    const accuracyRate = (correct_count / total_count) * 100;
    const baseScore = getBaseScore(difficulty);
    const accuracyCoefficient = getAccuracyCoefficient(accuracyRate);

    const problemScore = Math.floor(correct_count * baseScore * accuracyCoefficient);
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

    return res.json({
      success: true,
      message: "학습 결과 저장 성공",
      data: {
        total_count,
        correct_count,
        wrong_count: total_count - correct_count,
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
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("학습 결과 저장 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  } finally {
    connection.release();
  }
}

async function getMyStudySessions(req, res) {
  const userId = req.user.user_id;

  try {
    const [sessions] = await pool.query(
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
       ORDER BY ss.studied_at DESC`,
      [userId]
    );

    const result = sessions.map((session) => ({
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
      message: "내 학습 기록 조회 성공",
      data: result,
    });
  } catch (error) {
    console.error("내 학습 기록 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  saveStudyResult,
  getMyStudySessions,
};