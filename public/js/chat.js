const socket = io()

// Elements
const $messageForm = document.querySelector("#frm")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocationButton = document.querySelector("#sendLocation")
const $messages = document.querySelector("#messages")
const $sidebar = document.querySelector("#sidebar")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // new Message Element
    const $newMessage = $messages.lastElementChild
    
    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offSetHeight + newMessageMargin
    //console.log(newMessageStyles)
    // Visible Height
    const visibleHeight = $messages.offSetHeight
    // Height of Message Container
    const containerHeight = $messages.scrollHeight
    //How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight
    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
    $messages.scrollTop = $messages.scrollHeight
}

socket.on("login", () => {
    location.href = '/'
})

socket.on('message', (msg) => {
    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})
socket.on('locationMessage', location => {
    const html = Mustache.render(locationTemplate,{
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})
socket.on('roomData', ({room,users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if($messageFormInput.value == '') return alert("Please Write Message to Send")
    //let message = e.target.elements.message.value;
    // disable
    $messageFormButton.setAttribute('disabled','disabled')

    socket.emit('sendMessage', $messageFormInput.value , (error) => {
        // enable
        $messageFormButton.removeAttribute('disabled','disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()        

        if(error) console.log(error)
        else console.log("Delivered")
    })
})
$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported')
    }

    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        let LocationObj = { 
            latitude:position.coords.latitude, 
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation', LocationObj , () => {
            $sendLocationButton.removeAttribute('disabled','disabled')
            //console.log("Location Shared")
        })
    })  
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }      
})