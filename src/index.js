const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const Filter = require('bad-words');
const { genMessage, genLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app); //express does it behind the scenes, but here we are doing it because 
// socketio requires to pass http server
const io = socketio(server);
const PORT = process.env.port || 3000;

const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));


// let count = 0;

io.on('connection', (socket) => {
    //socket is an obj and it contains info about the new connection. https://socket.io/docs/server-api/#Event-%E2%80%98connection%E2%80%99
    console.log('New Web socket connection');

    // socket.emit('countUpdated', count); // emmiting to a particular connection

    // socket.on('increment', () => {
    //     count++;
    //     //socket.emit('countUpdated', count); // problem with socket.emit is that it replies to the particular client/connection not to all connections
    //     io.emit('countUpdated', count); //emits to every single connection
    // })


    socket.on('join', (options, callback) => {
        //socket.id is a property
        const { error, user } = addUser({ id: socket.id, ...options });

        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', genMessage('ChatApp', 'Welcome :) :p'));

        // when we broadcast a event for a particular client it means all other connected clients will get the message, except the current client
        socket.broadcast.to(user.room).emit('message', genMessage('ChatApp',`${user.username} has joined !!!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback();
    })

    //callback is for acknowledgement, that we requested from client side
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        
        const filter = new Filter();

        if(filter.isProfane(message)) {
            return callback('Profanity not allowed');
        }

        io.to(user.room).emit('message', genMessage(user.username, message));
        callback();
    });

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', genLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    })

    //built in event for user disconection, disconnect
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', genMessage(`${user.username} has left !!!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });
})

server.listen(PORT, () => {
    console.log(`Server is up on port :) ${PORT}`);
})