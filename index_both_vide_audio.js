// in this download is used to downlaod audio is properly but  not video properly
//https://claude.ai/chat/07e4ac02-7354-4441-b490-f59d25647bc1 
// work on above url
const express = require('express');
const youtubedl = require('youtube-dl-exec');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();
const port = 3000;

// Use Helmet for security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Parse JSON bodies
app.use(express.json());

// Function to generate a random user agent
function getRandomUserAgent()
{
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function getVideoInfo(url)
{
    const videoInfo = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [`User-Agent:${getRandomUserAgent()}`]
    });

    if (!videoInfo || !videoInfo.title)
    {
        throw new Error('Failed to retrieve video information');
    }

    return videoInfo;
}

function sanitizeFilename(title)
{
    return title.replace(/[^\w\s-]/gi, '').substring(0, 200);
}

function handleDownload(res, url, options)
{
    const download = youtubedl.exec(url, {
        ...options,
        addHeader: [`User-Agent:${getRandomUserAgent()}`]
    });

    download.stdout.pipe(res);

    download.on('error', (err) =>
    {
        console.error('Error in youtube-dl stream:', err);
        if (!res.headersSent)
        {
            res.status(500).send(`Error downloading: ${err.message}`);
        }
    });
}

// Middleware to validate YouTube URL
function validateYouTubeUrl(req, res, next)
{
    const url = req.query.url;
    if (!url)
    {
        return res.status(400).send('URL parameter is required');
    }
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(url))
    {
        return res.status(400).send('Invalid YouTube URL');
    }
    next();
}

// Routes
app.get('/download/:type', validateYouTubeUrl, async (req, res) =>
{
    try
    {
        const url = req.query.url;
        const type = req.params.type;

        console.log(`Attempting to download ${type}:`, url);

        const videoInfo = await getVideoInfo(url);
        let fileName, downloadOptions;

        switch (type)
        {
            case 'audio':
                fileName = `${sanitizeFilename(videoInfo.title)}.mp3`;
                downloadOptions = {
                    output: '-',
                    extractAudio: true,
                    audioFormat: 'mp3',
                    format: 'bestaudio'
                };
                break;
            case 'video':
                fileName = `${sanitizeFilename(videoInfo.title)}_video_only.mp4`;
                downloadOptions = {
                    output: '-',
                    format: 'bestvideo[ext=mp4]/best[ext=mp4]/best',
                    noCheckCertificates: true,
                    noWarnings: true,
                    preferFreeFormats: true
                };
                break;
            case 'both':
                fileName = `${sanitizeFilename(videoInfo.title)}.mp4`;
                downloadOptions = {
                    output: '-',
                    format: 'bestvideo+bestaudio/best',
                    mergeOutputFormat: 'mp4'
                };
                break;
            default:
                return res.status(400).send('Invalid download type');
        }

        res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        handleDownload(res, url, downloadOptions);

    } catch (error)
    {
        console.error(`Error in ${req.params.type} download route:`, error);
        res.status(500).send(`An error occurred: ${error.message}`);
    }
});

// Start server
app.listen(port, () =>
{
    console.log(`YouTube downloader API listening at http://localhost:${port}`);
});