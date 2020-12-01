// Author: Ryan Haire
// This is for chat room model

const mongoose = require('mongoose')
const Message = require('./Message').schema

const chatRoomSchema = new mongoose.Schema({  
    tuteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutee'
    },
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor'
    },
    messages: { 
        type: [Message]
    },
    date: {
        type: Date,
        default: Date.now()
    }
}, {timestamps: true})

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema)

module.exports = ChatRoom