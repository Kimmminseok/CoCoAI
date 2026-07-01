require("dotenv").config();
const OpenAI = require("openai");
const { buildProblemPrompt } = require("./prompt.service");

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function generateProblems({ languageName, difficulty, count }) {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const prompt = buildProblemPrompt(languageName, difficulty, count);

  const response = await client.responses.create({
    model,
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "coding_problem_list",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            problems: {
              type: "array",
              minItems: count,
              maxItems: count,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  topic: { type: "string" },
                  question: { type: "string" },
                  choices: {
                    type: "array",
                    minItems: 4,
                    maxItems: 4,
                    items: { type: "string" },
                  },
                  answer: {
                    type: "number",
                    enum: [1, 2, 3, 4],
                  },
                  explanation: { type: "string" },
                },
                required: [
                  "topic",
                  "question",
                  "choices",
                  "answer",
                  "explanation",
                ],
              },
            },
          },
          required: ["problems"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.output_text);
  } catch (error) {
    console.error("AI 응답 JSON 파싱 실패:");
    console.error(response.output_text);

    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }
}

module.exports = {
  generateProblems,
};