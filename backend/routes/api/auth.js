// Author: Ryan Haire
// This is for the authentication endpoints

const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const config = require('config')
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator')

const User = require('../../models/User')
const auth = require('../../middleware/auth')


// @route /api/auth/login
// @desc login user and get token
// @access Public
router.post('/login', [
    check('email', 'Please include a email and make sure it is valid.').isEmail().exists(),
    check('password', 'Please include a password').exists()
], async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email })
        // const user1 = await User.findById(new mongoose.Types.ObjectId('5f5bdb0173914e46e04d86f1'))
        // const user1 = await User.findById('5f5bdb0173914e46e04d86f1')
        // console.log(`email is "${email}"`)
        // console.log(`password is ${password}`)
        // console.log(`user email is ${user1}`)
        // console.log(`1 - password is "${password}"`)
        // console.log(`2 - password is "${user.password}"`)

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Email is wrong' }] });
        }
    
        const validPassword = await bcrypt.compare(password, user.password)
    
        if (!validPassword) {
            return res.status(400).json({ errors: [{ msg: 'Password is wrong' }] });
        }
    
        const payload = {
            userId: user._id,
            msg: "Successfully logged in!"
        }
    
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
                if(err) throw err
                res.json({ token })
            }
        )
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error')
    }
})


// @route GET /api/auth
// @desc Get user with id from request
// @access Public
router.get('/', auth, async (req, res) => {
    const token = req.header('x-auth-token')
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'))
        
        const user = await User.findById(decoded.userId).select('-password')
        res.json(user)
    } catch (error) {
        console.error(error)
        res.status(500).send('Server Error')
    }
})

// create admin user - test route
router.get('/createdummyuser', async (req, res) => {
    try {

        const salt = await bcrypt.genSalt(10)
        const pw = await bcrypt.hash('12345678', salt)

        const user = await User.create({ 
            name: 'Ryan Haire', 
            username: 'RyanHaire', 
            email: 'rwhaire@hotmail.com',
            password: pw,
            phoneNumber: '9053349025',
            isAdmin: true
        })
    
        res.json(user)
    } catch (error) {
        console.error(error)
        res.json(error)
    }
    
})

module.exports = router