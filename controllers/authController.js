// const crypto = require('crypto');
// const { promisify } = require('util');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
// const sendEmail = require('../utils/email');

// // Helper function to create JWT token
// const signToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN
//   });
// };

// // Helper function to send token in response
// const createSendToken = (user, statusCode, res) => {
//   const token = signToken(user._id);
  
//   // Cookie options
//   const cookieOptions = {
//     expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production'
//   };
  
//   res.cookie('jwt', token, cookieOptions);
  
//   // Remove password from output
//   user.password = undefined;
  
//   res.status(statusCode).json({
//     status: 'success',
//     token,
//     data: { user }
//   });
// };

// // SIGNUP
// exports.signup = catchAsync(async (req, res, next) => {
//   // Normalize phone number
//   let phoneNumber = req.body.phoneNumber;
//   if (phoneNumber.startsWith('0')) {
//     phoneNumber = '+251' + phoneNumber.substring(1);
//   } else if (phoneNumber.startsWith('251') && !phoneNumber.startsWith('+251')) {
//     phoneNumber = '+' + phoneNumber;
//   }
  
//   const newUser = await User.create({
//     name: req.body.name,
//     email: req.body.email,
//     phoneNumber: phoneNumber,
//     password: req.body.password,
//     confirmPassword: req.body.confirmPassword,
//     role: req.body.role || 'user'
//   });
  
//   createSendToken(newUser, 201, res);
// });

// // LOGIN
// exports.login = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;
  
//   // Check if email and password exist
//   if (!email || !password) {
//     return next(new AppError('Please provide email and password', 400));
//   }
  
//   // Find user and include password
//   const user = await User.findOne({ email }).select('+password');
  
//   // Check if user exists and password is correct
//   if (!user || !(await user.correctPassword(password, user.password))) {
//     return next(new AppError('Incorrect email or password', 401));
//   }
  
//   // Send token
//   createSendToken(user, 200, res);
// });

// // LOGOUT
// exports.logout = (req, res) => {
//   res.cookie('jwt', 'loggedout', {
//     expires: new Date(Date.now() + 10 * 1000),
//     httpOnly: true
//   });
  
//   res.status(200).json({ 
//     status: 'success',
//     message: 'Logged out successfully'
//   });
// };

// // PROTECT MIDDLEWARE (Authentication)
// exports.protect = catchAsync(async (req, res, next) => {
//   let token;
  
//   // Get token from headers or cookies
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     token = req.headers.authorization.split(' ')[1];
//   } else if (req.cookies.jwt) {
//     token = req.cookies.jwt;
//   }
  
//   if (!token) {
//     return next(new AppError('You are not logged in. Please log in to get access.', 401));
//   }
  
//   // Verify token
//   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  
//   // Check if user still exists
//   const currentUser = await User.findById(decoded.id);
//   if (!currentUser) {
//     return next(new AppError('The user belonging to this token no longer exists.', 401));
//   }
  
//   // Check if user changed password after token was issued
//   if (currentUser.changedPasswordAfter(decoded.iat)) {
//     return next(new AppError('User recently changed password. Please log in again.', 401));
//   }
  
//   // Grant access
//   req.user = currentUser;
//   next();
// });

// // RESTRICT TO ROLE MIDDLEWARE
// exports.restrictTo = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return next(new AppError('You do not have permission to perform this action.', 403));
//     }
//     next();
//   };
// };

// // FORGOT PASSWORD
// // exports.forgotPassword = catchAsync(async (req, res, next) => {
// //   // Get user based on email
// //   const user = await User.findOne({ email: req.body.email });
// //   if (!user) {
// //     return next(new AppError('There is no user with that email address.', 404));
// //   }
  
// //   // Generate reset token
// //   const resetToken = user.createPasswordResetToken();
// //   await user.save({ validateBeforeSave: false });
  
// //   // Create reset URL
// //   const resetURL = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;
  
// //   // Create message
// //   const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email.`;
  
// //   try {
// //     await sendEmail({
// //       email: user.email,
// //       subject: 'Your password reset token (valid for 10 minutes)',
// //       message
// //     });
    
// //     res.status(200).json({
// //       status: 'success',
// //       message: 'Password reset token sent to email'
// //     });
// //   } catch (err) {
// //     user.passwordResetToken = undefined;
// //     user.passwordResetExpires = undefined;
// //     await user.save({ validateBeforeSave: false });
    
// //     return next(new AppError('There was an error sending the email. Try again later.', 500));
// //   }
// // });

// exports.resetPassword = catchAsync(async (req, res, next) => {
//   // Get user based on token
//   const hashedToken = crypto
//     .createHash('sha256')
//     .update(req.params.token)
//     .digest('hex');
  
//   const user = await User.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpires: { $gt: Date.now() }
//   });
  
//   if (!user) {
//     return next(new AppError('Token is invalid or has expired', 400));
//   }
  
//   // Set new password
//   user.password = req.body.password;
//   user.confirmPassword = req.body.confirmPassword;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
  
//   // Save the user with new password
//   await user.save();
  
//   // Log the user in (send new token)
//   createSendToken(user, 200, res);
// });
// // exports.forgotPassword = catchAsync(async (req, res, next) => {
// //   // Get user based on email
// //   const user = await User.findOne({ email: req.body.email });
// //   if (!user) {
// //     return next(new AppError('There is no user with that email address.', 404));
// //   }
  
// //   // Generate reset token
// //   const resetToken = user.createPasswordResetToken();
// //   await user.save({ validateBeforeSave: false });
  
