// Author: Ryan Haire
// This is for the tutee profile endpoints

const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const { check, validationResult } = require('express-validator')

const Tutee = require('../../models/Tutee')
const User = require('../../models/User')
const auth = require('../../middleware/auth')
const admin = require('../../middleware/admin')
const Post = require('../../models/Post')
const Tutor = require('../../models/Tutor')
const TutoringSession = require('../../models/TutoringSession')
const TutoringSessionRequest = require('../../models/TutoringSessionRequest')
const mongoose = require('mongoose')
const { Model, Mongoose } = require('mongoose')

// @route GET /api/tutees/all
// @desc Get all tutees 
// @access Private
router.get('/all', auth, admin, async (req, res) => {
    try {
        const tutors = await Tutee.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "tuteeId",
                    as: "userInfo"
                }
            }, 
            { 
                $unwind: "$userInfo"
            }
        ])

        if(!tutors) {
            return res.status(404).json({ errors: [{ msg: 'No tutees found!' }] });
        }

        res.json(tutors)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/tutees/favourite/:tutee_id
// @desc Get all favourite tutors 
// @access Private
router.get('/favourite/:tutee_id', auth, async (req, res) => {
    try {
        let tutee = await Tutee.findById(req.params.tutee_id)

        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile!'}]})
        }

        // const favTutors = await Tutor.find().where('_id').in(tutee.favouriteTutors).exec();

        const tutors = await Tutor.aggregate([
            {
                $match: {"_id": { $in: tutee.favouriteTutors }}
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "tutorId",
                    as: "userInfo"
                }
            }, 
            { 
                $unwind: "$userInfo"
            }
        ])

        if(!tutors) {
            return res.status(404).json({ errors: [{ msg: 'No tutors found!' }] });
        }

        res.json(tutors)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route POST /api/tutees/:user_id
// @desc Create a tutee profile for a user
// @access Private
router.post('/:user_id', auth, async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        let user = await User.findById(req.params.user_id)

        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find user!' }] });
        }

        const tutee = new Tutee({ user: user._id})

        user = await User.findByIdAndUpdate(req.params.user_id, { tuteeId: tutee._id}, { new: true })

        await tutee.save()

        res.json({ user: user, tuteeInfo: tutee})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route PUT /api/tutees/:user_id
// @desc Update a tutee profile by user id
// @access Private
router.put('/:user_id', auth, async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        let user = await User.findById(req.params.user_id)

        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find user!' }] });
        }

        let tutee = await Tutee.findById(user.tuteeId)

        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutor profile for user!'}]})
        }

        const {  
            subjects
        } = req.body;

        const tuteeFields = {}
        tuteeFields.user = req.params.user_id
        if(subjects) {
            tuteeFields.subjects = subjects.split(',').map(subject => subject.trim())
        }
        
    
        tutee = await Tutee.findByIdAndUpdate(tutee._id, tuteeFields, { new: true })

        res.json({ user: user, tuteeInfo: tutee})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})


