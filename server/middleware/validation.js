const Joi = require('joi');

// Student validation schemas
const studentRegisterSchema = Joi.object({
  rollNo: Joi.string().required().trim().uppercase(),
  password: Joi.string().min(6).required(),
  username: Joi.string().min(2).required().trim(),
  department: Joi.string().required().trim(),
  class: Joi.string().required().trim()
});

const studentLoginSchema = Joi.object({
  rollNo: Joi.string().required().trim().uppercase(),
  password: Joi.string().required()
});

// Teacher validation schemas
const teacherRegisterSchema = Joi.object({
  username: Joi.string().min(2).required().trim(),
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(6).required()
});

const teacherLoginSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().required()
});

// Admin login schema
const adminLoginSchema = Joi.object({
  adminId: Joi.string().required(),
  password: Joi.string().required()
});

// Project validation schemas
const projectUpdateSchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().required(),
  report: Joi.string(),
  screenshots: Joi.array().items(Joi.string())
});

const targetSchema = Joi.object({
  title: Joi.string().required().trim(),
  description: Joi.string().trim(),
  completed: Joi.boolean()
});

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details[0].message 
      });
    }
    next();
  };
};

module.exports = {
  validateRequest,
  studentRegisterSchema,
  studentLoginSchema,
  teacherRegisterSchema,
  teacherLoginSchema,
  adminLoginSchema,
  projectUpdateSchema,
  targetSchema
};
