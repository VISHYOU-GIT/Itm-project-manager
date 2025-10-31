const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// Get all projects overview
const getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    let query = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'students.username': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('incharge', 'username email')
      .populate('students', 'rollNo username department class')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(query);

    res.json({
      projects: projects.map(project => ({
        id: project._id,
        name: project.name,
        incharge: project.incharge,
        students: project.students,
        progress: project.progress,
        status: project.status,
        updateCount: project.updates.length,
        targetCount: project.targets.length,
        completedTargets: project.targets.filter(t => t.completed).length,
        lastUpdated: project.updatedAt,
        createdAt: project.createdAt
      })),
      totalProjects: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign teacher to project
const assignIncharge = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { teacherId } = req.body;

    // Validate teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Find project
    const project = await Project.findById(projectId)
      .populate('incharge', 'username email')
      .populate('students', 'rollNo username');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const oldIncharge = project.incharge;

    // Update project incharge
    project.incharge = teacherId;
    await project.save();

    // Remove project from old incharge if exists
    if (oldIncharge && oldIncharge._id.toString() !== teacherId) {
      await Teacher.findByIdAndUpdate(
        oldIncharge._id,
        { $pull: { assignedProjects: projectId } }
      );
    }

    // Add project to new incharge
    if (!teacher.assignedProjects.includes(projectId)) {
      teacher.assignedProjects.push(projectId);
      await teacher.save();
    }

    await project.populate('incharge', 'username email');

    res.json({
      message: 'Incharge assigned successfully',
      project: {
        id: project._id,
        name: project.name,
        incharge: project.incharge,
        students: project.students
      }
    });
  } catch (error) {
    console.error('Assign incharge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update students in project
const updateProjectStudents = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'Student IDs must be an array' });
    }

    // Validate all students exist
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res.status(404).json({ error: 'One or more students not found' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Remove project reference from old students
    await Student.updateMany(
      { _id: { $in: project.students } },
      { $unset: { project: 1 } }
    );

    // Update project with new students
    project.students = studentIds;
    await project.save();

    // Add project reference to new students
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { project: projectId }
    );

    await project.populate('students', 'rollNo username department class');

    res.json({
      message: 'Project students updated successfully',
      project: {
        id: project._id,
        name: project.name,
        students: project.students
      }
    });
  } catch (error) {
    console.error('Update project students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all teachers
const getAllTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const teachers = await Teacher.find(query)
      .populate('assignedProjects', 'name students')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Teacher.countDocuments(query);

    res.json({
      teachers: teachers.map(teacher => ({
        id: teacher._id,
        username: teacher.username,
        email: teacher.email,
        assignedProjects: teacher.assignedProjects,
        projectCount: teacher.assignedProjects.length,
        createdAt: teacher.createdAt
      })),
      totalTeachers: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all teachers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, hasProject } = req.query;
    
    let query = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { rollNo: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by department
    if (department) {
      query.department = department;
    }
    
    // Filter by project status
    if (hasProject === 'true') {
      query.project = { $exists: true };
    } else if (hasProject === 'false') {
      query.project = { $exists: false };
    }

    const students = await Student.find(query)
      .populate('project', 'name incharge')
      .populate('project.incharge', 'username email')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(query);

    res.json({
      students: students.map(student => ({
        id: student._id,
        rollNo: student.rollNo,
        username: student.username,
        department: student.department,
        class: student.class,
        project: student.project,
        hasProject: !!student.project,
        createdAt: student.createdAt
      })),
      totalStudents: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    const { name, teacherId, studentIds } = req.body;

    if (!name || !teacherId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Name, teacher ID, and student IDs are required' });
    }

    // Validate teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Validate students
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res.status(404).json({ error: 'One or more students not found' });
    }

    // Check if any student already has a project
    const studentsWithProjects = students.filter(student => student.project);
    if (studentsWithProjects.length > 0) {
      return res.status(400).json({ 
        error: `Students already have projects: ${studentsWithProjects.map(s => s.rollNo).join(', ')}` 
      });
    }

    // Create project
    const project = new Project({
      name: name.trim(),
      incharge: teacherId,
      students: studentIds
    });

    await project.save();

    // Update teacher
    teacher.assignedProjects.push(project._id);
    await teacher.save();

    // Update students
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { project: project._id }
    );

    await project.populate([
      { path: 'incharge', select: 'username email' },
      { path: 'students', select: 'rollNo username department class' }
    ]);

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Remove project reference from students
    await Student.updateMany(
      { _id: { $in: project.students } },
      { $unset: { project: 1 } }
    );

    // Remove project reference from teacher
    await Teacher.findByIdAndUpdate(
      project.incharge,
      { $pull: { assignedProjects: projectId } }
    );

    // Delete project
    await Project.findByIdAndDelete(projectId);

    res.json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalProjects,
      totalStudents,
      totalTeachers,
      activeProjects,
      completedProjects,
      studentsWithProjects,
      studentsWithoutProjects,
      recentUpdates
    ] = await Promise.all([
      Project.countDocuments(),
      Student.countDocuments(),
      Teacher.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Project.countDocuments({ status: 'completed' }),
      Student.countDocuments({ project: { $exists: true } }),
      Student.countDocuments({ project: { $exists: false } }),
      Project.find()
        .sort({ 'updates.timestamp': -1 })
        .limit(5)
        .populate('students', 'rollNo username')
        .populate('incharge', 'username')
    ]);

    res.json({
      stats: {
        totalProjects,
        totalStudents,
        totalTeachers,
        activeProjects,
        completedProjects,
        studentsWithProjects,
        studentsWithoutProjects
      },
      recentActivity: recentUpdates.map(project => ({
        projectId: project._id,
        projectName: project.name,
        students: project.students,
        incharge: project.incharge,
        lastUpdate: project.updates.length > 0 ? 
          project.updates[project.updates.length - 1].timestamp : 
          project.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllProjects,
  assignIncharge,
  updateProjectStudents,
  getAllTeachers,
  getAllStudents,
  createProject,
  deleteProject,
  getDashboardStats
};
