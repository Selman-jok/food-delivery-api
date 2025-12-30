
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    finalPrice: {
        type: Number,
        required: true
    }
});

const cartSchema = new mongoose.Schema({
    // ADD USER FIELD - Each cart belongs to a specific user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Each user can have only one cart
    },
    items: [cartItemSchema],
    totalQuantity: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
        default: 0
    },
    deliveryFee: {
        type: Number,
        default: 50
    },
    totalAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate totals
cartSchema.pre('save', function(next) {
    this.totalQuantity = this.items.reduce((total, item) => total + item.quantity, 0);
    this.subtotal = this.items.reduce((total, item) => total + (item.finalPrice * item.quantity), 0);
    this.totalAmount = this.subtotal + this.deliveryFee;
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;