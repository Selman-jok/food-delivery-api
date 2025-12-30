
// module.exports = router;
const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const router = express.Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected routes (require authentication)
router.use(authController.protect); // All routes below this require authentication

router.patch('/update-my-password', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/update-me', userController.updateMe);
router.delete('/delete-me', userController.deleteMe);
router.post('/logout', authController.logout);

// Admin only routes
router.use(authController.restrictTo('admin'));
router.route('/')
  .get(userController.getAllUsers);
  
router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;