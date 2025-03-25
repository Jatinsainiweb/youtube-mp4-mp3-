require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3003;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Enable CORS with specific origin
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API route to get all pages
app.get('/api/pages', async (req, res) => {
  try {
    const contentDir = path.join(__dirname, '..', 'content');
    const files = await fs.readdir(contentDir);
    const pages = files
      .filter(file => file.endsWith('.html'))
      .map(file => ({
        name: file.replace('.html', '').split('-').join(' '),
        path: file
      }));
    res.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// Contact form submission
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  // TODO: Implement email sending or database storage
  console.log('Contact form submission:', { name, email, message });
  res.json({ success: true, message: 'Message received' });
});

// FAQs endpoint
app.get('/api/faqs', (req, res) => {
  const faqs = [
    {
      question: "Is converting YouTube to MP4 legal?",
      answer: "Yes, for personal use. However, distributing copyrighted content is illegal."
    },
    {
      question: "Can I download age-restricted videos?",
      answer: "Yes, if you're logged into a YouTube account verifying your age."
    },
    {
      question: "Does this work on iPhones?",
      answer: "Absolutely! Use Safari, Chrome, or Firefox on iOS."
    },
    {
      question: "Are there download limits?",
      answer: "No—enjoy unlimited conversions daily."
    },
    {
      question: "Can I convert live streams to MP4?",
      answer: "No—only pre-recorded videos are supported."
    },
    {
      question: "Is the tool free?",
      answer: "Yes! Free conversions with no hidden fees."
    },
    {
      question: "What video formats are supported?",
      answer: "MP4, MKV, AVI, and MOV."
    },
    {
      question: "Can I download 4K videos?",
      answer: "Yes—select '4K' in the quality menu."
    },
    {
      question: "How to ensure the best video quality?",
      answer: "Choose the highest resolution available (e.g., 4K or 1080p)."
    },
    {
      question: "Do you support non-English videos?",
      answer: "Yes—works with all languages and regions."
    }
  ];
  res.json(faqs);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origin: ${CORS_ORIGIN}`);
});
