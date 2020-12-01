// Author: Ryan Haire
// This is for the user model

const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    phoneNumber: {
        type: String
    },
    mailingAddress: {
        city: {
            type: String
        },
        province: {
            type: String
        },
        country: {
            type: String
        },
        unitNumber: {
            type: String
        },
        streetName: {
            type: String
        },
        streetNumber: {
            type: String
        },
        postalCode: {
            type: String
        }
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isTutor: {
        type: Boolean
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor'
    },
    tuteeId: {
        type: mongoose.Schema.Types.ObjectId
    }
}, {timestamps: true})

const User = mongoose.model('User', userSchema)

module.exports = User