const {
  initializeVectorStore,
  addDocumentsToVectorStore,
  searchDocuments
} = require("./vectorStore");
const loadDocuments = require("./ingest");
const express = require("express");
const cors = require("cors");


const OpenAI = require("openai");

const app = express();

app.use(express.json());
app.use(cors());

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

let handbookText = "";

async function initializeDocuments() {

  try {

    handbookText = await loadDocuments();

    console.log("All documents loaded");

    await initializeVectorStore();

    await addDocumentsToVectorStore(handbookText);

    console.log("Vector DB initialized");

  } catch (error) {

    console.log("Document loading error:");
    console.log(error);

  }

}

initializeDocuments();

app.get("/", (req, res) => {
  res.send("Compliance AI running");
});

app.post("/ask", async (req, res) => {

  try {

    const question = req.body.question;

    console.log("Question:", question);

    const finalContext = await searchDocuments(question);

    const prompt = `
You are a strict HR compliance assistant.

Rules:
- Answer ONLY using handbook context
- Keep answers concise and professional
- Summarize instead of copying entire sections
- Use bullet points when useful
- If answer is unavailable, say:
"Information not found in handbook."
- NEVER invent information

HANDBOOK CONTEXT:
${finalContext}

QUESTION:
${question}
`;

    const completion = await client.chat.completions.create({

      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "user",
          content: prompt
        }
      ]

    });

    res.json({
      answer: completion.choices[0].message.content
    });

  } catch (error) {

    console.log("FULL ERROR:");
    console.log(error);

    res.status(500).json({
      error: error.message
    });

  }

});

async function startServer() {

  await initializeDocuments();

  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });

}

startServer();