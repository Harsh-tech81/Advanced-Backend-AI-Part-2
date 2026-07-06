import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import {
  Annotation,
  StateGraph,
  START,
  END,
  MessagesAnnotation,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";

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

const tool = new TavilySearch({
  maxResults:5,
  topic: "general",
});
const tools = [tool];
const toolNode = new ToolNode(tools);

// With LangChain
const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 100,
  maxRetries: 2,
}).bindTools(tools);

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
  const response = await llm.invoke([
    {
      role: "system",
      content:
        "You are an AI Assistant and your Name is Jarvis. If you don't know the answer to a question, then call a relevent tool.",
    },
    ...state.messages,
  ]);
  return { messages: [response] };
};

const shouldContinue = async (state) => {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return "__end__";
};
// MessagesAnnotation is built-in annotation that represents a list of messages in a chat-like format. It is used to define the structure of the state in the StateGraph. In this case, it is used to represent the messages exchanged between the user and the AI assistant. Earlier we have created a custom annotation called State, but here we are using the built-in MessagesAnnotation for simplicity. You can use your custom annotation if you want to have more control over the state structure and validation.
const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callLLM)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .compile();

app.post("/ai", async (req, res) => {
  const { prompt } = req.body;
  const response = await graph.invoke({
    messages: [{ role: "user", content: prompt }],
  });
  console.log("response:", response);
  return res
    .status(200)
    .json({ "ai : ": response.messages[response.messages.length - 1].content });
});

app.get("/", (req, res) => {
  res.send("Learn LLMs");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
