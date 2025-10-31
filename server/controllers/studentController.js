const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// Get student profile
const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id)
      .populate({
        path: 'project',
        populate: {
          path: 'incharge',
          select: 'username email'
        }
      })
      .populate('partners', 'rollNo username department class');

    res.json({
      student: {
        id: student._id,
        rollNo: student.rollNo,
        username: student.username,
        department: student.department,
        class: student.class,
        project: student.project,
        partners: student.partners
      }
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create or update project
const updateProject = async (req, res) => {
  try {
    const { name, description, report, screenshots } = req.body;
    const studentId = req.student._id;

    let project = await Project.findOne({ students: studentId });

    if (!project) {
      return res.status(404).json({ error: 'No project assigned. Please request an incharge first.' });
    }

    // Add new update
    const newUpdate = {
      description,
      report,
      screenshots: screenshots || [],
      timestamp: new Date(),
      lastEdited: new Date(),
      student: studentId
    };

    project.updates.push(newUpdate);

    // Update project name if provided
    if (name && name.trim()) {
      project.name = name.trim();
    }

    await project.save();

    // Populate the project with necessary details
    await project.populate([
      { path: 'incharge', select: 'username email' },
      { path: 'students', select: 'rollNo username' },
      { path: 'updates.student', select: 'rollNo username' }
    ]);

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Edit specific update
const editUpdate = async (req, res) => {
  try {
    const { updateId } = req.params;
    const { description, report, screenshots } = req.body;
    const studentId = req.student._id;

    const project = await Project.findOne({ students: studentId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const update = project.updates.id(updateId);
    if (!update) {
      return res.status(404).json({ error: 'Update not found' });
    }

    // Check if the student owns this update
    if (update.student.toString() !== studentId.toString()) {
      return res.status(403).json({ error: 'You can only edit your own updates' });
    }

    // Update fields
    update.description = description || update.description;
    update.report = report || update.report;
    update.screenshots = screenshots || update.screenshots;
    update.lastEdited = new Date();

    await project.save();

    res.json({
      message: 'Update edited successfully',
      update
    });
  } catch (error) {
    console.error('Edit update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request incharge
const requestIncharge = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const studentId = req.student._id;

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if student already has a project
    const existingProject = await Project.findOne({ students: studentId });
    if (existingProject) {
      return res.status(400).json({ error: 'You already have a project assigned' });
    }

    // Check if request already exists
    const existingRequest = req.student.inchargeRequests.find(
      request => request.teacher.toString() === teacherId && request.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ error: 'Request already sent to this teacher' });
    }

    // Add request to student
    req.student.inchargeRequests.push({
      teacher: teacherId,
      status: 'pending'
    });
    await req.student.save();

    // Add request to teacher
    teacher.inchargeRequests.push({
      student: studentId,
      status: 'pending'
    });
    await teacher.save();

    res.json({
      message: 'Incharge request sent successfully',
      request: {
        teacher: {
          id: teacher._id,
          username: teacher.username,
          email: teacher.email
        },
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Request incharge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request partner
const requestPartner = async (req, res) => {
  try {
    const { partnerRollNo } = req.body;
    const studentId = req.student._id;

    // Find partner by roll number
    const partner = await Student.findOne({ rollNo: partnerRollNo });
    if (!partner) {
      return res.status(404).json({ error: 'Student with this roll number not found' });
    }

    if (partner._id.toString() === studentId.toString()) {
      return res.status(400).json({ error: 'You cannot send a partner request to yourself' });
    }

    // Check if they're already partners
    if (req.student.partners.includes(partner._id)) {
      return res.status(400).json({ error: 'Already partners with this student' });
    }

    // Check if request already exists
    const existingRequest = req.student.partnerRequests.find(
      request => request.student.toString() === partner._id.toString() && request.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ error: 'Request already sent to this student' });
    }

    // Add request to current student
    req.student.partnerRequests.push({
      student: partner._id,
      status: 'pending'
    });
    await req.student.save();

    // Add request to partner
    partner.partnerRequests.push({
      student: studentId,
      status: 'pending'
    });
    await partner.save();

    res.json({
      message: 'Partner request sent successfully',
      request: {
        partner: {
          id: partner._id,
          rollNo: partner.rollNo,
          username: partner.username
        },
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Request partner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get project progress
const getProgress = async (req, res) => {
  try {
    const studentId = req.student._id;
    
    const project = await Project.findOne({ students: studentId })
      .populate('incharge', 'username email');

    if (!project) {
      return res.status(404).json({ error: 'No project assigned' });
    }

    res.json({
      project: {
        id: project._id,
        name: project.name,
        progress: project.progress,
        targets: project.targets,
        incharge: project.incharge,
        status: project.status
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get daily updates
const getDailyUpdates = async (req, res) => {
  try {
    const studentId = req.student._id;
    
    const project = await Project.findOne({ students: studentId })
      .populate('updates.student', 'rollNo username')
      .sort({ 'updates.timestamp': -1 });

    if (!project) {
      return res.status(404).json({ error: 'No project assigned' });
    }

    // Sort updates by timestamp (newest first)
    project.updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      updates: project.updates
    });
  } catch (error) {
    console.error('Get daily updates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all available teachers
const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({}, 'username email assignedProjects')
      .populate('assignedProjects', 'name');

    res.json({
      teachers: teachers.map(teacher => ({
        id: teacher._id,
        username: teacher.username,
        email: teacher.email,
        projectCount: teacher.assignedProjects.length
      }))
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Respond to partner request
const respondToPartnerRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body; // action: 'accept' or 'reject'
    const studentId = req.student._id;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "accept" or "reject"' });
    }

    const student = await Student.findById(studentId);
    const request = student.partnerRequests.id(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Update request status
    request.status = action === 'accept' ? 'accepted' : 'rejected';
    
    if (action === 'accept') {
      // Check if current student already has 4 partners
      if (student.partners.length >= 4) {
        return res.status(400).json({ error: 'Cannot accept more partners. Maximum limit of 4 reached.' });
      }

      const partnerId = request.student;
      const partner = await Student.findById(partnerId);
      
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }

      // Check if partner already has 4 partners
      if (partner.partners.length >= 4) {
        return res.status(400).json({ error: 'Partner already has maximum number of partners.' });
      }

      // Add partners to each other
      student.partners.push(partnerId);
      partner.partners.push(studentId);

      // Handle project assignment - all partners share the same project
      let sharedProject = null;
      
      // If current student has a project, use it
      if (student.project) {
        sharedProject = student.project;
      } 
      // If partner has a project, use it
      else if (partner.project) {
        sharedProject = partner.project;
      }

      // Assign shared project to both students
      if (sharedProject) {
        student.project = sharedProject;
        partner.project = sharedProject;
        
        // Update project to include all partners
        const Project = require('../models/Project');
        await Project.findByIdAndUpdate(
          sharedProject,
          { $addToSet: { students: { $each: [studentId, partnerId] } } }
        );
      }
      
      // Update the corresponding request in partner's list
      const partnerRequest = partner.partnerRequests.find(
        req => req.student.toString() === studentId.toString()
      );
      if (partnerRequest) {
        partnerRequest.status = 'accepted';
      }
      
      await partner.save();
    }

    await student.save();

    res.json({
      message: `Partner request ${action}ed successfully`,
      request
    });
  } catch (error) {
    console.error('Respond to partner request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get partner requests
const getPartnerRequests = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id)
      .populate('partnerRequests.student', 'rollNo username email')
      .populate('partners', 'rollNo username email');

    res.json({
      requests: student.partnerRequests,
      partners: student.partners
    });
  } catch (error) {
    console.error('Get partner requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get available students for partnering
const getAvailableStudents = async (req, res) => {
  try {
    const { search } = req.query;
    const studentId = req.student._id;
    
    let query = {
      _id: { $ne: studentId },
      $expr: { $lt: [{ $size: "$partners" }, 4] } // Students with less than 4 partners
    };
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const students = await Student.find(query)
      .select('rollNo username email department class partners')
      .populate('partners', 'rollNo username')
      .limit(20);

    res.json({
      students
    });
  } catch (error) {
    console.error('Get available students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send partner request (new implementation)
const sendPartnerRequest = async (req, res) => {
  try {
    const { partnerId, message } = req.body;
    const studentId = req.student._id;

    const partner = await Student.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (partner._id.toString() === studentId.toString()) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    // Check if current student already has 4 partners
    if (req.student.partners.length >= 4) {
      return res.status(400).json({ error: 'You already have the maximum number of partners (4)' });
    }

    // Check if partner already has 4 partners
    if (partner.partners.length >= 4) {
      return res.status(400).json({ error: 'This student already has the maximum number of partners' });
    }

    // Check if already partners
    if (req.student.partners.includes(partnerId)) {
      return res.status(400).json({ error: 'Already partners' });
    }

    // Check if request already exists (prevent duplicates)
    const existingRequest = req.student.partnerRequests.find(
      req => req.student?.toString() === partnerId.toString() && req.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ error: 'Request already sent to this student' });
    }

    // Add request to both students
    const newRequest = {
      requester: studentId,
      receiver: partnerId,
      message: message || '',
      status: 'pending',
      createdAt: new Date()
    };

    req.student.partnerRequests.push({
      student: partnerId,
      message,
      status: 'pending',
      type: 'sent'
    });
    
    partner.partnerRequests.push({
      student: studentId,
      message,
      status: 'pending',
      type: 'received'
    });

    await req.student.save();
    await partner.save();

    res.json({
      message: 'Partner request sent successfully'
    });
  } catch (error) {
    console.error('Send partner request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Respond to partner request (updated)
const respondPartnerRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const studentId = req.student._id;

    const student = await Student.findById(studentId);
    const request = student.partnerRequests.id(requestId);
    
    if (!request || request.type !== 'received') {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = status;
    
    if (status === 'accepted') {
      student.partners.push(request.student);
      
      const partner = await Student.findById(request.student);
      partner.partners.push(studentId);
      
      // Update partner's sent request
      const partnerRequest = partner.partnerRequests.find(
        req => req.student.toString() === studentId.toString() && req.type === 'sent'
      );
      if (partnerRequest) {
        partnerRequest.status = 'accepted';
      }
      
      await partner.save();
    }

    await student.save();

    res.json({
      message: `Request ${status} successfully`
    });
  } catch (error) {
    console.error('Respond partner request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProfile,
  updateProject,
  editUpdate,
  requestIncharge,
  requestPartner,
  getProgress,
  getDailyUpdates,
  getTeachers,
  respondToPartnerRequest,
  getPartnerRequests,
  getAvailableStudents,
  sendPartnerRequest,
  respondPartnerRequest
};
