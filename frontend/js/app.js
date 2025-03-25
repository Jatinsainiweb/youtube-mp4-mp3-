document.addEventListener('DOMContentLoaded', () => {
    const videoUrlInput = document.getElementById('videoUrl');
    const downloadBtn = document.getElementById('downloadBtn');
    const formatBtns = document.querySelectorAll('.format-btn');
    const statusDiv = document.getElementById('status');

    // API endpoint (change this to your Render backend URL when deployed)
    const API_BASE_URL = 'http://localhost:3000/api';

    let selectedFormat = 'mp3'; // Default format

    // Format button click handlers
    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            formatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedFormat = btn.dataset.format;
        });
    });

    // Helper function to validate YouTube URL
    const isValidYouTubeUrl = (url) => {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return pattern.test(url);
    };

    // Helper function to show status message
    const showStatus = (message, type = 'error') => {
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';
    };

    // Download button click handler
    downloadBtn.addEventListener('click', async () => {
        const url = videoUrlInput.value.trim();

        if (!url) {
            showStatus('Please enter a YouTube URL');
            return;
        }

        if (!isValidYouTubeUrl(url)) {
            showStatus('Please enter a valid YouTube URL');
            return;
        }

        try {
            showStatus('Processing your request...', 'success');
            downloadBtn.disabled = true;

            // First get video info
            const infoResponse = await fetch(`${API_BASE_URL}/info?url=${encodeURIComponent(url)}`);
            const info = await infoResponse.json();

            if (info.error) {
                throw new Error(info.error);
            }

            // Create download link
            const downloadUrl = `${API_BASE_URL}/download/${selectedFormat}?url=${encodeURIComponent(url)}`;
            
            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${info.title}.${selectedFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showStatus('Download started!', 'success');
        } catch (error) {
            showStatus(error.message || 'An error occurred while processing your request');
        } finally {
            downloadBtn.disabled = false;
        }
    });

    // Input validation on paste/change
    videoUrlInput.addEventListener('input', () => {
        const url = videoUrlInput.value.trim();
        if (url && !isValidYouTubeUrl(url)) {
            showStatus('Please enter a valid YouTube URL');
        } else {
            statusDiv.style.display = 'none';
        }
    });
});
