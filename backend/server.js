// Author: Ryan Haire
// This is for the server, it handles routes to endpoints, 
// middlewares like cors, database connection

const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()

connectDB()

app.use(cors())

// Init middleware
app.use(express.json({ extended: false }))

// test api route
app.get('/', (req, res) => res.send('API running'))

// Define routes
app.use('/api/users', require('./routes/api/users'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/tutors', require('./routes/api/tutors'))
app.use('/api/tutees', require('./routes/api/tutees'))
app.use('/api/chatroom', require('./routes/api/chatRooms'))

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
