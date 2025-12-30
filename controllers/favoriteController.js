const Favorite = require('../models/Favorite');
const Food = require('../models/Food');

// Get user's favorites
const getFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('Getting favorites for user:', userId);
        
        const favorites = await Favorite.find({ user: userId })
            .populate({
                path: 'food',
                select: 'name category price image rating totalReviews description ingredients isSpecialOffer discountPercent originalPrice'
            })
            .sort({ addedAt: -1 });
        
        // Extract food items from favorites
        const favoriteFoods = favorites.map(fav => fav.food);
        
        res.json({
            success: true,
            data: favoriteFoods,
            count: favoriteFoods.length
        });
    } catch (error) {
        console.error('Error in getFavorites:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add to favorites
const addToFavorites = async (req, res) => {
    try {
        const { foodId } = req.body;
        const userId = req.user.id;
        
        console.log('Adding to favorites - userId:', userId, 'foodId:', foodId);
        
        // Check if food exists
        const food = await Food.findById(foodId);
        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }
        
        // Check if already in favorites
        const existingFavorite = await Favorite.findOne({
            user: userId,
            food: foodId
        });
        
        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: 'Food already in favorites'
            });
        }
        
        // Create new favorite
        const favorite = new Favorite({
            user: userId,
            food: foodId
        });
        
        await favorite.save();
        
        // Populate the response
        const populatedFavorite = await Favorite.findById(favorite._id)
            .populate('food', 'name category price image rating totalReviews');
        
        res.status(201).json({
            success: true,
            message: 'Added to favorites',
            data: populatedFavorite.food
        });
    } catch (error) {
        console.error('Error in addToFavorites:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Food already in favorites'
            });
        }
        
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Remove from favorites
const removeFromFavorites = async (req, res) => {
    try {
        const { foodId } = req.params;
        const userId = req.user.id;
        
        console.log('Removing from favorites - userId:', userId, 'foodId:', foodId);
        
        const favorite = await Favorite.findOneAndDelete({
            user: userId,
            food: foodId
        });
        
        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Food not found in favorites'
            });
        }
        
        res.json({
            success: true,
            message: 'Removed from favorites'
        });
    } catch (error) {
        console.error('Error in removeFromFavorites:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Check if food is in favorites
const checkIsFavorite = async (req, res) => {
    try {
        const { foodId } = req.params;
        const userId = req.user.id;
        
        const favorite = await Favorite.findOne({
            user: userId,
            food: foodId
        });
        
        res.json({
            success: true,
            isFavorite: !!favorite
        });
    } catch (error) {
        console.error('Error in checkIsFavorite:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    checkIsFavorite
};