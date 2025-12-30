
// server/controllers/reviewController.js - Update addReview function
const Review = require('../models/Review');
const Food = require('../models/Food');
const User = require('../models/User'); // Add this import

// Add a review
exports.addReview = async (req, res) => {
  try {
    console.log('📝 Add review request body:', req.body);
    console.log('👤 User from request:', req.user); // Check if user exists
    
    const { foodId, rating, comment } = req.body;
    
    // IMPORTANT: Use the authenticated user from req.user
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Please login to add a review'
      });
    }
    
    const userId = req.user._id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if food exists
    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Check if user already reviewed this food
    const existingReview = await Review.findOne({ 
      food: foodId, 
      user: userId 
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this food'
      });
    }

    // Create review
    const review = new Review({
      food: foodId,
      user: userId,
      rating,
      comment: comment || ''
    });

    await review.save();

    // Populate user details
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name email')
      .lean();

    // Update food rating
    const reviews = await Review.find({ food: foodId });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    food.rating = parseFloat(averageRating.toFixed(1));
    food.totalReviews = reviews.length;
    await food.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        ...populatedReview,
        userName: populatedReview.user.name,
        userEmail: populatedReview.user.email,
        user: {
          _id: populatedReview.user._id,
          name: populatedReview.user.name,
          email: populatedReview.user.email
        }
      }
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get reviews for a food item
// In reviewController.js - Update getFoodReviews function
exports.getFoodReviews = async (req, res) => {
  try {
    const { foodId } = req.params;
    console.log('📝 Fetching reviews for food:', foodId);

    const reviews = await Review.find({ food: foodId })
      .populate({
        path: 'user',
        select: 'name email', // Make sure to select name
        model: 'User' // Specify the model
      })
      .sort({ createdAt: -1 });

    console.log('👤 First review user data:', reviews[0]?.user);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};