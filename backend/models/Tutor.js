// Author: Ryan Haire
// This is for the tutor profile model

const mongoose = require('mongoose')
const Review = require('./Review').schema
const Post = require('./Post').schema
const EducationHistory = require('./EducationHistory').schema

const tutorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: {
        type: [Review],
    },
    transcripts: {
        type: [String]
    },
    headline: {
        type: String
    },
    bio: {
        type: String
    },
    skillLevel: {
        type: String
    },
    tutorExpertise: {
        type: String
    },
    education: [EducationHistory],
    hourlyRate: {
        type: Number
    },
    tutoringSessions: [
        { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TutoringSession'
        }
    ],
    profileImage: {
        type: String
    },
    subjects: {
        type: [String]
    },
    languages: {
        type: [String]
    },
    languageProficiency: {
        type: [String]
    },
    isAvailable: {
        type: Boolean
    },
    incomingRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TutoringSessionRequest'
        }
    ],
    favouritePosts: {
        type: [Post]
    },
    chatRooms : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatRoom'
        }
    ],
    country: {
        type: String
    },
    street: {
        type: String
    },
    city: {
        type: String
    },
    province: {
        type: String
    },
    postalCode: {
        type: String
    },
}, {timestamps: true})

const Tutor = mongoose.model('Tutor', tutorSchema)

module.exports = Tutor