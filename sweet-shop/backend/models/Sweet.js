const mongoose = require('mongoose');

const SweetSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['Chocolate', 'Gummies', 'Caramel', 'Hard Candy', 'Lollipops', 'Other']
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    image: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Sweet', SweetSchema);