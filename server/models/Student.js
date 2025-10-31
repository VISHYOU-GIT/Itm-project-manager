const mongoose = require('mongoose');

// Custom validator function for array length
function arrayLimit(val) {
  return val.length <= 4;
}

const studentSchema = new mongoose.Schema({
  rollNo: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project' 
  },
  partners: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student',
    validate: [arrayLimit, '{PATH} exceeds the limit of 4']
  }],
  inchargeRequests: [{
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  partnerRequests: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  partners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, {
  timestamps: true
});

// Index for faster queries
studentSchema.index({ rollNo: 1 });
studentSchema.index({ department: 1, class: 1 });

module.exports = mongoose.model('Student', studentSchema);
