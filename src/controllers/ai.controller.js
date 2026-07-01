const crypto = require("crypto");
const pool = require("../config/db");
const { generateProblems } = require("../services/openai.service");
const { saveStudyResultToDb } = require("../services/studyResult.service");

const problemSetStore = new Map();

async function createProblems(req, res) {
  const userId = req.user.user_id;
  const { language_id, difficulty, count } = req.body;

  if (!language_id || !difficulty || !count) {
    return res.status(400).json({
      success: false,
      message: "학습 언어, 난이도, 문제 수는 필수입니다.",
    });
  }

  if (!["EASY", "NORMAL", "HARD"].includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: "난이도는 EASY, NORMAL, HARD 중 하나여야 합니다.",
    });
  }

  if (count < 1 || count > 10) {
    return res.status(400).json({
      success: false,
      message: "문제 수는 1개 이상 10개 이하로 요청해야 합니다.",
    });
  }

  try {
    const [languages] = await pool.query(
      `SELECT language_id, language_name
       FROM languages
       WHERE language_id = ?`,
      [language_id]
    );

    if (languages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "존재하지 않는 학습 언어입니다.",
      });
    }

    const languageName = languages[0].language_name;

    const result = await generateProblems({
      languageName,
      difficulty,
      count,
    });

    const problems = result.problems.map((problem, index) => ({
      problem_id: index + 1,
      topic: problem.topic,
      question: problem.question,
      choices: problem.choices,
      answer: problem.answer,
      explanation: problem.explanation,
    }));

    const problemSetId = crypto.randomUUID();

    problemSetStore.set(problemSetId, {
      user_id: userId,
      language_id,
      language_name: languageName,
      difficulty,
      problems,
      created_at: Date.now(),
    });

    const publicProblems = problems.map((problem) => ({
      problem_id: problem.problem_id,
      topic: problem.topic,
      question: problem.question,
      choices: problem.choices,
    }));

    return res.json({
      success: true,
      message: "AI 문제 생성 성공",
      data: {
        problem_set_id: problemSetId,
        language_id,
        language_name: languageName,
        difficulty,
        count,
        problems: publicProblems,
      },
    });
  } catch (error) {
    console.error("AI 문제 생성 오류 전체:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "AI 문제 생성 중 오류가 발생했습니다.",
    });
  }
}

async function submitProblems(req, res) {
  const userId = req.user.user_id;
  const { problem_set_id, answers } = req.body;

  if (!problem_set_id || !Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      message: "problem_set_id와 answers는 필수입니다.",
    });
  }

  const savedSet = problemSetStore.get(problem_set_id);

  if (!savedSet) {
    return res.status(404).json({
      success: false,
      message: "문제 세트를 찾을 수 없습니다. 문제를 다시 생성해주세요.",
    });
  }

  if (savedSet.user_id !== userId) {
    return res.status(403).json({
      success: false,
      message: "다른 사용자의 문제 세트는 제출할 수 없습니다.",
    });
  }

  try {
    let correctCount = 0;

    const feedback = savedSet.problems.map((problem) => {
      const submitted = answers.find(
        (answer) => Number(answer.problem_id) === Number(problem.problem_id)
      );

      const selectedAnswer = submitted ? Number(submitted.selected_answer) : null;
      const isCorrect = selectedAnswer === Number(problem.answer);

      if (isCorrect) {
        correctCount += 1;
      }

      return {
        problem_id: problem.problem_id,
        topic: problem.topic,
        question: problem.question,
        choices: problem.choices,
        selected_answer: selectedAnswer,
        correct_answer: problem.answer,
        is_correct: isCorrect,
        explanation: problem.explanation,
      };
    });

    const totalCount = savedSet.problems.length;

    const scoreResult = await saveStudyResultToDb({
      userId,
      languageId: savedSet.language_id,
      difficulty: savedSet.difficulty,
      totalCount,
      correctCount,
    });

    problemSetStore.delete(problem_set_id);

    return res.json({
      success: true,
      message: "문제 풀이 제출 성공",
      data: {
        language_id: savedSet.language_id,
        language_name: savedSet.language_name,
        difficulty: savedSet.difficulty,
        result: scoreResult,
        feedback,
      },
    });
  } catch (error) {
    console.error("문제 풀이 제출 오류:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "문제 풀이 제출 중 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  createProblems,
  submitProblems,
};