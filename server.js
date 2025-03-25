require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// Validate YouTube URL
const isValidYouTubeUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return pattern.test(url);
};

// Routes
app.get('/api/info', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        res.json({
            title: info.videoDetails.title,
            formats: info.formats.map(format => ({
                quality: format.qualityLabel,
                mimeType: format.mimeType,
                itag: format.itag
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/download/mp3', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp3"`);
        ytdl(url, {
            format: 'audioonly',
            quality: 'highestaudio'
        }).pipe(res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/download/mp4', async (req, res) => {
    try {
        const { url, quality } = req.query;
        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp4"`);
        ytdl(url, {
            format: 'mp4',
            quality: quality || 'highest'
        }).pipe(res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
