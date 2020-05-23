// as we've loaded socket.io.js first , we have access to io()
const socket = io();

// socket.on('countUpdated', (count) => {
//     console.log('Count has been updated', count);
// });

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('clicked');
//     socket.emit('increment');
// });

//elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('#chat');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sideBar = document.querySelector('#sidebar');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild;

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage); //styles.. getComputedStyle() is provided by browser we pass an element
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible Height
    const visibleHeight = $messages.offsetHeight; 

    //Height of messages container
    const containerHeight = $messages.scrollHeight;

    //How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        //we are at the botton before adding new message
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('message', (msg) => {
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('HH:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');
    const chatText = e.target.elements.message.value; //targeting the val of textarea by its name attribute which is message
    // on emit we can pass a third argument which is an acknow ledgement that the message is delivered properly
    // message is the property which we sent as args in the callback func from index.js
    socket.emit('sendMessage', chatText, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error) {
            return console.log(error);
        }

        console.log('Message delivered');
    });
});

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }
    $sendLocationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        const { coords: { latitude, longitude } } = position;
        socket.emit('sendLocation', {
            latitude,
            longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location shared!!');
        });
    })
});

socket.on('locationMessage', (locationMsg) => {
    const html = Mustache.render(locationTemplate, {
        username: locationMsg.username,
        url: locationMsg.url,
        createdAt: moment(locationMsg.createdAt).format('HH:mm')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sideBar.innerHTML = html;
}) 

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        location.href = '/'
    }
});