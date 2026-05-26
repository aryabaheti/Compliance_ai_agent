const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

async function loadDocuments() {

  const uploadsFolder = path.join(__dirname, "uploads");

  const files = fs.readdirSync(uploadsFolder);

  let allText = "";

  for (const file of files) {

    const filePath = path.join(uploadsFolder, file);

    // DOCX
    if (file.endsWith(".docx")) {

      const result = await mammoth.extractRawText({
        path: filePath
      });

      allText += "\n" + result.value;

      console.log(file + " loaded");

    }

    // PDF
    else if (file.endsWith(".pdf")) {

      const dataBuffer = fs.readFileSync(filePath);

      const pdfData = await pdfParse(dataBuffer);

      allText += "\n" + pdfData.text;

      console.log(file + " loaded");

    }

  }

  return allText;

}

module.exports = loadDocuments;