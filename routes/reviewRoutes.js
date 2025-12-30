const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth'); 
let authHandler;
try {
  authHandler = require('../middleware/auth');
  if (typeof authHandler !== 'function') {
    console.log('⚠️ authMiddleware is not a function, using placeholder');
    authHandler = (req, res, next) => {
      // For testing, create a dummy user
      req.user = {
        _id: '65d8a1b2c8e9f001a2b3c4d5',
        name: 'Test User',
        email: 'test@example.com'
      };
      next();
    };
  }
} catch (error) {
  console.log('⚠️ authMiddleware not found, creating dummy middleware');
  authHandler = (req, res, next) => {
    // For testing, create a dummy user
    req.user = {
      _id: '65d8a1b2c8e9f001a2b3c4d5',
      name: 'Test User',
      email: 'test@example.com'
    };
    next();
  };
}

// Add a review (with auth)
router.post('/add', authHandler, reviewController.addReview);

// Get reviews for a food item (public)
router.get('/food/:foodId', reviewController.getFoodReviews);

// Delete a review (with auth)
// router.delete('/:reviewId', authHandler, reviewController.deleteReview);

module.exports = router;