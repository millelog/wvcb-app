require("dotenv").config();
const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require("fs").promises;
const path = require("path");

const accountName = "wvcbfrontend";
const containerName = "$web";
const sasToken = process.env.AZURE_STORAGE_SAS_TOKEN;

if (!sasToken) {
  throw new Error("AZURE_STORAGE_SAS_TOKEN is not defined in .env file");
}

const blobServiceUrl = `https://${accountName}.blob.core.windows.net/?${sasToken}`;
const blobServiceClient = new BlobServiceClient(blobServiceUrl);
const containerClient = blobServiceClient.getContainerClient(containerName);

async function deleteAllBlobs() {
  console.log("Deleting existing blobs...");
  for await (const blob of containerClient.listBlobsFlat()) {
    await containerClient.deleteBlob(blob.name);
    console.log(`Deleted blob: ${blob.name}`);
  }
  console.log("All existing blobs deleted.");
}

async function uploadFile(filePath) {
  const blobName = path
    .relative("frontend/wvcb-frontend/dist/wvcb-frontend/browser", filePath)
    .split(path.sep)
    .join("/");
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    const data = await fs.readFile(filePath);
    const contentType = getContentType(filePath);
    await blockBlobClient.upload(data, data.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    console.log(`Uploaded file ${blobName} successfully`);
  } catch (error) {
    console.error(`Error uploading file ${blobName}: ${error.message}`);
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html";
    case ".js":
      return "application/javascript";
    case ".css":
      return "text/css";
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

async function uploadDirectory(directory) {
  const files = await fs.readdir(directory, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(directory, file.name);
    if (file.isDirectory()) {
      await uploadDirectory(filePath);
    } else {
      await uploadFile(filePath);
    }
  }
}

async function main() {
  const sourceDir = "frontend/wvcb-frontend/dist/wvcb-frontend/browser";
  try {
    await deleteAllBlobs();
    await uploadDirectory(sourceDir);
    console.log("Upload completed successfully");
    console.log("\nYour website is now available at:");
    console.log(`https://${accountName}.z21.web.core.windows.net/`);
  } catch (error) {
    console.error(`Error during upload: ${error.message}`);
  }
}

main();
