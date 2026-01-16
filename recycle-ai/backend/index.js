import "dotenv/config"
import express from "express"
import dotenv from "dotenv"
import detectRouter from "./routes/detect.js"

dotenv.config()

const app = express()

app.use("/api/detect", detectRouter)

app.listen(3001, () => {
  console.log("Backend running on port 3001")
})


// // list-models.js (임시 파일로 실행해 보세요)
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import dotenv from "dotenv";
// dotenv.config();

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// async function checkModels() {
//   try {
//     const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
//     const data = await response.json();
//     console.log("사용 가능한 모델 리스트:");
//     data.models.forEach(m => console.log("- " + m.name));
//   } catch (e) {
//     console.error("모델 리스트를 가져오는데 실패했습니다.", e);
//   }
// }

// checkModels();