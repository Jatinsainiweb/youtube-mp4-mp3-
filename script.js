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
      // API endpoint for conversion requests
      apiUrl: 'https://youtube-converter-backend-git-main-jatin-sainis-projects.vercel.app/api/download',
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
   * Show error message to the user
   * @param {string} message - Error message to display
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Remove any existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Insert error message after the URL input
    const urlInput = document.querySelector('.url-input');
    urlInput.parentNode.insertBefore(errorDiv, urlInput.nextSibling);
    
    // Remove error message after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
  }

  /**
   * Show success message to the user
   * @param {string} message - Success message to display
   */
  showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Remove any existing success messages
    document.querySelectorAll('.success-message').forEach(el => el.remove());
    
    // Insert success message after the URL input
    const urlInput = document.querySelector('.url-input');
    urlInput.parentNode.insertBefore(successDiv, urlInput.nextSibling);
    
    // Remove success message after 5 seconds
    setTimeout(() => successDiv.remove(), 5000);
  }

  /**
   * Handle the conversion request for a specific format
   * @param {string} format - 'mp3' or 'mp4'
   * @param {HTMLElement} buttonElement - The button that triggered the conversion
   */
  async handleConversion(format, buttonElement) {
    const urlInput = document.querySelector('.url-input');
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
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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
      
      if (data.success && data.downloadLink) {
        // Create download link
        this.createDownloadLink({
          url: data.downloadLink,
          format: format,
          title: data.title
        });
        
        this.showSuccessMessage(`Your ${format.toUpperCase()} is ready for download!`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      // Reset button state
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
    
    // File not found errors
    if (errorMessage.includes('File not found')) {
      return 'The download file could not be found. Please try converting again.';
    }
    
    // yt-dlp related errors
    if (errorMessage.includes('Download service') || errorMessage.includes('temporarily unavailable')) {
      return 'Our download service is temporarily unavailable. Please try again later or contact support if the issue persists.';
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
    downloadLink.href = data.url;
    downloadLink.className = 'download-link';
    downloadLink.target = '_blank';
    downloadLink.rel = 'noopener noreferrer';
    
    // Add icon based on format
    const icon = data.format === 'mp3' ? '🎵' : '🎥';
    downloadLink.innerHTML = `${icon} Download ${data.title || 'Video'} (${data.format.toUpperCase()})`;
    
    // Add the new link at the top
    downloadContainer.insertBefore(downloadLink, downloadContainer.firstChild);
    
    // Remove oldest link if we exceed the maximum
    while (downloadContainer.children.length > this.config.maxDownloadHistory) {
      downloadContainer.removeChild(downloadContainer.lastChild);
    }
  }

  /**
   * Create container for download history if it doesn't exist
   * @returns {HTMLElement} - Download history container
   */
  createDownloadHistoryContainer() {
    const container = document.createElement('div');
    container.className = 'download-history';
    
    // Insert after the format buttons
    const formatButtons = document.querySelector('.format-buttons');
    formatButtons.parentNode.insertBefore(container, formatButtons.nextSibling);
    
    return container;
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  }
}

/**
 * Initialize the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the converter
  const converter = new YoutubeConverter();
  
  // Check and apply dark mode preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
});