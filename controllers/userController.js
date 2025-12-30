const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Helper function to filter object
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// GET ME (Get current user)
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// GET ALL USERS (Admin only)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

// GET USER
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// UPDATE ME
exports.updateMe = catchAsync(async (req, res, next) => {
  // Create error if user tries to update password
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('This route is not for password updates. Please use /update-my-password.', 400));
  }
  
  // Filter allowed fields
  const filteredBody = filterObj(req.body, 'name', 'email', 'phoneNumber');
  
  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});

// DELETE ME
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// UPDATE USER (Admin only)
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// DELETE USER (Admin only)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});