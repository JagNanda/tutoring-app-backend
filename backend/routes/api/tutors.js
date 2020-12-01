// Author: Ryan Haire
// This is for the tutor profile endpoints

const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const { check, validationResult } = require('express-validator')

const Tutor = require('../../models/Tutor')
const Tutee = require('../../models/Tutee')
const User = require('../../models/User')
const Review = require('../../models/Review')
const Post = require('../../models/Post')
const TutoringSessionRequest = require('../../models/TutoringSessionRequest')

const auth = require('../../middleware/auth')
const admin = require('../../middleware/admin')
const TutoringSession = require('../../models/TutoringSession')
const mongoose = require('mongoose')

// @route GET /api/tutors/:tutor_id
// @desc Get a single tutor 
// @access Public
router.get("/tutor/:tutor_id", async (req,res) => {
    try{
        let tutor = await Tutor.findById(req.params.tutor_id)
        let user = await User.find({"tutorId": req.params.tutor_id})
        if(!tutor){
            return res.status(404).json({ errors: [{ msg: 'No tutor found!' }] });
        }
        if(!user){
            return res.status(404).json({ errors: [{ msg: 'No tutor found!' }] });
        }
        res.json({tutor: tutor,user: user})
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] })
    }
})


// @route GET /api/tutors/all
// @desc Get all tutors 
// @access Public
router.get('/all', async (req, res) => {
    try {
        const tutors = await Tutor.aggregate([{
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "tutorId",
                as: "userInfo"
            }
        }, { $unwind: "$userInfo"}])

        if(!tutors) {
            return res.status(404).json({ errors: [{ msg: 'No tutors found!' }] })
        }

        res.json(tutors)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] })
    }
})


