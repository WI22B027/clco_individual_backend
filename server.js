const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

const app = express();
const port = 3001;

app.use(cors());

app.get("/", (req, res) => {
  res.send(
    "Willkommen bei der Backend-API. Verwenden Sie /upload, um Dateien hochzuladen."
  );
});

// Azure Storage Verbindung
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error(
    "AZURE_STORAGE_CONNECTION_STRING ist nicht definiert. Überprüfe deine .env-Datei."
  );
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING
);
const containerName = "uploads";

// Multer für Dateiuploads
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = req.file.originalname;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Datei hochladen
    await blockBlobClient.uploadFile(req.file.path);

    // Temporäre Datei löschen
    fs.unlinkSync(req.file.path);

    res.send({
      message: "Datei erfolgreich hochgeladen.",
      fileName: blobName,
      fileUrl: `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerName}/${blobName}`,
    });
  } catch (error) {
    console.error("Fehler beim Hochladen:", error);
    res.status(500).send({ message: "Fehler beim Hochladen der Datei." });
  }
});

app.listen(port, () =>
  console.log(`Server läuft auf http://localhost:${port}`)
);
