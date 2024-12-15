const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = 3000;

// Folder to store uploaded files
const filesDir = path.join(__dirname, "files");

// Ensure the 'files' directory exists
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir); // Save uploaded files to the 'files' directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep original file name
  },
});

const upload = multer({ storage });

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to upload a file
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  console.log(`File uploaded: ${req.file.originalname}`);
  res.status(200).send("File uploaded successfully.");
});

// Endpoint to get all files (excluding archives)
app.get("/files", (req, res) => {
  if (!fs.existsSync(filesDir)) {
    return res.status(500).send("Files directory not found.");
  }

  fs.readdir(filesDir, (err, files) => {
    if (err) {
      console.error("Error reading files directory:", err);
      return res.status(500).send("Error reading files.");
    }

    // Exclude archive files
    const validFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ![".zip", ".tar", ".rar", ".tar.gz"].includes(ext);
    });

    res.json(validFiles);
  });
});

// Endpoint to download a file
app.get("/download/:filename", (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(filesDir, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found.");
  }

  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    ".mp4": "video/mp4",
    ".mp3": "audio/mp3",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".pdf": "application/pdf",
    ".mkv": "video/x-matroska",
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";
  res.set({
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${fileName}"`,
  });

  fs.createReadStream(filePath).pipe(res);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
