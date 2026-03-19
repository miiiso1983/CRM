const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Pagination helper
const paginate = (page = 1, limit = 20) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  return {
    limit: parseInt(limit),
    offset,
    page: parseInt(page),
  };
};

// Build pagination response
const paginateResponse = (data, page, limit, total) => {
  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasNext: parseInt(page) < Math.ceil(total / limit),
      hasPrev: parseInt(page) > 1,
    },
  };
};

// Search filter builder
const buildSearchFilter = (search, fields) => {
  if (!search) return {};
  return {
    [Op.or]: fields.map((field) => ({
      [field]: { [Op.like]: `%${search}%` },
    })),
  };
};

// Date range filter
const buildDateFilter = (startDate, endDate, field = 'created_at') => {
  if (!startDate && !endDate) return {};
  const filter = {};
  if (startDate) filter[Op.gte] = new Date(startDate);
  if (endDate) filter[Op.lte] = new Date(endDate + 'T23:59:59');
  return { [field]: filter };
};

// Format phone number (remove spaces, dashes)
const formatPhone = (phone) => {
  return phone ? phone.replace(/[\s\-\(\)]/g, '') : phone;
};

// Success response
const successResponse = (res, data, message = 'تمت العملية بنجاح', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

// Error response
const errorResponse = (res, message = 'حدث خطأ', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = {
  generateToken,
  paginate,
  paginateResponse,
  buildSearchFilter,
  buildDateFilter,
  formatPhone,
  successResponse,
  errorResponse,
};

