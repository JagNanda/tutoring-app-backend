// Author: Ryan Haire
// This is for the tutoring session request

const mongoose = require('mongoose')

const tutoringSessionRequestSchema = new mongoose.Schema({
    tuteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutee'
    },
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor'
    },
    subject: {
        type: String
    },
    details: {
        type: String
    },
    levelOfEducation: {
        type: String
    },
    courseName: {
        type: String
    },
    accepted: {
        type: Boolean
    },
    duration: {
        type: Number
    },
    cost: {
        type: Number
    },
    date: {
        type: Date
    }
}, {timestamps: true})

const TutoringSessionRequest = mongoose.model('TutoringSessionRequest', tutoringSessionRequestSchema)

module.exports = TutoringSessionRequest