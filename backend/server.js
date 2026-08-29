const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // In production, you'll restrict this to your Netlify URL
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.warn("WARNING: MONGODB_URI is not defined in the environment variables.");
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

// Health Check Route (Used by Render to verify deployment)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running smoothly' });
});

// Models
const Project = require('./models/Project');

// Simple Auth Middleware (MVP)
// In production, you would verify a Firebase ID token here
const requireAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. User ID is missing.' });
  }
  req.userId = userId;
  next();
};

// --- Project Routes ---

// Get all projects for the logged-in user
app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create a new project
app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const project = new Project({
      userId: req.userId,
      title,
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get a single project by ID
app.get('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update a project's content (Autosave/Manual Save)
app.put('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const { title, content, editorState } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { ...(title && { title }), ...(content !== undefined && { content }), ...(editorState !== undefined && { editorState }) } },
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Compile LaTeX via texlive.net proxy to avoid frontend CORS
app.post('/api/compile', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'LaTeX content is required' });
    }

    const FormData = require('form-data');
    const axios = require('axios');
    const formData = new FormData();
    formData.append('filecontents[]', content);
    formData.append('filename[]', 'document.tex');
    formData.append('engine', 'pdflatex');
    formData.append('return', 'pdf');

    const response = await axios.post('https://texlive.net/cgi-bin/latexcgi', formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer'
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="document.pdf"',
    });
    res.send(response.data);
  } catch (error) {
    console.error('Compilation proxy error:', error);
    res.status(500).json({ error: 'Failed to compile LaTeX' });
  }
});

// Basic test route
app.get('/', (req, res) => {
  res.send('Welcome to the GranthAstraX Backend API');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
