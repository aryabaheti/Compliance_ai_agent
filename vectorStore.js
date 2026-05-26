const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { pipeline } = require("@xenova/transformers");

let embedder;

let documents = [];

async function initializeVectorStore() {

  embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  console.log("Embedding model loaded");

}

async function createEmbedding(text) {

  const output = await embedder(text, {
    pooling: "mean",
    normalize: true
  });

  return Array.from(output.data);

}

async function addDocumentsToVectorStore(text) {

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 300
  });

  const docs = await splitter.createDocuments([text]);

  for (const doc of docs) {

    const chunk = doc.pageContent;

    const embedding = await createEmbedding(chunk);

    documents.push({
      text: chunk,
      embedding
    });

  }

  console.log("Documents embedded");

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

    score: cosineSimilarity(
      queryEmbedding,
      doc.embedding
    )

  }));

  scoredDocs.sort((a, b) => b.score - a.score);

  return scoredDocs
    .slice(0, 6)
    .map(doc => doc.text)
    .join("\n\n");

}

module.exports = {
  initializeVectorStore,
  addDocumentsToVectorStore,
  searchDocuments
};