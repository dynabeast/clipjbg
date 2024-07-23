// in this download is used to downlaod video properly
const express = require('express');
const youtubedl = require('youtube-dl-exec');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/download', async (req, res) =>
{
    try
    {
        const url = req.query.url;
        if (!url)
        {
            return res.status(400).send('URL parameter is required');
        }

        console.log('Attempting to download:', url);

        // First, get the video info
        const videoInfo = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
        });

        console.log('Video info retrieved:', videoInfo);

        if (!videoInfo || !videoInfo.title)
        {
            throw new Error('Failed to retrieve video title');
        }

        const sanitizedTitle = videoInfo.title.replace(/[^\w\s-]/gi, '');
        const fileName = `${sanitizedTitle || 'video'}.mp4`;

        console.log('Filename:', fileName);

        res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

        // Now, download the video
        const download = youtubedl.exec(url, {
            output: '-',
            format: 'best',
        });

        download.stdout.pipe(res);

        download.on('error', (err) =>
        {
            console.error('Error in youtube-dl stream:', err);
            if (!res.headersSent)
            {
                res.status(500).send(`Error downloading video: ${err.message}`);
            }
        });

    } catch (error)
    {
        console.error('Error in download route:', error);
        res.status(500).send(`An error occurred: ${error.message}`);
    }
});

app.listen(port, () =>
{
    console.log(`YouTube downloader API listening at http://localhost:${port}`);
});