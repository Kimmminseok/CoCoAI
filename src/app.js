const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const learningRoutes = require("./routes/learning.routes");
const scoreRoutes = require("./routes/score.routes");
const studyRoutes = require("./routes/study.routes");
const aiRoutes = require("./routes/ai.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CoCoAI 백엔드 서버 실행 중",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/study-sessions", studyRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;