// //   // For development/testing, just return the token
// //   if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_HOST) {
// //     console.log('🔑 Password reset token (for testing):', resetToken);
    
// //     res.status(200).json({
// //       status: 'success',
// //       message: 'Password reset token generated',
// //       token: resetToken, // Send token in response for testing
// //       resetURL: `http://localhost:3000/reset-password/${resetToken}`, // Your frontend URL
// //       note: 'In production, this token would be sent via email.'
// //     });
// //     return;
// //   }
  
// //   // For production: Create reset URL and send email
// //   const resetURL = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;
  
// //   // Alternative: Use your frontend URL
// //   // const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
  
// //   const message = `Forgot your password? Submit a PATCH request with your new password and confirmPassword to: ${resetURL}\nIf you didn't forget your password, please ignore this email.`;
  
// //   try {
// //     await sendEmail({
// //       email: user.email,
// //       subject: 'Your password reset token (valid for 10 minutes)',
// //       message
// //     });
    
// //     res.status(200).json({
// //       status: 'success',
// //       message: 'Password reset token sent to email'
// //     });
// //   } catch (err) {
// //     user.passwordResetToken = undefined;
// //     user.passwordResetExpires = undefined;
// //     await user.save({ validateBeforeSave: false });
    
// //     return next(new AppError('There was an error sending the email. Try again later.', 500));
// //   }
// // });
// // RESET PASSWORD
// // exports.resetPassword = catchAsync(async (req, res, next) => {
// //   // Get user based on token
// //   const hashedToken = crypto
// //     .createHash('sha256')
// //     .update(req.params.token)
// //     .digest('hex');
  
// //   const user = await User.findOne({
// //     passwordResetToken: hashedToken,
// //     passwordResetExpires: { $gt: Date.now() }
// //   });
  
// //   if (!user) {
// //     return next(new AppError('Token is invalid or has expired', 400));
// //   }
  
// //   // Set new password
// //   user.password = req.body.password;
// //   user.confirmPassword = req.body.confirmPassword;
// //   user.passwordResetToken = undefined;
// //   user.passwordResetExpires = undefined;
// //   await user.save();
  
// //   // Log the user in
// //   createSendToken(user, 200, res);
// // });
// exports.resetPassword = catchAsync(async (req, res, next) => {
//   // Get user based on token
//   const hashedToken = crypto
//     .createHash('sha256')
//     .update(req.params.token)
//     .digest('hex');
  
//   const user = await User.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpires: { $gt: Date.now() }
//   });
  
//   if (!user) {
//     return next(new AppError('Token is invalid or has expired', 400));
//   }
  
//   // Set new password
//   user.password = req.body.password;
//   user.confirmPassword = req.body.confirmPassword;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
  
//   // Save the user with new password
//   await user.save();
  
//   // Log the user in (send new token)
//   createSendToken(user, 200, res);
// });
// // UPDATE PASSWORD
// exports.updatePassword = catchAsync(async (req, res, next) => {
//   // Get user from collection
//   const user = await User.findById(req.user.id).select('+password');
  
//   // Check if current password is correct
//   if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
//     return next(new AppError('Your current password is wrong.', 401));
//   }
  
//   // Update password
//   user.password = req.body.password;
//   user.confirmPassword = req.body.confirmPassword;
//   await user.save();
  
//   // Log user in, send JWT
//   createSendToken(user, 200, res);
// });

const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

// Helper function to create JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Helper function to send token in response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };
  
  res.cookie('jwt', token, cookieOptions);
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

// SIGNUP
exports.signup = catchAsync(async (req, res, next) => {
  // Normalize phone number
  let phoneNumber = req.body.phoneNumber;
  if (phoneNumber.startsWith('0')) {
    phoneNumber = '+251' + phoneNumber.substring(1);
  } else if (phoneNumber.startsWith('251') && !phoneNumber.startsWith('+251')) {
    phoneNumber = '+' + phoneNumber;
  }
  
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    phoneNumber: phoneNumber,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role || 'user'
  });
  
  createSendToken(newUser, 201, res);
});

// LOGIN
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  
  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  
  // Check if user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  
  // Send token
  createSendToken(user, 200, res);
});

// LOGOUT
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({ 
    status: 'success',
    message: 'Logged out successfully'
  });
};

// PROTECT MIDDLEWARE (Authentication)
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  
  // Get token from headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  
  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }
  
  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  
  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }
  
  // Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password. Please log in again.', 401));
  }
  
  // Grant access
  req.user = currentUser;
  next();
});

// RESTRICT TO ROLE MIDDLEWARE
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

// FORGOT PASSWORD - FIXED VERSION
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }
  
  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  
  // For development/testing, just return the token
  if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_HOST) {
    console.log('🔑 Password reset token (for testing):', resetToken);
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset token generated',
      token: resetToken, // Send token in response for testing
      resetURL: `http://localhost:3000/reset-password/${resetToken}`,
      note: 'In production, this token would be sent via email.'
    });
    return;
  }
  
  // For production: Create reset URL and send email
  const resetURL = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;
  
  // Alternative: Use your frontend URL
  // const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
  
  const message = `Forgot your password? Submit a PATCH request with your new password and confirmPassword to: ${resetURL}\nIf you didn't forget your password, please ignore this email.`;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('There was an error sending the email. Try again later.', 500));
  }
});

// RESET PASSWORD
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  
  // Set new password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  // Save the user with new password
  await user.save();
  
  // Log the user in (send new token)
  createSendToken(user, 200, res);
});

// UPDATE PASSWORD
exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  
  // Check if current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  
  // Update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  
  // Log user in, send JWT
  createSendToken(user, 200, res);
});