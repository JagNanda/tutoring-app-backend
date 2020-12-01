// Author: Ryan Haire
// This is for the education history

const mongoose = require('mongoose')

const educationHistorySchema = new mongoose.Schema({
    
}, {timestamps: true})

const EducationHistory = mongoose.model('EducationHistory', educationHistorySchema)

module.exports = EducationHistory