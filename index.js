// const express = require("express");
// const app = express();
// app.get("/", (req, res) => { res.send("Express on Vercel"); });

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });

const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// const ffmpeg = require('fluent-ffmpeg');
// ffmpeg.setFfmpegPath(ffmpegPath);
function sanitizeFilename(filename)
{
    // Remove any invalid characters from the filename
    return filename.replace(/[^\w\.\-\(\)]/g, '_');
}
// Use CORS middleware
app.use(cors());


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
app.get("/", (req, res) => { res.send("Express on Vercel"); });
app.get('/download', async (req, res) =>
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

// app.get('/audio', async (req, res) =>
// {
//     const videoUrl = req.query.url;
//     if (!videoUrl)
//     {
//         return res.status(400).send('Video URL is required');
//     }

//     try
//     {
//         const info = await ytdl.getInfo(videoUrl);
//         const audioFormat = ytdl.filterFormats(info.formats, 'audioonly');
//         const audioStream = ytdl(videoUrl, { format: audioFormat[0] });

//         const encodedFileName = encodeURIComponent(info.videoDetails.title) + '.mp3';
//         res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"`);
//         res.setHeader('Content-Type', 'audio/mpeg');

//         const ffmpegProcess = ffmpeg({ source: audioStream })
//             .audioBitrate(128)
//             .audioChannels(2)
//             .toFormat('mp3')
//             .pipe(res, { end: true });

//         ffmpegProcess.on('error', (err) =>
//         {
//             console.error('ffmpeg error:', err);
//             res.status(500).send('Error converting video to MP3');
//         });
//     } catch (err)
//     {
//         console.error('Error downloading video:', err);
//         res.status(500).send('Error downloading video');
//     }
// });
// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
{
    console.log(`Server is running on port ${PORT}`);
});
