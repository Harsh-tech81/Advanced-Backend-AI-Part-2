import express from "express";
import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 100,
  maxRetries: 2,
});

app.get("/", (req, res) => {
  res.send("Learn RAG");
});

app.post("/ai", async (req, res) => {
  const { prompt } = req.body;
  const response = await llm.invoke(
   prompt
  )
  return res
    .status(200)
    .json({ "ai :": response.content });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
