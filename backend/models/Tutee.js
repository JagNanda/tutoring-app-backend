// Author: Ryan Haire
// This is for the tutee profile model

const mongoose = require('mongoose')

const Post = require('./Post').schema

const tuteeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    posts: {
        type: [Post]
    },
    tutoringSessions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TutoringSession'
        }
    ],
    outgoingRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TutoringSessionRequest'
        }
    ],
    favouriteTutors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tutor'
        }
    ],
    reviews: [
        {
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
        }
    ],
    chatRooms : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatRoom'
        }
    ]
}, {timestamps: true})

const Tutee = mongoose.model('Tutee', tuteeSchema)

module.exports = Tutee