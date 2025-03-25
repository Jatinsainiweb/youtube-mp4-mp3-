import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get the filename from the URL path
    const filename = req.url.split('/').pop().split('?')[0];
    
    if (!filename) {
      return res.status(400).json({ error: 'No filename provided' });
    }

    // In Vercel, we use /tmp for temporary storage
    const filePath = path.join('/tmp', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found',
        details: 'The requested file may have expired. Please try downloading again.'
      });
    }
    
    // Get file information
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Set appropriate headers for file download
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Handle errors during streaming
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error streaming file',
          details: error.message
        });
      }
    });

    // Clean up file after streaming is complete
    fileStream.on('end', () => {
      try {
        fs.unlinkSync(filePath);
        console.log(`File ${filename} successfully streamed and deleted`);
      } catch (error) {
        console.error('Error cleaning up file:', error);
      }
    });

  } catch (error) {
    console.error('Error handling download:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to process download',
        details: error.message
      });
    }
  }
}