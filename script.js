/**
 * YouTube Converter Application
 * Handles conversion of YouTube videos to MP3/MP4 formats
 * Features enhanced URL validation, error handling, and UI improvements
 */
class YoutubeConverter {
  /**
   * Initialize the converter application
   */
  constructor() {
    // Configuration settings
    this.config = {
      // API endpoint for conversion requests - dynamically determine if we're in production or development
      apiUrl: window.location.hostname === 'localhost' ? '/download' : '/api/download',
      // Maximum number of download links to display
      maxDownloadHistory: 5,
      // Active conversion requests tracking
      activeRequests: new Map()
    };
    
    this.initEventListeners();
  }

  /**
   * Set up event listeners for user interactions
   */
  initEventListeners() {
    // Global click event delegation
    document.addEventListener('click', (e) => {
      if (e.target.closest('.dark-mode-toggle')) this.toggleDarkMode();
      if (e.target.closest('.mp3-btn')) this.handleConversion('mp3', e.target.closest('.mp3-btn'));
      if (e.target.closest('.mp4-btn')) this.handleConversion('mp4', e.target.closest('.mp4-btn'));
    });

    // URL input validation
    document.querySelectorAll('.url-input').forEach(input => {
      input.addEventListener('input', this.validateYouTubeUrl.bind(this));
    });
  }

  /**
   * Validate YouTube URL format
   * @param {Event} e - Input event
   * @returns {boolean} - Whether URL is valid
   */
  validateYouTubeUrl(e) {
    // Enhanced URL validation pattern
    // Matches standard YouTube URLs, short URLs, and includes video ID validation
    const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}(?:[\&\?].*)?$/;
    const isValid = urlPattern.test(e.target.value);
    
    // Visual feedback for validation
    e.target.style.borderColor = isValid ? '#2ecc71' : '#e74c3c';
    
