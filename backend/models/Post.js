// Author: Ryan Haire
// This is for the post model

const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    tuteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutee'
    },
    title: {
        type: String
    },
    subject: {
        type: String
    },
    description: {
        type: String
    },
    budgetRange: {
        type: String
    },
    levelOfEducation: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now()
    },
}, {timestamps: true})

const Post = mongoose.model('Post', postSchema)

module.exports = Post