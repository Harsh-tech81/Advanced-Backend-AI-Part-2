import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

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

// With LangChain
const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 100,
  maxRetries: 2,
});

// app.post("/ai", async (req, res) => {
//   const { prompt } = req.body;
//   const response = await llm.invoke([
//     {
//       role: "system",
//       content:
//         "You are an AI Assistant and your Name is Jarvis. If you don't know the answer to a question, please respond with 'I don't know'.",
//     },
//     {
//       role: "human",
//       content: prompt,
//     },
//   ]);
//   return res.status(200).json({ AI_Response: response.content });
// });

const State = Annotation.Root({
  prompt: Annotation,
  AI_Response: Annotation,
});
const callLLM = async (state) => {
  console.log("state:", state);
  const prompt = state.prompt;
  const response = await llm.invoke([
    {
      role: "system",
      content:
        "You are an AI Assistant and your Name is Jarvis. If you don't know the answer to a question, please respond with 'I don't know'.",
    },
    {
      role: "human",
      content: prompt,
    },
  ]);
  return { AI_Response : response.content };
};
const graph = new StateGraph(State)
  .addNode("agent", callLLM)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__")
  .compile()

app.post("/ai", async (req, res) => {
  const { prompt } = req.body;
 const response = await graph.invoke({
    prompt: prompt,
  });
  console.log("response:", response);
  return res.status(200).json({ AI_Response: response });
});


app.get("/", (req, res) => {
  res.send("Learn LLMs");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
