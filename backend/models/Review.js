// Author: Ryan Haire
// This is for the review model

const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    tuteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutee'
    },
    recommend: {
        type: Boolean
    },
    description: {
        type:  String
    },
    rating: {
        type: Number
    }
    
}, {timestamps: true})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review