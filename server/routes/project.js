const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

// Import Project model if it exists, otherwise create a basic schema
let Project;
try {
  Project = mongoose.model('Project');
} catch (error) {
  const projectSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'creatorModel'
    },
    creatorModel: {
      type: String,
      enum: ['Student', 'Teacher']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  Project = mongoose.model('Project', projectSchema);
}

// GET all projects
router.get('/', auth, function(req, res) {
  try {
    let projects;
    if (req.user && req.user.role === 'teacher') {
      // Teachers can see all projects or their own projects
      Project.find().then(result => {
        res.json(result);
      }).catch(err => {
        console.error('Error fetching projects:', err);
        res.status(500).json({ message: 'Server error' });
      });
    } else if (req.user) {
      // Students can only see their own projects
      Project.find({ 
        createdBy: req.user.id,
        creatorModel: 'Student'
      }).then(result => {
        res.json(result);
      }).catch(err => {
        console.error('Error fetching projects:', err);
        res.status(500).json({ message: 'Server error' });
      });
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET a single project by ID
router.get('/:id', auth, async function(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has permission to view this project
    if (req.user && req.user.role !== 'teacher' && 
        (project.createdBy.toString() !== req.user.id || 
         project.creatorModel !== 'Student')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create a new project
router.post('/', auth, function(req, res) {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const newProject = new Project({
      title,
      description,
      createdBy: req.user.id,
      creatorModel: req.user.role === 'teacher' ? 'Teacher' : 'Student'
    });

    newProject.save()
      .then(savedProject => {
        res.status(201).json(savedProject);
      })
      .catch(err => {
        console.error('Error saving project:', err);
        res.status(500).json({ message: 'Server error' });
      });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update a project
router.put('/:id', auth, function(req, res) {
  try {
    const { title, description, status } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the project
    Project.findById(req.params.id)
      .then(project => {
        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user has permission to update this project
        if (req.user.role !== 'teacher' && 
            (project.createdBy.toString() !== req.user.id || 
             project.creatorModel !== 'Student')) {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Update fields
        if (title) project.title = title;
        if (description) project.description = description;
        if (status) project.status = status;
        project.updatedAt = Date.now();

        return project.save();
      })
      .then(updatedProject => {
        if (updatedProject) {
          res.json(updatedProject);
        }
      })
      .catch(error => {
        console.error('Error updating project:', error);
        if (error.kind === 'ObjectId') {
          return res.status(404).json({ message: 'Project not found' });
        }
        res.status(500).json({ message: 'Server error' });
      });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a project
router.delete('/:id', auth, function(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    Project.findById(req.params.id)
      .then(project => {
        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user has permission to delete this project
        if (req.user.role !== 'teacher' && 
            (project.createdBy.toString() !== req.user.id || 
             project.creatorModel !== 'Student')) {
          return res.status(403).json({ message: 'Access denied' });
        }

        return Project.deleteOne({ _id: req.params.id });
      })
      .then(() => {
        res.json({ message: 'Project deleted' });
      })
      .catch(error => {
        console.error('Error deleting project:', error);
        if (error.kind === 'ObjectId') {
          return res.status(404).json({ message: 'Project not found' });
        }
        res.status(500).json({ message: 'Server error' });
      });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;