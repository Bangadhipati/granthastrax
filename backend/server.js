const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // In production, you'll restrict this to your Netlify URL
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  
  // Parse additional identities (emails, GitHub usernames)
  const identifiersStr = req.headers['x-user-identifiers'] || '';
  const identifiers = identifiersStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  
  req.userId = userId;
  req.userIdentifiers = identifiers; // array of strings
  req.userName = req.headers['x-user-name'] || 'Unknown User';
  next();
};

// --- Project Routes ---

// Get all projects for the logged-in user (owned or collaborated)
app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { userId: req.userId },
        { collaboratorIdentifiers: { $in: req.userIdentifiers } }
      ]
    }).sort({ updatedAt: -1 });
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

// Get a single project by ID (must be owner or collaborator)
app.get('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { collaboratorIdentifiers: { $in: req.userIdentifiers } }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update a project's content (Autosave/Manual Save) - allowed for owners & collaborators
app.put('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const { title, content, editorState } = req.body;
    
    // First, verify access
    const project = await Project.findOne({ 
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { collaboratorIdentifiers: { $in: req.userIdentifiers } }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    // Determine what to update
    if (title) project.title = title;
    if (content !== undefined) project.content = content;
    if (editorState !== undefined) project.editorState = editorState;
    if (req.body.compiler !== undefined) project.compiler = req.body.compiler;
    
    project.lastEditedBy = req.userName;
    
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Manage Collaborators (Add/Remove) - ONLY owners
app.post('/api/projects/:id/collaborators', requireAuth, async (req, res) => {
  try {
    const { identifier, action } = req.body; // action: 'add' or 'remove'
    if (!identifier || !action) {
      return res.status(400).json({ error: 'Missing identifier or action' });
    }

    // Must be owner to add collaborators
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or you are not the owner' });
    }

    const cleanId = identifier.trim().toLowerCase();
    
    if (action === 'add') {
      if (!project.collaboratorIdentifiers.includes(cleanId)) {
        project.collaboratorIdentifiers.push(cleanId);
      }
    } else if (action === 'remove') {
      project.collaboratorIdentifiers = project.collaboratorIdentifiers.filter(id => id !== cleanId);
    }

    await project.save();
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to manage collaborators' });
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

// --- Image Management Routes ---

// Add a new image to project
app.post('/api/projects/:id/images', requireAuth, async (req, res) => {
  try {
    const { name, url, publicId } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and URL required' });

    const project = await Project.findOne({ 
      _id: req.params.id,
      $or: [{ userId: req.userId }, { collaboratorIdentifiers: { $in: req.userIdentifiers } }]
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.images.push({ name, url, publicId });
    project.lastEditedBy = req.userName;
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add image' });
  }
});

// Rename an image
app.put('/api/projects/:id/images/:imageId', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    const project = await Project.findOne({ 
      _id: req.params.id,
      $or: [{ userId: req.userId }, { collaboratorIdentifiers: { $in: req.userIdentifiers } }]
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const image = project.images.id(req.params.imageId);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    if (name) image.name = name;
    project.lastEditedBy = req.userName;
    
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// Delete an image
app.delete('/api/projects/:id/images/:imageId', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      $or: [{ userId: req.userId }, { collaboratorIdentifiers: { $in: req.userIdentifiers } }]
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.images.pull({ _id: req.params.imageId });
    project.lastEditedBy = req.userName;
    
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Compile LaTeX via texlive.net proxy to avoid frontend CORS
app.post('/api/compile', requireAuth, async (req, res) => {
  try {
    let { content, engine = 'pdflatex' } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'LaTeX content is required' });
    }

    const FormData = require('form-data');
    const axios = require('axios');
    const formData = new FormData();
    
    // Find all \includegraphics{URL} and download them
    const regex = /\\includegraphics(?:\[.*?\])?\{([^}]+)\}/g;
    const downloadedImages = new Map();
    let imageCounter = 0;

    const replaceAsync = async (str, regex, asyncFn) => {
      const promises = [];
      str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
      });
      const data = await Promise.all(promises);
      return str.replace(regex, () => data.shift());
    };

    content = await replaceAsync(content, regex, async (match, url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          if (!downloadedImages.has(url)) {
            const imgRes = await axios.get(url, { responseType: 'arraybuffer' });
            // basic extension detection or fallback to png
            const urlParts = url.split('?')[0].split('.');
            let ext = urlParts.length > 1 ? urlParts.pop() : 'png';
            if (ext.length > 4) ext = 'png'; 
            
            const filename = `image_${imageCounter++}.${ext}`;
            downloadedImages.set(url, { buffer: imgRes.data, filename });
          }
          const localFile = downloadedImages.get(url).filename;
          return match.replace(url, localFile);
        } catch (e) {
          console.error("Failed to download image:", url);
          return match;
        }
      }
      return match;
    });

    formData.append('filecontents[]', content);
    formData.append('filename[]', 'document.tex');

    // Attach all downloaded images
    for (const [url, imgData] of downloadedImages.entries()) {
       formData.append('filecontents[]', imgData.buffer, { filename: imgData.filename });
       formData.append('filename[]', imgData.filename);
    }

    formData.append('engine', engine);
    formData.append('return', 'pdf');

    const response = await axios.post('https://texlive.net/cgi-bin/latexcgi', formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer'
    });

    res.set({
      'Content-Type': response.headers['content-type'] || 'application/pdf',
      'Content-Disposition': 'inline; filename="document.pdf"',
    });
    res.send(response.data);
  } catch (error) {
    console.error('Compilation proxy error:', error);
    res.status(500).json({ error: 'Failed to compile LaTeX' });
  }
});

// Image Studio Routes
const imageStudioRoutes = require('./routes/imageStudio');
app.use('/api/image-studio', imageStudioRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.send('Welcome to the GranthAstraX Backend API');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
