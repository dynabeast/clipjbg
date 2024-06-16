// const express = require("express");
// const app = express();
// app.get("/", (req, res) => { res.send("Express on Vercel"); });

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });

const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
function sanitizeFilename(filename)
{
    // Remove any invalid characters from the filename
    return filename.replace(/[^\w\.\-\(\)]/g, '_');
}
// Use CORS middleware
app.use(cors());

// Define CDN URL for Swagger UI CSS
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.3.0/swagger-ui.min.css";

// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Express API",
            version: "1.0.0",
            description: "Express API Information",
            contact: {
                name: "Developer",
            },
            servers: [{ url: "http://localhost:8080" }],
        },
    },
    // ['.routes/*.js']
    apis: ["index.js"], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// Serve Swagger UI with custom CSS URL
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs, {
        customCss:
            '.swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }',
        customCssUrl: CSS_URL,
    }),
);

/**
 * @swagger
 * /video:
 *   get:
 *     summary: Download a video
 *     description: Downloads a video from a provided URL
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: The URL of the video to download
 *     responses:
 *       200:
 *         description: Video downloaded successfully
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Video URL is required
 *       500:
 *         description: Error downloading the video
 */




/**
 * @swagger
 * /audio:
 *   get:
 *     summary: Download a Audio from a Video
 *     description: Downloads a Audio from a provided video URL
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: The URL of the video to  download audio from
 *     responses:
 *       200:
 *         description: Audio downloaded successfully
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Video URL is required
 *       500:
 *         description: Error downloading the video
 */

/**
 * @swagger
 * /video-details:
 *   get:
 *     summary: Fetch video details
 *     description: Fetch video details from a provided YouTube URL.
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: YouTube video URL
 *     responses:
 *       200:
 *         description: A successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 lengthSeconds:
 *                   type: integer
 *                 viewCount:
 *                   type: integer
 *                 author:
 *                   type: string
 *                 uploadDate:
 *                   type: string
 *                   format: date
 *                 thumbnails:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       width:
 *                         type: integer
 *                       height:
 *                         type: integer
 *       400:
 *         description: URL is required
 *       500:
 *         description: Failed to fetch video details
 */

/**
 * @swagger
 * /video-url:
 *   get:
 *     summary: Fetch video download URL
 *     description: Fetch the download URL of the highest quality format from a provided YouTube URL.
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: YouTube video URL
 *     responses:
 *       200:
 *         description: A successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 downloadUrl:
 *                   type: string
 *       400:
 *         description: URL is required
 *       500:
 *         description: Failed to fetch download URL
 */
app.get("/", (req, res) => { res.send("Hello on express-vidbinary"); });
app.get('/video', async (req, res) =>
{
    const videoUrl = req.query.url; // Get the video URL from the query parameter

    if (!videoUrl)
    {
        return res.status(400).send('Video URL is required');
    }

    try
    {
        // Get the video info
        const info = await ytdl.getInfo(videoUrl);
        const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest' });
        // Sanitize the filename
        const filename = sanitizeFilename(info.videoDetails.title);
        const sanitizedFilename = `${filename}.${videoFormat.container}`;


        // Set the Content-Disposition header with the sanitized filename
        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
        res.setHeader('Content-Type', `video/${videoFormat.container}`);

        ytdl(videoUrl, { format: videoFormat }).pipe(res);
        // Set the response headers
        // res.setHeader('Content-Disposition', `attachment; filename="${info.videoDetails.title}.${videoFormat.container}"`);
        // res.setHeader('Content-Type', `video/${videoFormat.container}`);

        // // Stream the video
        // ytdl(videoUrl, { format: videoFormat }).pipe(res);
    } catch (err)
    {
        console.error(err);
        res.status(500).send('Error downloading the video');
    }
});

app.get('/audio', async (req, res) =>
{
    const videoUrl = req.query.url;
    if (!videoUrl)
    {
        return res.status(400).send('Video URL is required');
    }

    try
    {
        const info = await ytdl.getInfo(videoUrl);
        const audioFormat = ytdl.filterFormats(info.formats, 'audioonly');
        const audioStream = ytdl(videoUrl, { format: audioFormat[0] });

        const encodedFileName = encodeURIComponent(info.videoDetails.title) + '.mp3';
        res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        const ffmpegProcess = ffmpeg({ source: audioStream })
            .audioBitrate(128)
            .audioChannels(2)
            .toFormat('mp3')
            .pipe(res, { end: true });

        ffmpegProcess.on('error', (err) =>
        {
            console.error('ffmpeg error:', err);
            res.status(500).send('Error converting video to MP3');
        });
    } catch (err)
    {
        console.error('Error downloading video:', err);
        res.status(500).send('Error downloading video');
    }
});

app.get('/video-details', async (req, res) =>
{
    const videoUrl = req.query.url;

    if (!videoUrl)
    {
        return res.status(400).json({ error: 'URL is required' });
    }

    try
    {
        const videoId = ytdl.getURLVideoID(videoUrl);
        const videoInfo = await ytdl.getInfo(videoId);

        const details = {
            title: videoInfo.videoDetails.title,
            description: videoInfo.videoDetails.description,
            lengthSeconds: videoInfo.videoDetails.lengthSeconds,
            viewCount: videoInfo.videoDetails.viewCount,
            author: videoInfo.videoDetails.author,
            uploadDate: videoInfo.videoDetails.uploadDate,
            thumbnails: videoInfo.videoDetails.thumbnails,
        };

        res.json(details);
    } catch (error)
    {
        console.error('Error fetching video details:', error);
        res.status(500).json({ error: 'Failed to fetch video details' });
    }
});
app.get('/video-url', async (req, res) =>
{
    const videoUrl = req.query.url;

    if (!videoUrl)
    {
        return res.status(400).json({ error: 'URL is required' });
    }

    try
    {
        const videoId = ytdl.getURLVideoID(videoUrl);
        const videoInfo = await ytdl.getInfo(videoId);
        const format = ytdl.chooseFormat(videoInfo.formats, { quality: 'highest' });

        res.json({ downloadUrl: format.url });
    } catch (error)
    {
        console.error('Error fetching download URL:', error);
        res.status(500).json({ error: 'Failed to fetch download URL' });
    }
});
// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
{
    console.log(`Server is running on port ${PORT}`);
});


// app.get('/', async (req, res) =>
// {
//     const url = req.query.url;
//     console.log(url)
//     const info = await ytdl.getInfo(url)
//     const VideoFormats = ytdl.filterFormats(info.formats, 'video')
//     const format = ytdl.chooseFormat(VideoFormats, { quality: "highestaudio" })

//     const fileName = `${info.videoDetails.title}.${format.container}`

//     const responseHeaders = { 'content-Disposition': `attachment; filename = ${fileName}` }
//     res.json({ format, responseHeaders, fileName });

// });