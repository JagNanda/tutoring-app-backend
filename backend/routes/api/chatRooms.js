// Author: Ryan Haire
// This is for the tutor profile endpoints

const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const { check, validationResult } = require('express-validator')

const User = require('../../models/User')
const Tutor = require('../../models/Tutor')
const Tutee = require('../../models/Tutee')
const ChatRoom = require('../../models/ChatRoom')
const Message = require('../../models/Message')

const auth = require('../../middleware/auth')



// @route GET /api/chatroom/tutor/:tutor_id
// @desc Get all chatrooms for a tutor 
// @access Private
router.get('/tutor/:tutor_id', auth, async (req, res) => {
    try {
        const tutor = await Tutor.aggregate([
            { $match: { "_id": { "$in": [mongoose.Types.ObjectId(req.params.tutor_id)]}}},
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "tutorId",
                    as: "userInfo"
                }
            },
            { $unwind: "$userInfo"}
        ])
        if(!tutor) {
            return res.status(404).json({errors: [{ msg: 'No tutor profile found!'}]})
        }

        //const user = User.find({tutorId: req.params.tutor_id})
        // if(!user) {
        //     return res.status(404).json({ errors: [{ msg: 'No user found!' } ]})
        // }

        const chatRooms = await ChatRoom.find({ tutorId: req.params.tutor_id}).sort({date: 'descending'})
        if(!chatRooms) {
            return res.status(404).json({ errors: [ { msg: 'No chat rooms found!' } ] })
        }

        let tuteesInfo = await Promise.all(chatRooms.map(async (i) => {
           // console.log(i['tuteeId'])
            let tutee = await Tutee.aggregate([
                { $match: { "_id": { "$in": [mongoose.Types.ObjectId(i['tuteeId'])]}}},
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "tuteeId",
                        as: "userInfo"
                    }
                },
                { $unwind: "$userInfo"}
            ])
            //console.log(tutee)
            return tutee
        }))
        console.log(tuteesInfo)

        res.json({chatRooms: chatRooms, tutor: tutor, tuteesInfo: tuteesInfo})
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/chatroom/tutee/:tutee_id
// @desc Get all chatrooms for a tutee 
// @access Private
router.get('/tutee/:tutee_id', auth, async (req, res) => {
    try {
        const tutee = await Tutee.aggregate([
            { $match: { "_id": { "$in": [mongoose.Types.ObjectId(req.params.tutee_id)]}}},
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "tuteeId",
                    as: "userInfo"
                }
            },
            { $unwind: "$userInfo"}
        ])
        if(!tutee) {
            return res.status(404).json({errors: [{ msg: 'No tutee profile found!'}]})
        }

        //const user = User.find({tutorId: req.params.tutor_id})
        // if(!user) {
        //     return res.status(404).json({ errors: [{ msg: 'No user found!' } ]})
        // }

        const chatRooms = await ChatRoom.find({ tuteeId: req.params.tutee_id}).sort({date: 'descending'})
        if(!chatRooms) {
            return res.status(404).json({ errors: [ { msg: 'No chat rooms found!' } ] })
        }

        let tutorsInfo = await Promise.all(chatRooms.map(async (i) => {
           // console.log(i['tuteeId'])
            let tutor = await Tutor.aggregate([
                { $match: { "_id": { "$in": [mongoose.Types.ObjectId(i['tutorId'])]}}},
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "tutorId",
                        as: "userInfo"
                    }
                },
                { $unwind: "$userInfo"}
            ])
            //console.log(tutee)
            return tutor
        }))
        console.log(tutorsInfo)

        res.json({chatRooms: chatRooms, tutee: tutee, tutorsInfo: tutorsInfo})
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route POST /api/chatroom/:tutor_id/:tutee_id
// @desc Create a chat room
// @access Private
router.post('/:tutor_id/:tutee_id', auth, async (req, res) => {
    try {
        const tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({errors: [{ msg: 'No tutor profile found!'}]})
        }

        const tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({errors: [{ msg: 'No tutee profile found!'}]})
        }

        const chatRoomFields = {}
        chatRoomFields.tuteeId = req.params.tutee_id
        chatRoomFields.tutorId = req.params.tutor_id
        chatRoomFields.date = Date.now()

        // create chatroom object and save to chatroom, tutor, and tutee
        let chatroom = new ChatRoom(chatRoomFields)

        await chatroom.save()

        tutor.chatRooms.push(chatroom)
        tutee.chatRooms.push(chatroom)

        await tutor.save()
        await tutee.save()

        res.json(chatroom)
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route GET /api/chatroom/:chatroom_id
// @desc Get chatroom messages by id
// @access Private
router.get('/:chatroom_id', auth, async (req, res) => {
    try {
        const chatRoom = await ChatRoom.findById(req.params.chatroom_id)
        if(!chatRoom) {
            return res.status(404).json({errors: [ { msg: 'No chat room found!' } ]})
        }

        res.json(chatRoom)
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// TODO: CHECK IF CHATROOM EXISTS ON OTHER PERSONS CHAT ROOMS LIST IF
// NOT THEN ADD THE CHATROOM TO THE OTHER PERSON CHATROOM LIST
// @route PUT /api/chatroom/:chatroom_id/:tutor_id
// @desc Add message by tutor to chatroom
// @access Private
router.put('/:chatroom_id/:tutor_id', [[
    check('message', 'Message is required!').not().isEmpty()
],auth], async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const tutor = await Tutor.findById(req.params.tutor_id)
        if(!tutor) {
            return res.status(404).json({errors: [ { msg: 'No tutor profile found!' } ]})
        }

        const chatRoom = await ChatRoom.findById(req.params.chatroom_id)
        if(!chatRoom) {
            return res.status(404).json({errors: [ { msg: 'No chat room found!' } ]})
        }

        const { message } = req.body

        const messageFields = {}
        messageFields.tutorId = req.params.tutor_id
        if(message) messageFields.message = message

        let msg = new Message(messageFields)

        chatRoom.messages.push(msg)

        await chatRoom.save()

        res.json({ tutor: tutor, message: msg })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})

// @route PUT /api/chatroom/:chatroom_id/:tutee_id
// @desc Add message by tutee to chatroom 
// @access Private
router.put('/tutee/:chatroom_id/:tutee_id', [[
    check('message', 'Message is required!').not().isEmpty()
],auth], async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const tutee = await Tutee.findById(req.params.tutee_id)
        if(!tutee) {
            return res.status(404).json({errors: [ { msg: 'No tutee profile found!' } ]})
        }

        const chatRoom = await ChatRoom.findById(req.params.chatroom_id)
        if(!chatRoom) {
            return res.status(404).json({errors: [ { msg: 'No chat room found!' } ]})
        }

        const { message } = req.body

        const messageFields = {}
        messageFields.tuteeId = req.params.tutee_id
        if(message) messageFields.message = message

        let msg = new Message(messageFields)

        chatRoom.messages.push(msg)

        await chatRoom.save()

        res.json({ tutee: tutee, message: msg })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ errors: [{ msg: 'Server Error' }] });
    }
})


// **WE DONT NEED THIS, KEEP JUST IN CASE
// @route GET /api/chatroom/message/:chatroom_id/:message_id
// @desc Edit message in chatroom
// @access Private
router.put('/message/:chatroom_id/:message_id', auth, async (req, res) => {

})

// **WE DONT NEED THIS, KEEP JUST IN CASE
// @route GET /api/chatroom/message/:chatroom_id/:message_id
// @desc Delete message in chatroom
// @access Private
router.delete('/message/:chatroom_id/:message_id', auth, async (req, res) => {

})

// @route GET /api/chatroom/:chatroom_id
// @desc Delete chatroom
// @access Private
router.delete('/:chatroom_id', auth, async (req, res) => {
    try {
        let chatRoom = await ChatRoom.findById(req.params.chatroom_id)
        if(!chatRoom) {
            return res.status(404).json({errors: [ { msg: 'No chat room found!' } ]})
        }

        await ChatRoom.findByIdAndDelete(req.params.chatroom_id)

        res.json({ msg: 'Chat room was deleted!'})
    } catch (error) {
        
    }
})

module.exports = router