// @route GET /api/tutors/favourite/:tutor_id
// @desc Get all favourited posts
// @access Private
router.get('/favourite/:tutor_id', auth, async (req,res) => {
    try {
        let tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile!'}]})
        }
        const favPosts = await Post.find().where('_id').in(tutor.favouritePosts).exec()
        if(!favPosts){
            
            return res.status(404).json({ errors: [{ msg: 'No favorited posts found!' }] });
        }
        res.json(favPosts)
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/tutors/all/:subjects
// @desc Get all tutors that teach in particular subjects
// @access Public
router.get('/all/:subjects', async (req, res) => {
    let subjects = req.params.subjects.split(',').map(sub => sub.trim())

    try {
        const tutors = await Tutor.aggregate([
            {
              $match: { "subjects": { $in: subjects }}  
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
            return res.status(404).json({ errors: [{ msg: 'No tutors found in these subjects!' }]})
        }

        res.json(tutors)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route POST /api/tutors/:user_id
// @desc Create a tutor profile for a user
// @access Private
router.post('/:user_id',[[
    check('bio', 'Please include a bio.').not().isEmpty(),
    check('hourlyRate', 'Please include a hourly rate.').not().isEmpty()    
], auth], async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        let user = await User.findById(req.params.user_id)

        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find user!' }] });
        }

        const { 
            transcripts, 
            bio, 
            hourlyRate, 
            subjects, 
            languages, 
            tutorExpertise,
            skillLevel,
            headline,
            languageProficiency,
            city,
            province
        } = req.body;

        const tutorFields = {}
        tutorFields.user = req.params.user_id
        if(transcripts) tutorFields.transcripts = transcripts
        if(bio) tutorFields.bio = bio
        if(headline) tutorFields.headline = headline
        if(hourlyRate) tutorFields.hourlyRate = hourlyRate
        if(subjects) tutorFields.subjects = subjects
        if(languages) tutorFields.languages = languages
        if(skillLevel) tutorFields.skillLevel = skillLevel
        if(tutorExpertise) tutorFields.tutorExpertise = tutorExpertise
        if(languageProficiency) tutorFields.languageProficiency = languageProficiency
        if(city) tutorFields.city = city
        if(province) tutorFields.province = province
        let tutor = new Tutor(tutorFields)

        await tutor.save()

        user = await User.findByIdAndUpdate(req.params.user_id, { tutorId: tutor._id}, { new: true })

        res.json({ user: user, tutorInfo: tutor})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route PUT /api/tutors/:user_id
// @desc Update a tutor profile by user id
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

        let tutor = await Tutor.findById(user.tutorId)

        if(!tutor) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutor profile for user!'}]})
        }

        const { 
            transcripts, 
            bio, 
            hourlyRate, 
            profileImage, 
            subjects, 
            languages, 
            isAvailable
        } = req.body;

        const tutorFields = {}
        tutorFields.user = req.params.user_id
        if(transcripts) tutorFields.transcripts = transcripts
        if(bio) tutorFields.bio = bio
        if(hourlyRate) tutorFields.hourlyRate = hourlyRate
        if(profileImage) tutorFields.profileImage = profileImage
        if(subjects) tutorFields.subjects = subjects
        if(languages) tutorFields.languages = languages
        if(isAvailable) tutorFields.isAvailable = isAvailable
        if(!isAvailable) tutorFields.isAvailable = isAvailable
    
        tutor = await Tutor.findByIdAndUpdate(tutor._id, tutorFields, { new: true })

        res.json({ user: user, tutorInfo: tutor})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route DELETE /api/tutors/:user_id
// @desc Delete a tutor profile
// @access Private
router.delete('/:user_id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user) {
            return res.status(404).json({ errors: [{ msg: 'User was not found!' }] });
        }

        let tutor = await Tutor.findById(user.tutorId)

        if(!tutor) {
            return res.status(404).json({ errors: [{ msg: 'Tutor profile was not found for user!' }] });
        }

        await Tutor.findByIdAndDelete(tutor._id)

        res.json({ errors: [{ msg: 'Tutor profile deleted!' }] })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})


// @route POST /api/tutors/:user_id/:tutor_user_id/
// @desc Create a review for a tutor profile
// @access Private
router.post('/reviews/:user_id/:tutor_user_id', [[
    check('recommend', 'Please include if you recommend').not().isEmpty(),    
    check('description', 'Please include a description').not().isEmpty(),  
    check('rating', 'Please include a rating').not().isEmpty(),  
],auth], async(req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // find tutee user
    let user = await User.findById(req.params.user_id)
    if (!user) {
        return res.status(404).json({ errors: [ { msg: 'Could not find user!' } ] });
    }

    // find tutee profile
    let tutee = await Tutee.findById(user.tuteeId)
    if(!tutee) {
        return res.status(404).json({ errors: [ { msg: 'Could not find tutee profile!'} ] })
    }

    // find tutor user
    let tutorUser = await User.findById(req.params.tutor_user_id)
    if (!tutorUser) {
        return res.status(404).json({ errors: [ { msg: 'Could not find tutor!' } ] });
    }

    // find tutor profile
    let tutor = await Tutor.findById(tutorUser.tutorId)
    if(!tutor) {
        return res.status(404).json({ errors: [ { msg: 'Could not find tutor profile!'} ] })
    }

    try {
        const {recommend, description, rating} = req.body

        const reviewFields = {}
        reviewFields.tuteeId = req.params.tutee_id
        if(recommend !== null) reviewFields.recommend = recommend
        if(description) reviewFields.description = descriptiom
        if(rating) reviewFields.rating = rating

        let review = new Review(reviewFields)

        tutor.reviews.push(review)
        tutee.reviews.push(review)

        await tutor.save()
        await tutee.save()

        res.json({tutee: tutee, review: review})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [ { msg: 'Server Error' } ] });
    }
})

// @route PUT /api/tutors/:user_id/:tutor_user_id/:review_id
// @desc Update a review for a tutor profile
// @access Private
router.put('/reviews/:user_id/:tutor_user_id/:review_id', [[
    check('recommend', 'Please include if you recommend').not().isEmpty(),    
    check('description', 'Please include a description').not().isEmpty(),  
    check('rating', 'Please include a rating').not().isEmpty(),  
],auth], async(req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // find tutee user
    let user = await User.findById(req.params.user_id)
    if (!user) {
        return res.status(404).json({ errors: [ { msg: 'Could not find user!' } ] });
    }

    // find tutee profile
    let tutee = await Tutee.findById(user.tuteeId)
    if(!tutee) {
        return res.status(404).json({ errors: [ { msg: 'Could not find tutee profile!' } ] })
    }

    // find tutor user
    let tutorUser = await User.findById(req.params.tutor_user_id)
    if (!tutorUser) {
        return res.status(404).json({ errors: [ { msg: 'Could not find tutor!' } ] });
    }

    // find tutor profile
    let tutor = await Tutor.findById(tutorUser.tutorId)
    if(!tutor) {
        return res.status(404).json({ errors: [ { msg: 'Could not find tutor profile!'} ] })
    }

    try {
        const {recommend, description, rating} = req.body

        const reviewFields = {}
        reviewFields.tuteeId = req.params.tutee_id
        if(recommend !== null) reviewFields.recommend = recommend
        if(description) reviewFields.description = descriptiom
        if(rating) reviewFields.rating = rating

        let review = tutee.reviews.findById(req.params.review_id)

        if(!review) {
            return res.status(404).json({ errors: [ { msg: 'Could not find review!' } ] })
        }

        review = await tutee.reviews.findByIdAndUpdate(req.params.review_id, reviewFields)
        review = await tutor.reviews.findByIdAndUpdate(req.params.review_id, reviewFields)

        res.json({tutee: tutee, review: review})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route POST /api/tutors/request/:tutee_id/:tutor_id
// @desc Create a outgoing request for tutee and incoming request for tutor
// @access Private
router.post('/request/:tutee_id/:tutor_id', [[
    check('subject', 'Please include a subject!').not().isEmpty(),
    check('details', 'Please include details!').not().isEmpty(),
    check('levelOfEducation', 'Please include level of education!').not().isEmpty(),
    check('courseName', 'Please include courseName!').not().isEmpty(),
    check('date', 'Please include a date!').not().isEmpty()
], auth], async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        let user = await User.find({tuteeId: req.params.tutee_id})
        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee!' }] });
        }

        let tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }

        let tutorUser = await User.find({tutorId: req.params.tutor_id})
        if (!tutorUser) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutor!' }] });
        }

        let tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutor profile for user!'}]})
        }

        const { 
            subject,
            details,
            levelOfEducation,
            courseName,
            date,
            duration,
            accepted
        } = req.body;

        const requestFields = {}
        requestFields.tuteeId = req.params.tutee_id
        requestFields.tutorId = req.params.tutor_id
        if(subject) requestFields.subject = subject
        if(details) requestFields.details = details
        if(levelOfEducation) requestFields.levelOfEducation = levelOfEducation
        if(courseName) requestFields.courseName = courseName
        if(date) requestFields.date = date
        if(duration) requestFields.duration = duration
        if(accepted) requestFields.isAvailable = accepted
        if(!accepted) requestFields.accepted = accepted

        let request = new TutoringSessionRequest(requestFields)

        await request.save()
        tutor.incomingRequests.push(request._id)
        await tutor.save()
    
        tutee.outgoingRequests.push(request._id)
        tutee.save()

        res.json({ user: user, tutee: tutee, tutor: tutor, request: request})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route PUT /api/tutors/request/:tutee_id/:tutor_id/:request_id
// @desc Update a outgoing request for tutee and incoming request for tutor
// @access Private
router.put('/request/:tutee_id/:tutor_id/:request_id', [[
    check('subject', 'Please include a subject!').not().isEmpty(),
    check('details', 'Please include details!').not().isEmpty(),
    check('levelOfEducation', 'Please include level of education!').not().isEmpty(),
    check('courseName', 'Please include courseName!').not().isEmpty(),
    check('date', 'Please include a date!').not().isEmpty()
], auth], async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {

        let user = await User.find({tuteeId: req.params.tutee_id})
        if (!user) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee!' }] });
        }

        let tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }

        let tutorUser = await User.find({tutorId: req.params.tutor_id})
        if (!tutorUser) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutor!' }] });
        }

        let tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutor profile for user!'}]})
        }

        const { 
            subject,
            details,
            levelOfEducation,
            courseName,
            date,
            accepted
        } = req.body;

        const requestFields = {}
        requestFields.tuteeId = req.params.tutee_id
        if(subject) requestFields.subject = subject
        if(details) requestFields.details = details
        if(levelOfEducation) requestFields.levelOfEducation = levelOfEducation
        if(courseName) requestFields.courseName = courseName
        if(date) requestFields.date = date
        if(accepted) requestFields.accepted = accepted
        if(!accepted) requestFields.accepted = accepted

        let request = tutee.outgoingRequests.findById(req.params.request_id)

        if(!request) {
            return res.status(404).json({ errors: [ { msg: 'Could not find request!' } ] })
        }

        request = await tutee.requests.findByIdAndUpdate(req.params.request_id, requestFields)
        request = await tutor.reviews.findByIdAndUpdate(req.params.request_id, requestFields)

        res.json({user: user, tutee: tutee, tutor: tutor, request: request})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})


