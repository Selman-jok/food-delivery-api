const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure user can't favorite same food twice
favoriteSchema.index({ user: 1, food: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;