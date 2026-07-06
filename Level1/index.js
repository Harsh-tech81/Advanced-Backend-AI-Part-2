import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

// Without LangChain
// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });


// app.post("/ai", async (req, res) => {
//   const { prompt } = req.body;
//   const response = await ai.models.generateContent({
//     model: "gemini-3.5-flash",
//     contents: [
//       {
//         role: "system",
//         parts: [
//           {
//             text: "you are an AI Assistant and your Name is Jarvis.if you don't know the answer to a question, please respond with 'I don't know'.",
//           },
//         ],
//       },
//       {
//         role: "user",
//         parts: [{ text: prompt }],
//       },
//     ],
//   });
//   return res.status(200).json({ "AI_Response : ": response.text });
// });












app.get("/", (req, res) => {
  res.send("Learn LLMs");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
