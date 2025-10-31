const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  incharge: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher',
    required: true
  },
  students: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student' 
  }],
  updates: [{
    description: {
      type: String,
      required: true
    },
    screenshots: [String], // URLs to uploaded images
    report: String, // Rich text content
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    lastEdited: { 
      type: Date, 
      default: Date.now 
    },
    inchargeComment: String,
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }
  }],
  targets: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    completed: { 
      type: Boolean, 
      default: false 
    },
    completedAt: Date,
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold'],
    default: 'active'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Calculate progress based on completed targets
projectSchema.methods.calculateProgress = function() {
  if (this.targets.length === 0) return 0;
  const completedTargets = this.targets.filter(target => target.completed).length;
  return Math.round((completedTargets / this.targets.length) * 100);
};

// Update progress before saving
projectSchema.pre('save', function(next) {
  this.progress = this.calculateProgress();
  next();
});

// Index for faster queries
projectSchema.index({ incharge: 1 });
projectSchema.index({ students: 1 });
projectSchema.index({ 'updates.timestamp': -1 });

module.exports = mongoose.model('Project', projectSchema);
