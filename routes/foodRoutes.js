const express = require('express');
const router = express.Router();
const {
    getAllFoods,
    getFoodById,
    createFood,
    updateFood,
    deleteFood,
    addReview,
    getFoodsByCategory,
    getPopularFoods,
    getSpecialOffers
} = require('../controllers/foodController');

// Public routes
router.get('/', getAllFoods);
router.get('/popular', getPopularFoods);
router.get('/special-offers', getSpecialOffers);
router.get('/category/:category', getFoodsByCategory);
router.get('/:id', getFoodById);

// Protected/Admin routes (you can add authentication middleware)
router.post('/', createFood);
router.put('/:id', updateFood);
router.delete('/:id', deleteFood);

// Review routes
router.post('/:id/reviews', addReview);

module.exports = router;