const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const { exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

// Check if running in Vercel environment
const isVercel = process.env.VERCEL === '1';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// For Vercel, we need to export the app as a module
const handler = isVercel ? app : null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from the downloads directory
// In Vercel, we'll use /tmp for temporary storage
const downloadsDir = isVercel ? '/tmp' : path.join(__dirname, 'downloads');

// Create downloads directory if it doesn't exist and not in Vercel
if (!isVercel && !fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

app.use('/downloads', express.static(downloadsDir));

// Serve static files from the current directory (for the frontend)
app.use(express.static(__dirname));

// Validate YouTube URL
function isValidYouTubeUrl(url) {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
  return pattern.test(url);
}

// Configure file cleanup settings
const FILE_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const FILE_MAX_AGE = 2 * 24 * 60 * 60 * 1000; // 2 days

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

// Function to clean up old files
function cleanupOldFiles() {
  try {
    console.log('Running file cleanup task...');
    const now = Date.now();
    const files = fs.readdirSync(downloadsDir);
    
    let deletedCount = 0;
    for (const file of files) {
      const filePath = path.join(downloadsDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;
      
      if (fileAge > FILE_MAX_AGE) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Deleted old file: ${file} (age: ${Math.round(fileAge / (1000 * 60 * 60))} hours)`);
      }
    }
    
    console.log(`Cleanup completed: ${deletedCount} files deleted`);
  } catch (error) {
    console.error('Error during file cleanup:', error);
  }
}

// Schedule periodic cleanup
setInterval(cleanupOldFiles, FILE_CLEANUP_INTERVAL);
// Run cleanup on startup
cleanupOldFiles();

// Download endpoint
app.post('/download', async (req, res) => {
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
      const fileSize = fs.statSync(path.join(downloadsDir, filename)).size;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

      // Return the download link
      const downloadLink = `${req.protocol}://${req.get('host')}/downloads/${filename}`;
      
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[${requestId}] Success: ${format} conversion completed in ${processingTime}s, file size: ${fileSizeMB}MB`);
      
      res.json({ 
        success: true, 
        format,
        downloadLink,
        fileSize: `${fileSizeMB} MB`,
        processingTime: `${processingTime} seconds`
      });
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
      
      res.status(500).json({ error: userMessage });
    }
  } catch (error) {
    console.error(`[${requestId}] Server error:`, error);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  }
});

// Start the server if not in Vercel environment
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;