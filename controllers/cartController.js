

const Cart = require('../models/Cart');
const Food = require('../models/Food');

// Get user's cart (requires authentication)
const getCart = async (req, res) => {
    try {
        // Get cart for logged-in user
        let cart = await Cart.findOne({ user: req.user.id })
            .populate('items.food', 'name category price image');
        
        if (!cart) {
            // Create cart if doesn't exist for this user
            cart = new Cart({ 
                user: req.user.id,
                items: [] 
            });
            await cart.save();
        }
        
        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add item to user's cart (requires authentication)
const addToCart = async (req, res) => {
    try {
        const { foodId, quantity = 1 } = req.body;
        const userId = req.user.id; // Get user ID from authentication
        
        console.log('Adding to cart - userId:', userId, 'foodId:', foodId, 'quantity:', quantity);
        
        // Validate input
        if (!foodId) {
            return res.status(400).json({
                success: false,
                message: 'foodId is required'
            });
        }
        
        // Find the food item
        const food = await Food.findById(foodId);
        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }
        
        // Get or create cart for this specific user
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ 
                user: userId,
                items: [] 
            });
            console.log('Created new cart for user:', userId);
        }
        
        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.food.toString() === foodId
        );
        
        if (existingItemIndex > -1) {
            // Update quantity if item exists
            cart.items[existingItemIndex].quantity += quantity;
            console.log('Updated existing item quantity for user:', userId);
        } else {
            // Add new item to cart
            cart.items.push({
                food: foodId,
                name: food.name,
                quantity,
                price: food.price,
                finalPrice: food.price,
                image: food.image
            });
            console.log('Added new item to cart for user:', userId);
        }
        
        await cart.save();
        
        // Populate the response
        const populatedCart = await Cart.findById(cart._id)
            .populate('items.food', 'name category price image');
        
        res.status(201).json({
            success: true,
            message: 'Item added to cart',
            data: populatedCart
        });
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update item quantity in user's cart (requires authentication)
const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { itemId } = req.params;
        const userId = req.user.id;
        
        console.log('Updating cart item - userId:', userId, 'itemId:', itemId, 'quantity:', quantity);
        
        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        const itemIndex = cart.items.findIndex(item => 
            item._id.toString() === itemId
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }
        
        if (quantity < 1) {
            // Remove item if quantity is 0
            cart.items.splice(itemIndex, 1);
            console.log('Removed item from cart for user:', userId);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = quantity;
            console.log('Updated item quantity for user:', userId);
        }
        
        await cart.save();
        
        res.json({
            success: true,
            message: 'Cart updated successfully',
            data: cart
        });
    } catch (error) {
        console.error('Error in updateCartItem:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Remove item from user's cart (requires authentication)
const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.id;
        
        console.log('Removing from cart - userId:', userId, 'itemId:', itemId);
        
        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        const itemIndex = cart.items.findIndex(item => 
            item._id.toString() === itemId
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }
        
        // Remove item from cart
        cart.items.splice(itemIndex, 1);
        await cart.save();
        
        console.log('Item removed successfully for user:', userId);
        
        res.json({
            success: true,
            message: 'Item removed from cart',
            data: cart
        });
    } catch (error) {
        console.error('Error in removeFromCart:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Clear user's cart (requires authentication)
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Clearing entire cart for user:', userId);
        
        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        // Clear all items
        cart.items = [];
        await cart.save();
        
        console.log('Cart cleared successfully for user:', userId);
        
        res.json({
            success: true,
            message: 'Cart cleared successfully',
            data: cart
        });
    } catch (error) {
        console.error('Error in clearCart:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user's cart summary (requires authentication)
const getCartSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Getting cart summary for user:', userId);
        
        const cart = await Cart.findOne({ user: userId })
            .select('totalQuantity subtotal deliveryFee totalAmount');
        
        if (!cart) {
            return res.json({
                success: true,
                data: {
                    totalQuantity: 0,
                    subtotal: 0,
                    deliveryFee: 50,
                    totalAmount: 50
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                totalQuantity: cart.totalQuantity,
                subtotal: cart.subtotal,
                deliveryFee: cart.deliveryFee,
                totalAmount: cart.totalAmount
            }
        });
    } catch (error) {
        console.error('Error in getCartSummary:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary
};