// @route GET /api/tutors/sessions/all/:tutor_id
// @desc Get all completed sessions for a tutor
// @access Private
router.get('/sessions/all/:tutor_id', auth, async (req, res) => {
    try {
        let tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutor profile for user!'}]})
        }

        const sessions = await TutoringSession.find({ tutorId: req.params.tutor_id, completed: true})

        if(!sessions) {
            return res.status(404).json({ errors: [{ msg: 'Could not find any completed sessions for user!'}]})
        }

        res.json(sessions)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/tutors/sessions/requests/tutor_id
// @desc Get all incoming session requests for student
// @access Private
router.get('/sessions/requests/:tutor_id', auth, async (req, res) => {
    try {
        let tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }
        const reqs = await TutoringSessionRequest.find({"tutorId" : req.params.tutor_id})
        console.log(reqs)
        const requests = await TutoringSessionRequest.aggregate([
            {
                $match: {tutorId : mongoose.Types.ObjectId(req.params.tutor_id)}
            },
            {
                $lookup: {
                    from: "users",
                    localField: "tuteeId",
                    foreignField: "tuteeId",
                    as: "userInfo"
                }
            }, {$unwind :"$userInfo"}])
        console.log(requests)
        if(!requests) {
            return res.status(404).json({ errors: [{ msg: 'Could not find any completed sessions for user!'}]})
        }

        res.json(requests)


    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/tutees/sessions/current/tutor_id
// @desc Get all current sessions for tutor
// @access Private
router.get('/sessions/current/:tutor_id', auth, async (req, res) => {
    try {
        let tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutor profile for user!'}]})
        }

        const sessions = await TutoringSession.find({ tutorId: req.params.tutor_id, completed: false})

        if(!sessions) {
            return res.status(404).json({ errors: [{ msg: 'Could not find any completed sessions for user!'}]})
        }

        res.json(sessions)
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route PUT /api/tutors/post/:post_id/:tutor_id
// @desc Add a favourite post to tutor
// @access Private
router.put('/post/:post_id/:tutor_id', auth, async (req, res) =>{
    try {
        
        const tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({ errors: [ { msg: 'Could not find tutor profile!' } ] })
        }

        const user = await User.find({ tutorId: req.params.tutor_id})
        if(!user) {
            return res.status(404).json({ errors: [ { msg: 'Could not find user!' } ] })
        }

        const post = await Post.findById(req.params.post_id)
        if(!post) {
            return res.status(404).json({ errors: [ { msg: 'Could not find post!' } ] })
        }

        tutor.favouritePosts.push(post)
        await tutor.save()

        res.json({post: post, tutor: tutor, user: user})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route DELETE /api/tutors/post/:post_id/:tutor_id
// @desc Delete a favourite post from tutor
// @access Private
router.delete('/post/:post_id/:tutor_id', auth, async (req, res) =>{
    try {
        
        const tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({ errors: [ { msg: 'Could not find tutor profile!' } ] })
        }

        const user = await User.find({ tutorId: req.params.tutor_id})
        if(!user) {
            return res.status(404).json({ errors: [ { msg: 'Could not find user!' } ] })
        }

        const post = await Post.findById(req.params.post_id)
        if(!post) {
            return res.status(404).json({ errors: [ { msg: 'Could not find post!' } ] })
        }
        
        await tutor.favouritePosts.pull({_id: req.params.post_id})
        tutor.save()

        res.json({ msg: 'Successfully deleted post from favourite posts!'})
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/tutors/session/all/:tutor_id
// @desc Update request to accept outgoing request to tutee and incoming request to tutor
// @access Private
router.get('/request/accept/:request_id/:tutor_id/:tutee_id', auth, async (req, res) => {
    try {
        let studentUser = await User.find({tuteeId: req.params.tutee_id})
        if (!studentUser) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee!' }] });
        }

        let tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutee profile for user!'}]})
        }

        let tutorUser = await User.find({tutorId: req.params.tutor_id})
        if (!tutorUser) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutor!' }] });
        }

        let tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({ errors: [{ msg: 'Could not find tutor profile for user!'}]})
        }

        let request = await TutoringSessionRequest.findById(req.params.request_id)
        if(!request) {
            return res.status(404).json({ errors: [{ msg: 'Could not find session request!'}]})
        }

        const { 
            accepted
        } = req.body;

        const requestFields = {}
        if(accepted) requestFields.accepted = accepted
        if(!accepted) requestFields.accepted = accepted

        request = await TutoringSessionRequest.findByIdAndUpdate(req.params.request_id, requestFields)
        
        const sessionFields = {}
        sessionFields.tutee_id = request.tutee_id
        sessionFields.tutor_id = request.tutor_id
        sessionFields.hourlyRate = tutor.hourlyRate
        sessionFields.sessionDuration = 
        sessionFields.date = request.date
        sessionFields.request = request._id
        sessionFields.completed = false

        let session = new TutoringSession(sessionFields)

        await session.save()

        res.json({session: session, tutorUser: tutorUser, tutee: tutee, studentUser: studentUser, tutor: tutor})

    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

module.exports = router