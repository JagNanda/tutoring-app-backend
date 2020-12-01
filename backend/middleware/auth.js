const jwt = require('jsonwebtoken')
const config = require('config')

// Author: Ryan Haire
// This is a middleware to check if a user is 
// authenticated by jwt token

module.exports = function(req, res, next) {
    const token = req.header('x-auth-token')
    
    if(!token) {
        return res.status(401).json({ msg: 'No token, authorization denied!'})
    }

    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'))

        req.user = decoded.user
        next()
    } catch (error) {
        res.status(400).json({ msg: "Token is not valid" })
    }
}