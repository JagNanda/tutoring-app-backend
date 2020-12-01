// Author: Ryan Haire
// This is the tutoring session model

const mongoose = require('mongoose')

const tutoringSessionSchema = new mongoose.Schema({
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor'
    },
    tuteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutee'
    },
    hourlyRate: {
        type: Number
    },
    sessionDuration: {
        type: Number
    },
    date: {
        type: Date
    },
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TutoringSessionRequest'
    },
    completed: {
        type: Boolean
    }
}, {timestamps: true})

const TutoringSession = mongoose.model('TutoringSession', tutoringSessionSchema)

module.exports = TutoringSession