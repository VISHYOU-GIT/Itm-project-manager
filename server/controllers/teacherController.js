const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// Get teacher profile
const getProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id)
      .populate({
        path: 'assignedProjects',
        populate: {
          path: 'students',
          select: 'rollNo username department class'
        }
      });

    res.json({
      teacher: {
        id: teacher._id,
        username: teacher.username,
        email: teacher.email,
        assignedProjects: teacher.assignedProjects
      }
    });
  } catch (error) {
    console.error('Get teacher profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get latest updates from all assigned projects
const getLatestUpdates = async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    const { page = 1, limit = 10 } = req.query;

    // Find all projects assigned to this teacher
    const projects = await Project.find({ incharge: teacherId })
      .populate('students', 'rollNo username department class')
      .populate('updates.student', 'rollNo username')
      .sort({ 'updates.timestamp': -1 });

    // Flatten all updates from all projects
    let allUpdates = [];
    projects.forEach(project => {
      project.updates.forEach(update => {
        allUpdates.push({
          ...update.toObject(),
          projectId: project._id,
          projectName: project.name,
          projectStudents: project.students
        });
      });
    });

    // Sort by timestamp (newest first)
    allUpdates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUpdates = allUpdates.slice(startIndex, endIndex);

    res.json({
      updates: paginatedUpdates,
      totalUpdates: allUpdates.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(allUpdates.length / limit)
    });
  } catch (error) {
    console.error('Get latest updates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all assigned projects
const getProjects = async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    const { search } = req.query;

    let query = { incharge: teacherId };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'students.username': { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('students', 'rollNo username department class')
      .sort({ updatedAt: -1 });

    res.json({
      projects: projects.map(project => ({
        id: project._id,
        name: project.name,
        students: project.students,
        progress: project.progress,
        status: project.status,
        lastUpdated: project.updatedAt,
        updateCount: project.updates.length,
        targetCount: project.targets.length,
        completedTargets: project.targets.filter(t => t.completed).length
      }))
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get specific project details
const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;
    const teacherId = req.teacher._id;

    const project = await Project.findOne({ 
      _id: projectId, 
      incharge: teacherId 
    })
    .populate('students', 'rollNo username department class')
    .populate('updates.student', 'rollNo username');

    if (!project) {
      return res.status(404).json({ error: 'Project not found or not assigned to you' });
    }

    // Sort updates by timestamp (newest first)
    project.updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      project
    });
  } catch (error) {
    console.error('Get project details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add comment to update
const commentOnUpdate = async (req, res) => {
  try {
    const { projectId, updateId } = req.params;
    const { comment } = req.body;
    const teacherId = req.teacher._id;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    const project = await Project.findOne({ 
      _id: projectId, 
      incharge: teacherId 
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or not assigned to you' });
    }

    const update = project.updates.id(updateId);
    if (!update) {
      return res.status(404).json({ error: 'Update not found' });
    }

    // Add comment
    update.inchargeComment = comment.trim();
    update.lastEdited = new Date();

    await project.save();

    res.json({
      message: 'Comment added successfully',
      update
    });
  } catch (error) {
    console.error('Comment on update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update project targets
const updateTargets = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { targets } = req.body;
    const teacherId = req.teacher._id;

    if (!Array.isArray(targets)) {
      return res.status(400).json({ error: 'Targets must be an array' });
    }

    const project = await Project.findOne({ 
      _id: projectId, 
      incharge: teacherId 
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or not assigned to you' });
    }

    // Update targets
    project.targets = targets.map(target => ({
      title: target.title,
      description: target.description || '',
      completed: target.completed || false,
      completedAt: target.completed ? new Date() : null,
      createdAt: target.createdAt || new Date()
    }));

    await project.save();

    res.json({
      message: 'Targets updated successfully',
      targets: project.targets,
      progress: project.progress
    });
  } catch (error) {
    console.error('Update targets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get incharge requests
const getRequests = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id)
      .populate({
        path: 'inchargeRequests.student',
        select: 'rollNo username department class'
      });

    const pendingRequests = teacher.inchargeRequests.filter(
      request => request.status === 'pending'
    );

    res.json({
      requests: pendingRequests.map(request => ({
        id: request._id,
        student: request.student,
        createdAt: request.createdAt,
        status: request.status
      }))
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept incharge request
const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const teacherId = req.teacher._id;

    const teacher = await Teacher.findById(teacherId);
    const request = teacher.inchargeRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Check if student already has a project
    const existingProject = await Project.findOne({ students: request.student });
    if (existingProject) {
      request.status = 'rejected';
      await teacher.save();
      return res.status(400).json({ error: 'Student already has a project assigned' });
    }

    // Create new project
    const project = new Project({
      name: `Project for Student ${(await Student.findById(request.student)).rollNo}`,
      incharge: teacherId,
      students: [request.student]
    });

    await project.save();

    // Update request status
    request.status = 'accepted';
    teacher.assignedProjects.push(project._id);
    await teacher.save();

    // Update student
    const student = await Student.findById(request.student);
    student.project = project._id;
    
    // Update student's request status
    const studentRequest = student.inchargeRequests.find(
      req => req.teacher.toString() === teacherId.toString()
    );
    if (studentRequest) {
      studentRequest.status = 'accepted';
    }

    await student.save();

    res.json({
      message: 'Request accepted successfully',
      project: {
        id: project._id,
        name: project.name
      }
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reject incharge request
const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const teacherId = req.teacher._id;

    const teacher = await Teacher.findById(teacherId);
    const request = teacher.inchargeRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Update request status
    request.status = 'rejected';
    await teacher.save();

    // Update student's request status
    const student = await Student.findById(request.student);
    const studentRequest = student.inchargeRequests.find(
      req => req.teacher.toString() === teacherId.toString()
    );
    if (studentRequest) {
      studentRequest.status = 'rejected';
    }
    await student.save();

    res.json({
      message: 'Request rejected successfully'
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update teacher profile
const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const teacherId = req.teacher._id;

    const updateData = {};
    if (username && username.trim()) {
      updateData.username = username.trim();
    }
    if (email && email.trim()) {
      // Check if email is already taken by another teacher
      const existingTeacher = await Teacher.findOne({ 
        email: email.trim().toLowerCase(), 
        _id: { $ne: teacherId } 
      });
      if (existingTeacher) {
        return res.status(400).json({ error: 'Email already taken by another teacher' });
      }
      updateData.email = email.trim().toLowerCase();
    }

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      teacher
    });
  } catch (error) {
    console.error('Update teacher profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    const { name, description, duration, requirements } = req.body;
    const teacherId = req.teacher._id;

    const project = new Project({
      name: name.trim(),
      description: description.trim(),
      duration: duration?.trim(),
      requirements: requirements?.trim(),
      incharge: teacherId,
      status: 'active',
      progress: 0,
      targets: [],
      updates: []
    });

    await project.save();
    
    // Add to teacher's assigned projects
    await Teacher.findByIdAndUpdate(teacherId, {
      $push: { assignedProjects: project._id }
    });

    res.json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update project
const updateProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, duration, requirements } = req.body;
    const teacherId = req.teacher._id;

    const project = await Project.findOne({
      _id: projectId,
      incharge: teacherId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.name = name?.trim() || project.name;
    project.description = description?.trim() || project.description;
    project.duration = duration?.trim() || project.duration;
    project.requirements = requirements?.trim() || project.requirements;

    await project.save();

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get project updates
const getProjectUpdates = async (req, res) => {
  try {
    const { projectId } = req.params;
    const teacherId = req.teacher._id;

    const project = await Project.findOne({
      _id: projectId,
      incharge: teacherId
    }).populate('updates.student', 'rollNo username email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      updates: project.updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    });
  } catch (error) {
    console.error('Get project updates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all student updates for teacher
const getStudentUpdates = async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    
    const projects = await Project.find({ incharge: teacherId })
      .populate('updates.student', 'rollNo username email');

    const allUpdates = [];
    projects.forEach(project => {
      project.updates.forEach(update => {
        allUpdates.push({
          ...update.toObject(),
          projectId: project._id,
          projectName: project.name
        });
      });
    });

    // Sort by timestamp descending
    allUpdates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      updates: allUpdates
    });
  } catch (error) {
    console.error('Get student updates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add comment to update
const addUpdateComment = async (req, res) => {
  try {
    const { updateId, comment } = req.body;
    const teacherId = req.teacher._id;

    const project = await Project.findOne({
      'updates._id': updateId,
      incharge: teacherId
    });

    if (!project) {
      return res.status(404).json({ error: 'Update not found' });
    }

    const update = project.updates.id(updateId);
    update.inchargeComment = comment.trim();
    
    await project.save();

    res.json({
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get teacher statistics
const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    
    const projects = await Project.find({ incharge: teacherId })
      .populate('students', 'rollNo username');

    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const activeStudents = new Set();
    
    projects.forEach(project => {
      project.students.forEach(student => {
        activeStudents.add(student._id.toString());
      });
    });

    const recentProjects = projects
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    res.json({
      totalProjects,
      completedProjects,
      activeStudents: activeStudents.size,
      recentProjects
    });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get incharge requests for teacher
const getInchargeRequests = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id)
      .populate('inchargeRequests.student', 'rollNo username email');

    res.json({
      requests: teacher.inchargeRequests || []
    });
  } catch (error) {
    console.error('Get incharge requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Respond to incharge request
const respondToInchargeRequest = async (req, res) => {
  try {
    const { requestId, status, projectId, message } = req.body;
    const teacherId = req.teacher._id;

    const teacher = await Teacher.findById(teacherId);
    const request = teacher.inchargeRequests.id(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = status;
    request.teacherResponse = message;
    
    if (status === 'accepted') {
      // Create or assign to project
      let project;
      if (projectId) {
        project = await Project.findById(projectId);
      } else {
        // Create new project for student
        const student = await Student.findById(request.student);
        project = new Project({
          name: `Project for ${student.username}`,
          description: 'Project assigned after incharge request',
          incharge: teacherId,
          students: [request.student],
          status: 'active',
          progress: 0
        });
        await project.save();
        
        teacher.assignedProjects.push(project._id);
      }
      
      if (project && !project.students.includes(request.student)) {
        project.students.push(request.student);
        await project.save();
      }
      
      // Update student
      await Student.findByIdAndUpdate(request.student, {
        project: project._id
      });
      
      request.project = project._id;
    }

    await teacher.save();

    res.json({
      message: `Request ${status} successfully`
    });
  } catch (error) {
    console.error('Respond incharge request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProfile,
  getLatestUpdates,
  getProjects,
  getProjectDetails,
  commentOnUpdate,
  updateTargets,
  getRequests,
  acceptRequest,
  rejectRequest,
  updateProfile,
  createProject,
  updateProjectDetails,
  getProjectUpdates,
  getStudentUpdates,
  addUpdateComment,
  getTeacherStats,
  getInchargeRequests,
  respondToInchargeRequest
};
