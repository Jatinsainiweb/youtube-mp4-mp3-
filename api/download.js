const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

// Validate YouTube URL
function isValidYouTubeUrl(url) {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
  return pattern.test(url);
}

// Function to build yt-dlp command
function buildYtDlpCommand(url, format, outputPath) {
  let command = `yt-dlp --no-check-certificate --no-warnings --prefer-free-formats -o "${outputPath}" `;
  
  if (format === 'mp3') {
    command += '--extract-audio --audio-format mp3 --audio-quality 0 ';
  } else { // mp4
    command += '-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" ';
  }
  
  command += `"${url}"`;
  return command;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const requestId = uuidv4().substring(0, 8);
  console.log(`[${requestId}] New download request received`);
  
  try {
    const { url, format } = req.body;

    // Enhanced input validation
    if (!url || typeof url !== 'string') {
      console.log(`[${requestId}] Invalid request: Missing or invalid URL`);
      return res.status(400).json({ error: 'A valid YouTube URL is required' });
    }

    if (!format || (format !== 'mp3' && format !== 'mp4')) {
      console.log(`[${requestId}] Invalid request: Invalid format '${format}'`);
      return res.status(400).json({ error: 'Format must be mp3 or mp4' });
    }

    if (!isValidYouTubeUrl(url)) {
      console.log(`[${requestId}] Invalid request: Invalid YouTube URL format`);
      return res.status(400).json({ error: 'Please enter a valid YouTube URL' });
    }

    // In Vercel, we use /tmp for temporary storage
    const downloadsDir = '/tmp';
    
    // Generate a unique filename
    const fileId = uuidv4();
    const outputPath = path.join(downloadsDir, `${fileId}.%(ext)s`);
    
    console.log(`[${requestId}] Processing ${format} download for: ${url}`);
    
    try {
      // Build and execute yt-dlp command
      const command = buildYtDlpCommand(url, format, outputPath);
      console.log(`[${requestId}] Executing command: ${command}`);
      
      await execPromise(command);
      console.log(`[${requestId}] Download completed successfully`);
      
      // Find the downloaded file in the downloads directory
      const files = fs.readdirSync(downloadsDir);
      const matchingFile = files.find(file => file.startsWith(fileId));
      
      if (!matchingFile) {
        console.error(`[${requestId}] Error: Could not find output file`);
        return res.status(500).json({ error: 'Could not process your download. Please try again.' });
      }
      
      const filename = matchingFile;
      const filePath = path.join(downloadsDir, filename);
      const fileSize = fs.statSync(filePath).size;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

      // For Vercel, we need to create a downloadable URL
      // We'll use the Vercel serverless function URL pattern
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[${requestId}] Success: ${format} conversion completed in ${processingTime}s, file size: ${fileSizeMB}MB`);
      
      // Create a download URL that points to this file
      // In Vercel, we can use the /api/download/${filename} pattern
      // Make sure to use the correct path format for the API endpoint
      const downloadLink = `/api/download/${filename}`;
      
      // Return JSON response with download link and metadata
      return res.status(200).json({
        success: true,
        format,
        downloadLink,
        fileSize: `${fileSizeMB} MB`,
        processingTime: `${processingTime} seconds`
      });
      
      // Note: We'll need to create a separate API endpoint to handle the actual file download
    } catch (error) {
      console.error(`[${requestId}] Download error:`, error.message);
      
      // Provide user-friendly error messages based on error type
      let userMessage = 'Failed to process your download. Please try again later.';
      
      if (error.message.includes('unavailable') || error.message.includes('private')) {
        userMessage = 'This video is unavailable or private. Please try another video.';
      } else if (error.message.includes('copyright')) {
        userMessage = 'This video cannot be downloaded due to copyright restrictions.';
      } else if (error.message.includes('age')) {
        userMessage = 'Age-restricted videos cannot be downloaded.';
      } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
        userMessage = 'Video not found. Please check the URL and try again.';
      }
      
      return res.status(500).json({ error: userMessage });
    }
  } catch (error) {
    console.error(`[${requestId}] Server error:`, error);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  }
};