
const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary
} = require('../controllers/cartController');

// Import auth controller for protection middleware
const authController = require('../controllers/authController');

// Protect all cart routes - user must be logged in
router.use(authController.protect);

// User-specific cart routes
router.get('/', getCart); // Get user's cart
router.get('/summary', getCartSummary); // Get user's cart summary
router.post('/add', addToCart); // Add item to user's cart
router.put('/update/:itemId', updateCartItem); // Update quantity in user's cart
router.delete('/remove/:itemId', removeFromCart); // Remove item from user's cart
router.delete('/clear', clearCart); // Clear user's cart

module.exports = router;