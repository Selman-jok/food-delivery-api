const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    // date: {
    //     type: Date,
    //     default: Date.now
    // }
});

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['burger', 'pizza', 'cake', 'icecream', 'softdrink', 'burrito']
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    discountPercent: {
        type: Number,
        min: 0,
        max: 100
    },
    image: {
        type: String,
        required: true
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    isSpecialOffer: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    ingredients: {
        type: [String],
        default: []
    },
    reviews: [reviewSchema],
    available: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual for discounted price
foodSchema.virtual('discountedPrice').get(function() {
    if (this.originalPrice && this.discountPercent) {
        return this.originalPrice - (this.originalPrice * this.discountPercent / 100);
    }
    return this.price;
});

// Method to calculate average rating
foodSchema.methods.calculateAverageRating = function() {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / this.reviews.length;
};

const Food = mongoose.model('Food', foodSchema);
module.exports = Food;