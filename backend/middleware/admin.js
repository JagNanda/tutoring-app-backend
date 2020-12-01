const jwt = require('jsonwebtoken')
const config = require('config')

const User = require('../models/User')


// Author: Ryan Haire
// This is a middleware to check if a user is an admin

module.exports = async function(req, res, next) {
    const token = req.header('x-auth-token')

    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'))
        const user = await User.findById(decoded.userId)

        if(!user) {
            return res.status(404).json({ msg: 'User not found!' })
        }

        if(!user.isAdmin) {
            return res.status(401).json({ msg: 'User is not authorized!' })
        }

        next()
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' })
    }
}