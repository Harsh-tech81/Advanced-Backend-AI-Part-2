import express from "express";
import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { PDFParse } from "pdf-parse";
import fs from "fs";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";


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

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001", // 768 dimensions
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Document title",
});

const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: process.env.QDRANT_URL,
  collectionName: "grocery-Store",
});

const upload = async () => {
  const pdfPath = "./knowledge.pdf";
  const buffer = fs.readFileSync(pdfPath);
  const pdfResult = new PDFParse({ data: buffer });
  const result = await pdfResult.getText();
  const text = result.text;
  const spilitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await spilitter.createDocuments([text]);
  await vectorStore.addDocuments(docs);
};

app.get("/", (req, res) => {
  res.send("Learn RAG");
});

app.post("/ai", async (req, res) => {
  const { prompt } = req.body;

  const docs = await vectorStore.similaritySearch(prompt, 5);
  // console.log(docs);
  const context = docs.map((doc) => doc.pageContent).join("\n");
  const response = await llm.invoke([
    new SystemMessage(
      `You are a RAG AI Assistant. STRICT RULES : - Answer ONLY from the Context - Do not use outside knowledge - If answer not found say : " I don't know from the uploaded PDF. " Context: ${context}`
    )
    ,
    new HumanMessage(prompt),
  ]);
  return res.status(200).json({ AI_Response: response.content });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
