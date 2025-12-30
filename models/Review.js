
// server/models/Review.js - Update the schema
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    comment: {
      type: String,
      default: ''
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual for populated user
reviewSchema.virtual('populatedUser', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model("Review", reviewSchema);