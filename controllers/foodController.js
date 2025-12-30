const Food = require('../models/Food');

// @desc    Get all foods
// @route   GET /api/foods
// @access  Public
const getAllFoods = async (req, res) => {
    try {
        const { category, popular, special, search } = req.query;
        
        let query = {};
        
        // Filter by category
        if (category) {
            query.category = category;
        }
        
        // Filter popular foods
        if (popular === 'true') {
            query.isPopular = true;
        }
        
        // Filter special offers
        if (special === 'true') {
            query.isSpecialOffer = true;
        }
        
        // Search by name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        const foods = await Food.find(query);
        
        // Calculate discounted price for special offers
        const foodsWithDiscount = foods.map(food => {
            const foodObj = food.toObject();
            if (food.isSpecialOffer && food.originalPrice && food.discountPercent) {
                foodObj.finalPrice = food.discountedPrice;
            } else {
                foodObj.finalPrice = food.price;
            }
            return foodObj;
        });
        
        res.json({
            success: true,
            count: foods.length,
            data: foodsWithDiscount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single food item
// @route   GET /api/foods/:id
// @access  Public
const getFoodById = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        
        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }
        
        const foodObj = food.toObject();
        if (food.isSpecialOffer && food.originalPrice && food.discountPercent) {
            foodObj.finalPrice = food.discountedPrice;
            foodObj.youSave = food.originalPrice - food.discountedPrice;
        } else {
            foodObj.finalPrice = food.price;
        }
        
        res.json({
            success: true,
            data: foodObj
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create food item
// @route   POST /api/foods
// @access  Private/Admin
const createFood = async (req, res) => {
    try {
        const food = new Food(req.body);
        await food.save();
        
        res.status(201).json({
            success: true,
            data: food
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update food item
// @route   PUT /api/foods/:id
// @access  Private/Admin
const updateFood = async (req, res) => {
    try {
        const food = await Food.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }
        
        res.json({
            success: true,
            data: food
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete food item
// @route   DELETE /api/foods/:id
// @access  Private/Admin
const deleteFood = async (req, res) => {
    try {
        const food = await Food.findByIdAndDelete(req.params.id);
        
        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Food item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add review to food item
// @route   POST /api/foods/:id/reviews
// @access  Public
const addReview = async (req, res) => {
    try {
        const { user, rating, comment } = req.body;
        
        const food = await Food.findById(req.params.id);
        
        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }
        
        const review = {
            user,
            rating,
            comment
        };
        
        food.reviews.push(review);
        food.totalReviews = food.reviews.length;
        food.rating = food.calculateAverageRating();
        
        await food.save();
        
        res.status(201).json({
            success: true,
            data: food.reviews[food.reviews.length - 1]
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get food by category
// @route   GET /api/foods/category/:category
// @access  Public
const getFoodsByCategory = async (req, res) => {
    try {
        const foods = await Food.find({ 
            category: req.params.category,
            available: true 
        });
        
        res.json({
            success: true,
            count: foods.length,
            data: foods
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get popular foods
// @route   GET /api/foods/popular
// @access  Public
const getPopularFoods = async (req, res) => {
    try {
        const foods = await Food.find({ 
            isPopular: true,
            available: true 
        }).sort({ rating: -1 }).limit(10);
        
        res.json({
            success: true,
            count: foods.length,
            data: foods
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get special offer foods
// @route   GET /api/foods/special-offers
// @access  Public
const getSpecialOffers = async (req, res) => {
    try {
        const foods = await Food.find({ 
            isSpecialOffer: true,
            available: true 
        });
        
        const foodsWithDiscount = foods.map(food => {
            const foodObj = food.toObject();
            foodObj.finalPrice = food.discountedPrice;
            foodObj.youSave = food.originalPrice - food.discountedPrice;
            return foodObj;
        });
        
        res.json({
            success: true,
            count: foods.length,
            data: foodsWithDiscount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllFoods,
    getFoodById,
    createFood,
    updateFood,
    deleteFood,
    addReview,
    getFoodsByCategory,
    getPopularFoods,
    getSpecialOffers
};