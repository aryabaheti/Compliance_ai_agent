const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { pipeline } = require("@xenova/transformers");

let embedder = null;

let documents = [];

async function initializeVectorStore() {

  try {

    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    console.log("Embedding model loaded");

  } catch (error) {

    console.log("Embedding model error:", error);

  }

}

async function createEmbedding(text) {

  if (!embedder) {
    throw new Error("Embedder not initialized");
  }

  const output = await embedder(text, {
    pooling: "mean",
    normalize: true
  });

  return Array.from(output.data);

}

async function addDocumentsToVectorStore(text) {

  documents = [];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50
  });

  const docs = await splitter.createDocuments([text]);

  for (const doc of docs) {

    const embedding = await createEmbedding(doc.pageContent);

    documents.push({
      text: doc.pageContent,
      embedding
    });

  }

  console.log("Documents indexed");

}

function cosineSimilarity(a, b) {

  let sum = 0;

  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }

  return sum;

}

async function searchDocuments(question) {

  const queryEmbedding = await createEmbedding(question);

  const scoredDocs = documents.map(doc => ({
    text: doc.text,
    score: cosineSimilarity(queryEmbedding, doc.embedding)
  }));

  scoredDocs.sort((a, b) => b.score - a.score);

  return scoredDocs
    .slice(0, 2)
    .map(doc => doc.text)
    .join("\n\n");

}

module.exports = {
  initializeVectorStore,
  addDocumentsToVectorStore,
  searchDocuments
};