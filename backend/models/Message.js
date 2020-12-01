// Author: Ryan Haire
// This is for the message model

const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor'
    },
    tuteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutee'
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
}, {timestamps: true})

const Message = mongoose.model('Message', messageSchema)

module.exports = Message