// @route GET /api/tutees/post/all
// @desc Get all posts for every tutee
// @access Public
router.get('/post/all', async (req, res) => {
    try {
        let posts = await Post.find()

        if(!posts) {
            return res.status(404).json({ errors: [{ msg: 'Could not find any posts!'}]})
        }

        res.json(posts)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/tutees/post/all
// @desc Get all posts for every tutee by subject
// @access Public
router.get('/post/all/:subject', async (req, res) => {
    try {
        let posts = await Post.find({subject: req.params.subject})

        if(!posts) {
            return res.status(404).json({ errors: [{ msg: 'Could not find any posts!'}]})
        }

        res.json(posts)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})



// @route POST /api/tutees/post/:tutee_id
// @desc Create a post for a tutee
// @access Private
router.post('/post/:tutee_id', [[
    check('title', 'Please include a title.').not().isEmpty(),
    check('subject', 'Please include a subject.').not().isEmpty(),
    check('budgetRange', 'Please include a budget range.').not().isEmpty(),
    check('levelOfEducation', 'Please include your level of education.').not().isEmpty(),
    check('description', 'Please include a description.').not().isEmpty(),
],auth], async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        let user = await User.find({tuteeId: req.params.tutee_id})

        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find user!' }] });
        }

        let tutee = await Tutee.findById(req.params.tutee_id)

        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }

        const { title, subject, budgetRange, levelOfEducation, description } = req.body;
        const postFields = {}
        postFields.tuteeId = req.params.tutee_id
        if(title) postFields.title = title
        if(subject) postFields.subject = subject
        if(budgetRange) postFields.budgetRange = budgetRange
        if(levelOfEducation) postFields.levelOfEducation = levelOfEducation
        if(description) postFields.description = description

        let post = new Post(postFields)

        await post.save()

        tutee.posts.push(post)
        await tutee.save()

        res.json({user: user, tutee: tutee, post: post})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route PUT /api/tutees/post/:post_id/:tutee_id
// @desc Update a post for a tutee
// @access Private
router.put('/post/:post_id/:tutee_id', [[
    check('title', 'Please include a title.').not().isEmpty(),
    check('subject', 'Please include a subject.').not().isEmpty(),
    check('budgetRange', 'Please include a budget range.').not().isEmpty(),
    check('levelOfEducation', 'Please include your level of education.').not().isEmpty(),
],auth], async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {

        let post = await Post.findById(req.params.post_id)
        if (!post) {
            return res.status(404).json({ errors: [{ msg: 'Could not find post!' }] });
        }

        let user = await User.find({tuteeId: req.params.tutee_id})
        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find user!' }] });
        }

        let tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }

        const { title, subject, budgetRange, levelOfEducation } = req.body;
        const postFields = {}
        postFields.tuteeId = req.params.tutee_id
        if(title) postFields.title = title
        if(subject) postFields.subject = subject
        if(budgetRange) postFields.budgetRange = budgetRange
        if(levelOfEducation) postFields.levelOfEducation = levelOfEducation

        post = await Post.findByIdAndUpdate(req.params.post_id, postFields, {new: true})
        post = tutee.posts.findByIdAndUpdate(req.params.post_id, postFields, {new: true})

        res.json({user: user, tutee: tutee, post: post})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route PUT /api/tutees/post/:post_id/:tutee_id
// @desc Delete a post for a tutee
// @access Private
router.delete('/post/:post_id/:tutee_id', auth, async (req, res) => {
    try {
        let post = await Post.findById(req.params.post_id)
        if (!post) {
            return res.status(404).json({ errors: [{ msg: 'Could not find post!' }] });
        }

        let user = await User.find({tuteeId: req.params.tutee_id})
        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find user!' }] });
        }

        let tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }

        await Post.findByIdAndDelete(req.params.post_id)
        await tutee.posts.findByIdAndDelete(req.params.post_id)

        res.json({ msg: 'Successfully deleted post!' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/tutees/post/:post_id/:tutee_id
// @desc Get a post for a tutee
// @access Public
router.get('/post/:post_id/:tutee_id', async (req, res) => {
    try {
        let tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }

        let post = await Post.findById(req.params.post_id)
        if(!post) {
            return res.status(404).json({ errors: [{ msg: 'Could not find post for tutee!'}]})
        }

        res.json({ tutee: tutee, post: post})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/tutees/post/:tutee_id
// @desc Get all posts for a tutee
// @access Public
router.get('/post/:tutee_id', async (req, res) => {
    try {
        let tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }

        let posts = await Post.find({tuteeId: req.params.tutee_id})
        if(!posts) {
            return res.status(404).json({ errors: [{ msg: 'Could not find any posts for tutee!'}]})
        }

        res.json({ tutee: tutee, posts: posts})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route DELETE /api/tutees/:user_id
// @desc Delete a tutee profile
// @access Private
router.delete('/:user_id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user) {
            return res.status(404).json({ errors: [{ msg: 'User was not found!' }] });
        }

        let tutee = await Tutee.findById(user.tuteeId)

        if(!tutor) {
            return res.status(404).json({ errors: [{ msg: 'Tutor profile was not found for user!' }] });
        }

        await Tutee.findByIdAndDelete(tutee._id)

        res.json({ errors: [{ msg: 'Tutor profile deleted!' }] })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route PUT /api/tutees/:tutee_id/tutors/:tutor_id
// @desc Add a favourite tutor for tutee
// @access Private
router.put("/:tutee_id/tutors/:tutor_id", auth, async (req, res) => {
    try{
        const tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({ errors: [ { msg: 'Could not find tutor profile!' } ] })
        }
        const tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }
        tutee.favouriteTutors.push(tutor);
        await tutee.save();
        res.json({tutor: tutor, tutee:tutee})
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route DELETE /api/tutees/:tutee_id/tutors/:tutor_id
// @desc Remove a favourite tutor for tutee
// @access Private
router.delete("/:tutee_id/tutors/:tutor_id", auth, async (req, res) => {
    try{
        Tutee.findByIdAndUpdate(
            req.params.tutee_id,
            { $pull: { favouriteTutors: req.params.tutor_id }},
            function(err, data){
                console.log("removed")    
            }
        );

        res.json({msg:"removed tutor"})
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/tutees/sessions/current/tutee_id
// @desc Get all current session requests for tutee
// @access Private
router.get('/sessions/current/:tutee_id', auth, async (req, res) => {
    try {
        let tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }
        const requests = await TutoringSessionRequest.aggregate([
            {
                $match: {tuteeId : mongoose.Types.ObjectId(req.params.tutee_id)}
            },
            {
                $lookup: {
                    from: "users",
                    localField: "tutorId",
                    foreignField: "tutorId",
                    as: "userInfo"
                }
            }, {$unwind :"$userInfo"}])
        if(!requests) {
            return res.status(404).json({ errors: [{ msg: 'Could not find any completed sessions for user!'}]})
        }

        res.json(requests)


    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/tutees/sessions/completed/tutee_id
// @desc Get all completed sessions for tutee
// @access Private
router.get('/sessions/completed/:tutee_id', auth, async (req, res) => {
    try {
        let tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }

        const sessions = await TutoringSession.find({ tuteeId: req.params.tutee_id, completed: true})

        if(!sessions) {
            return res.status(404).json({ errors: [{ msg: 'Could not find any completed sessions for user!'}]})
        }

        res.json(sessions)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

module.exports = router