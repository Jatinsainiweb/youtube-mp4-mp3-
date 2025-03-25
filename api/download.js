import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import youtubeDl from 'youtube-dl-exec';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { url, format } = req.body;
  console.log('Received request:', { url, format });

  if (!url || !format) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  try {
    // Get video info first
    const info = await youtubeDl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true
    });

    // Generate a unique filename
    const fileId = uuidv4().substring(0, 8);
    const safeTitle = info.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}-${fileId}.${format}`;
    const outputPath = path.join('/tmp', filename);

    // Configure download options
    const options = {
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      output: outputPath
    };

    if (format === 'mp3') {
      options.extractAudio = true;
      options.audioFormat = 'mp3';
      options.audioQuality = 0;
    } else {
      options.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
    }

    // Download the video
    await youtubeDl(url, options);

    // Generate download link
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const downloadLink = `${baseUrl}/api/download-file/${filename}`;

    res.status(200).json({
      success: true,
      downloadLink,
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      format
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Failed to process video',
      details: error.message
    });
  }
}