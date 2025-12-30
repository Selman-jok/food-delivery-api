const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Routes WITHOUT auth for now (get it working first)
router.post('/add', (req, res, next) => {
  // Dummy user for testing
  req.user = { _id: 'test123', name: 'Test User' };
  next();
}, reviewController.addReview);

router.get('/food/:foodId', reviewController.getFoodReviews);

module.exports = router;