const app = require("./src/app");
const pool = require("./src/config/db");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL DB 연결 성공");
    connection.release();

    app.listen(PORT, () => {
      console.log(`서버 실행 중: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MySQL DB 연결 실패:", error.message);
  }
}

startServer();