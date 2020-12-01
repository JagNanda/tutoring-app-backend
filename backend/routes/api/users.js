// Author: Ryan Haire
// This is for the user endpoints

const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const { check, validationResult } = require('express-validator')

const User = require('../../models/User')
const auth = require('../../middleware/auth')
const admin = require('../../middleware/admin')

// @route POST /api/users/register
// @desc register a new user
// @access Private
router.post('/register', [
    check('username', 'Please include a username').exists(),
    check('firstName', 'Please include a first name').exists(),
    check('lastName', 'Please include a last name').exists(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
], async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { username, firstName, lastName, email, password, /*phoneNumber, mailingAddress*/} = req.body;

    const isUsernameExist = await User.findOne({ username: username })

    if(isUsernameExist) {
        return res.status(400).json({ errors: [{ msg: 'Username is already taken!' }] });
    }

    const isEmailExist = await User.findOne({ email: email })

    if(isEmailExist) {
        return res.status(400).json({ errors: [{ msg: 'Email is already taken!' }] });
    }

    const salt = await bcrypt.genSalt(10)
    const pw = await bcrypt.hash(password, salt)

    try {
        const user = new User({
            username, 
            firstName, 
            lastName, 
            email,
            password: pw
            // phoneNumber,
            // mailingAddress
        })

        const savedUser = await user.save()

        const payload = {
            userId: savedUser._id
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
        res.status(500).json({ errors: [{ msg: 'Could not register user!' }]})
    }
})

// @route POST /api/users/admin/register
// @desc register a new user
// @access Private
router.post('/admin/register', [auth, admin, [
    check('username', 'Please include a username').exists(),
    check('name', 'Please include a name').exists(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    check('phoneNumber', 'Please include a phone number').exists(),
    check('mailingAddress', 'Please include mailing address').not().isEmpty()
]], async (req, res) => {
    const errors= validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { username, name, email, password, phoneNumber, isAdmin, mailingAddress} = req.body;

    const isUsernameExist = await User.findOne({ username: username })

    if(isUsernameExist) {
        return res.status(400).json({ errors: [{ msg: 'Username is already taken!' }] });
    }

    const isEmailExist = await User.findOne({ email: email })

    if(isEmailExist) {
        return res.status(400).json({ errors: [{ msg: 'Email is already taken!' }] });
    }

    const salt = await bcrypt.genSalt(10)
    const pw = await bcrypt.hash(password, salt)

    try {
        const user = new User({
            username, 
            name, 
            email,
            password: pw,
            phoneNumber,
            isAdmin,
            mailingAddress
        })

        const savedUser = await user.save()

        const payload = {
            userId: savedUser._id
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
        res.status(500).json({ errors: [{ msg: 'Could not register user!' }]})
    }
})

router.get('/all', auth, admin, async (req, res) => {
    try {
        const users = await User.find()

        if(!users) {
            return res.status(404).json({ errors: [{ msg: 'No users found!' }] });
        }

        res.json(users)
    } catch (error) {
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/users/:id
// @desc Get a user by id
// @access Private
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find user!' }] });
        }
            
        res.json(user)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/users/:id
// @desc Get a user by id
// @access Private
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find user!' }] });
        }

        res.json(user)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})
/*
// @route GET /api/users/tutor/:tutor_id
// @desc Get a user by tutor id
// @access Private
router.get('/tutor/:tutor_id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find user!' }] });
        }

        res.json(user)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})
*/

// @route PUT /api/users/:id
// @desc Update a user by id
// @access Private
router.put('/:id', auth, admin, async (req, res) => {
    try {
        let user = await User.findById(req.params.id)

        if(!user) {
            return res.status(404).json({ errors: [{ msg: 'User was not found!' }] });
        }
        
        const { 
            name, 
            username, 
            email, 
            password, 
            phoneNumber, 
            admin 
        } = req.body
        
        const userFields = {};
        if(name) userFields.name = name
        if(username) userFields.username = username
        if(email) userFields.email = email
        if(password) userFields.password = password
        if(phoneNumber) userFields.phoneNumber = phoneNumber
        if(admin) userFields.admin = admin
        if(!admin) userFields.admin = false

        if(user) {
            user = await User.findByIdAndUpdate(req.params.id, userFields, { new: true })
            res.json(user)
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route DELETE /api/users/:id
// @desc Delete a user by id
// @access Private
router.delete('/:id', auth, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user) {
            return res.status(404).json({ errors: [{ msg: 'User was not found!' }] });
        }

        await User.findByIdAndDelete(req.params.id)

        res.json({ msg: 'User deleted!' })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// test route to get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find()

        if(!users) {
            return res.status(404).json({ msg: 'No users found!'})
        }

        res.json(users)
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: 'Server Error'})
    }
})

module.exports = router