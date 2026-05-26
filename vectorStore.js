const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

let documents = [];

async function initializeVectorStore() {

  console.log("Simple vector store initialized");

}

async function addDocumentsToVectorStore(text) {

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 300
  });

  const docs = await splitter.createDocuments([text]);

  documents = docs.map(doc => ({
    text: doc.pageContent
  }));

  console.log("Documents indexed");

}

async function searchDocuments(question) {

  const lowerQuestion = question.toLowerCase();

  const matchedDocs = documents.filter(doc =>
    doc.text.toLowerCase().includes(
      lowerQuestion.split(" ")[0]
    )
  );

  return matchedDocs
    .slice(0, 6)
    .map(doc => doc.text)
    .join("\n\n");

}

module.exports = {
  initializeVectorStore,
  addDocumentsToVectorStore,
  searchDocuments
};