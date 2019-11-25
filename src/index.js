const express = require('express')
const http = require('http')
const path = require('path')
const Filter = require('bad-words')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const port = process.env.PORT || 8080
const pathdir = path.join(__dirname,'../public')

app.use(express.static(pathdir))

const server = app.listen(port, () => {
    console.log("App is running on PORT 8080")
})

socketio.listen(server);
const io = socketio(server)
io.on('connection', (socket) => {

    socket.on('sendLocation', (coords, callback) => {
        let url = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
        const user = getUser(socket.id)
        
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, url))
        callback()
    })

    socket.on('join', ({username,room}, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        
        if(error) return callback(error)

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome!') )
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`) )
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()

        // ... is spread operator that spreads object into its variables
        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit --> emit event to everybody in room
        // socket.broadcast.to.emit --> send event to everybody in room expect to specific client
    })

    socket.on('sendMessage', (msg, callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)
        
        if(!user) return socket.emit("login")

        if(filter.isProfane(msg)) return callback('Profanity is not Allowed!')
        
        io.to(user.room).emit('message', generateMessage(user.username,msg) )
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        
        if(!user) return socket.emit("login")

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left!`) )
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
    // socket.emit('countUpdated',count) // emit to only client that has send message
    // io.emit('countUpdated',count)   // emit to all connected clients
})
