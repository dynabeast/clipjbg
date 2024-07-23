const express = require("express");
const youtubedl = require("youtube-dl-exec");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const validator = require("validator");
const axios = require("axios"); // Add this line to import axios
const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*",
    methods: ["GET"],
  })
);

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// URL validation function
function isValidYoutubeUrl(url) {
  return (
    validator.isURL(url) &&
    (url.includes("youtube.com") || url.includes("youtu.be"))
  );
}

// Download route
app.get("/download", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || !isValidYoutubeUrl(url)) {
      return res.status(400).send("Invalid or missing YouTube URL");
    }

    console.log("Attempting to download:", url);

    const videoInfo = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
    });

    if (!videoInfo || !videoInfo.title) {
      throw new Error("Failed to retrieve video title");
    }

    const sanitizedTitle = videoInfo.title.replace(/[^\w\s-]/gi, "");
    const fileName = `${sanitizedTitle || "video"}.mp4`;

    res.header(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.header("X-Content-Type-Options", "nosniff");

    const download = youtubedl.exec(url, {
      output: "-",
      format: "best",
    });

    download.stdout.pipe(res);

    download.on("error", (err) => {
      console.error("Error in youtube-dl stream:", err);
      if (!res.headersSent) {
        res.status(500).send("Error downloading video");
      }
    });
  } catch (error) {
    console.error("Error in download route:", error);
    res.status(500).send("An error occurred");
  }
});

// Audio route
app.get("/audio", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || !isValidYoutubeUrl(url)) {
      return res.status(400).send("Invalid or missing YouTube URL");
    }

    console.log("Attempting to download audio:", url);

    const videoInfo = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
    });

    if (!videoInfo || !videoInfo.title) {
      throw new Error("Failed to retrieve video title");
    }

    const sanitizedTitle = videoInfo.title.replace(/[^\w\s-]/gi, "");
    const fileName = `${sanitizedTitle || "audio"}.mp3`;

    res.header(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.header("X-Content-Type-Options", "nosniff");

    const download = youtubedl.exec(url, {
      output: "-",
      extractAudio: true,
      audioFormat: "mp3",
      audioQuality: 0,
    });

    download.stdout.pipe(res);

    download.on("error", (err) => {
      console.error("Error in youtube-dl stream:", err);
      if (!res.headersSent) {
        res.status(500).send("Error downloading audio");
      }
    });
  } catch (error) {
    console.error("Error in download-audio route:", error);
    res.status(500).send("An error occurred");
  }
});

app.get("/thumbnail", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || !isValidYoutubeUrl(url)) {
      return res.status(400).send("Invalid or missing YouTube URL");
    }

    console.log("Attempting to download thumbnail:", url);

    const videoInfo = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      skipDownload: true,
    });

    if (!videoInfo || !videoInfo.thumbnail) {
      throw new Error("Failed to retrieve thumbnail URL");
    }

    const thumbnailUrl = videoInfo.thumbnail;
    const thumbnailResponse = await axios.get(thumbnailUrl, {
      responseType: "arraybuffer",
    });

    const contentType = thumbnailResponse.headers["content-type"];
    const extension = contentType.split("/")[1];
    const sanitizedTitle = (videoInfo.title || "thumbnail").replace(
      /[^\w\s-]/gi,
      ""
    );
    const fileName = `${sanitizedTitle}.${extension}`;

    res.header(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.header("Content-Type", contentType);
    res.header("X-Content-Type-Options", "nosniff");

    res.send(thumbnailResponse.data);
  } catch (error) {
    console.error("Error in thumbnail route:", error);
    res.status(500).send("An error occurred");
  }
});

app.listen(port, () => {
  console.log(`YouTube downloader API listening at http://localhost:${port}`);
});