    return isValid;
  }

  /**
   * Handle the conversion request for a specific format
   * @param {string} format - 'mp3' or 'mp4'
   * @param {HTMLElement} buttonElement - The button that triggered the conversion
   */
  async handleConversion(format, buttonElement) {
    const urlInput = document.querySelector('.url-input');
    const quality = document.querySelector('.quality-select')?.value || 'high';
    const requestId = Date.now().toString();
    
    // Validate URL before proceeding
    if (!this.validateYouTubeUrl({ target: urlInput })) {
      this.showError('Please enter a valid YouTube URL');
      return;
    }

    // Set button to loading state
    this.setButtonLoadingState(buttonElement, true, requestId);
    
    try {
      // Make API call to our backend
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: urlInput.value,
          format: format
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to convert video to ${format}`);
      }
      
      // Reset button state
      this.setButtonLoadingState(buttonElement, false, requestId);
      
      // Create download link with enhanced information
      this.createDownloadLink({
        url: data.downloadLink,
        format: format,
        fileSize: data.fileSize,
        processingTime: data.processingTime
      });
      
      this.showSuccessMessage(`Your ${format.toUpperCase()} is ready for download! (${data.fileSize})`);
    } catch (error) {
      // Handle specific error types
      this.setButtonLoadingState(buttonElement, false, requestId);
      
      // Provide user-friendly error message
      const errorMessage = this.getReadableErrorMessage(error.message, format);
      this.showError(errorMessage);
      
      // Log error for debugging
      console.error(`Conversion error (${format}):`, error);
    }
  }

  /**
   * Convert technical error messages to user-friendly messages
   * @param {string} errorMessage - Original error message
   * @param {string} format - The format being converted to
   * @returns {string} - User-friendly error message
   */
  getReadableErrorMessage(errorMessage, format) {
    // Network-related errors
    if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
      return 'Network error: Please check your internet connection and try again. If the problem persists, the server might be temporarily unavailable.';
    }
    
    // Server-related errors
    if (errorMessage.includes('Server error') || errorMessage.includes('500')) {
      return 'Our servers are currently busy. Please try again in a few minutes.';
    }
    
    // Return the original message if no specific handling is needed
    return errorMessage || `Failed to convert video to ${format}. Please try again.`;
  }

  /**
   * Set loading state for a specific button
   * @param {HTMLElement} button - Button element
   * @param {boolean} isLoading - Whether button should show loading state
   * @param {string} requestId - Unique ID for this request
   */
  setButtonLoadingState(button, isLoading, requestId) {
    if (isLoading) {
      // Store original button text
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.innerHTML;
      }
      
      // Set loading state
      button.disabled = true;
      button.innerHTML = '<div class="loader"></div> Processing...';
      
      // Track this request
      this.config.activeRequests.set(requestId, { button, format: button.classList.contains('mp3-btn') ? 'mp3' : 'mp4' });
    } else {
      // Restore button to original state
      button.disabled = false;
      button.innerHTML = button.dataset.originalText;
      
      // Remove from active requests
      this.config.activeRequests.delete(requestId);
    }
  }

  /**
   * Create and append a download link to the page
   * @param {Object} data - Download information
   */
  createDownloadLink(data) {
    const downloadContainer = document.querySelector('.download-history') || this.createDownloadHistoryContainer();
    
    // Create download link element
    const downloadLink = document.createElement('a');
    // Ensure the download link is properly formatted with absolute URL if needed
    let downloadUrl = data.downloadLink || data.url;
    // If the URL is relative and we're not on localhost, make sure it has the correct base URL
    if (downloadUrl.startsWith('/')) {
      // Always use the current origin for relative URLs to ensure they work in all environments
      downloadUrl = `${window.location.origin}${downloadUrl}`;
    }
    downloadLink.href = downloadUrl;
    downloadLink.className = 'download-link';
    downloadLink.download = '';
    
    // Add detailed information to the download link
    downloadLink.innerHTML = `
      <span class="btn-content">
        ⬇️ Download ${data.format.toUpperCase()}
        ${data.fileSize ? `<span class="file-size">(${data.fileSize})</span>` : ''}
      </span>
    `;
    
    // Add to download history (prepend to show newest first)
    downloadContainer.prepend(downloadLink);
    
    // Limit the number of download links
    const links = downloadContainer.querySelectorAll('.download-link');
    if (links.length > this.config.maxDownloadHistory) {
      for (let i = this.config.maxDownloadHistory; i < links.length; i++) {
        links[i].remove();
      }
    }
  }

  /**
   * Create a container for download history if it doesn't exist
   * @returns {HTMLElement} - The download history container
   */
  createDownloadHistoryContainer() {
    const ctaContainer = document.querySelector('.cta-container');
    
    // Create download history section
    const downloadHistory = document.createElement('div');
    downloadHistory.className = 'download-history';
    downloadHistory.innerHTML = '<h3>Download History</h3>';
    
    // Add to page
    ctaContainer.appendChild(downloadHistory);
    
    return downloadHistory;
  }

  /**
   * Display an error message to the user
   * @param {string} message - Error message to display
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.cta-container').prepend(errorDiv);
    
    // Auto-remove after delay
    setTimeout(() => errorDiv.remove(), 5000);
  }

  /**
   * Display a success message to the user
   * @param {string} message - Success message to display
   */
  showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.querySelector('.cta-container').prepend(successDiv);
    
    // Auto-remove after delay
    setTimeout(() => successDiv.remove(), 5000);
  }

  /**
   * Toggle dark mode and save preference
   */
  toggleDarkMode() {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
  }

  /**
   * Initialize dark mode from saved preference
   */
  initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark', isDark);
  }
}

/**
 * Initialize the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // Create and initialize the converter
  const converter = new YoutubeConverter();
  converter.initDarkMode();
  
  // Store original button text for restoration after loading
  document.querySelectorAll('.btn').forEach(btn => {
    btn.dataset.originalText = btn.innerHTML;
  });
  
  // Add CSS for download history container
  const style = document.createElement('style');
  style.textContent = `
    .download-history {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      width: 100%;
      max-width: 600px;
    }
    
    .download-history h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 1.2rem;
      color: var(--primary-color);
    }
    
    .download-link {
      margin: 8px 0;
      display: block;
    }
    
    .file-size {
      font-size: 0.8rem;
      opacity: 0.8;
      margin-left: 5px;
    }
    
    body.dark .download-history {
      background: rgba(30, 41, 59, 0.8);
    }
    
    body.dark .download-history h3 {
      color: #e2e8f0;
    }
  `;
  document.head.appendChild(style);
});