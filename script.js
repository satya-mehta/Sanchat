const toggle = document.getElementById('darkModeToggle');
const body = document.body;

toggle.checked = true; //by default dark mode
body.classList.add('dark-mode');

// Dark-mode persistence
if (localStorage.getItem('dark-mode') === 'true') {
  body.classList.add('dark-mode');
  toggle.checked = true;
}

toggle.addEventListener('change', () => {
  body.classList.toggle('dark-mode');
  localStorage.setItem('dark-mode', body.classList.contains('dark-mode'));
});

// Live clock
function updateTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isPM = hours >= 12;

  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const ampm = isPM ? 'PM' : 'AM';

  const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
  document.getElementById('timeDisplay').textContent = timeString;
}

updateTime();
setInterval(updateTime, 30000);

// Scroll helper
function scrollChatToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // also scroll the last message into view, in case flex gaps cause an off-by-one
  const msgs = chatMessages.querySelectorAll('.message');
  if (msgs.length) {
    msgs[msgs.length - 1].scrollIntoView({ behavior: 'auto' });
  }
}

function openChat(){
  document.getElementById('chat-container').classList.add('hidden');
  document.getElementById('chat-page').classList.remove('hidden');
  document.getElementById('header').classList.add('hidden');
  document.getElementById('searchBox').classList.add('hidden');
  document.getElementById('developer-flex').classList.add('hidden');

  // scroll once when opening the chat
  scrollChatToBottom();
}

function exitChat(){
  document.getElementById('chat-container').classList.remove('hidden');
  document.getElementById('chat-page').classList.add('hidden');
  document.getElementById('header').classList.remove('hidden');
  document.getElementById('searchBox').classList.remove('hidden');
  document.getElementById('developer-flex').classList.remove('hidden');
}

// Chat open/close
document.getElementById('amigo').addEventListener('click', () => openChat());

document.getElementById('back-btn').addEventListener('click', () => exitChat());

// Input & keyboard UX
const messageInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');

// On first focus, any click, or viewport resize, re-scroll to bottom.
['focus', 'click'].forEach(evt => {
  messageInput.addEventListener(evt, () => {
    setTimeout(scrollChatToBottom, 300);
  });
});
window.addEventListener('resize', () => {
  setTimeout(scrollChatToBottom, 300);
});

// Scroll on initial page load too
window.addEventListener('load', scrollChatToBottom);

const popup = document.getElementById('roomForm');
document.getElementById('temp-chat').addEventListener('click', () => {
    popup.classList.add('visible');
});

document.getElementById('cancel').addEventListener('click', () => {
    popup.classList.remove('visible');
});

//-------------------login page script------------------------------

const switchers = [...document.querySelectorAll('.switcher')]

switchers.forEach(item => {
	item.addEventListener('click', function() {
		switchers.forEach(item => item.parentElement.classList.remove('is-active'))
		this.parentElement.classList.add('is-active')
	})
});

document.getElementById("login-username").addEventListener("input", (event) => {
  const user = event.target.value;
  console.log("Input: ", user);
  document.querySelector(".section-title").innerHTML = "Welcome back " + user;
});

// document.getElementById("signup-username").addEventListener("input", (event) => {
//   const user = event.target.value;
//   console.log("Input: ", user);
//   document.querySelector(".section-title").innerHTML = "Welcome back " + user;
// });


document.querySelector(".switcher-signup").addEventListener("click", () => {
    const sectionTitle = document.querySelector(".section-title");
    const newUserMsg = document.getElementById("new-user-msg");

    // Swap text content
    newUserMsg.innerText = "Perfect, Go ahead";
    sectionTitle.innerText = "Belong to us? Login";

    // Add a class to indicate swap state
    sectionTitle.classList.add("swapped");
    newUserMsg.classList.add("swapped-title");

    // Smooth position transitions
    sectionTitle.style.transform = "translateY(40px)";
    newUserMsg.style.transform = "translateY(-20px)";
});

document.querySelector(".switcher-login").addEventListener("click", () => {
    const sectionTitle = document.querySelector(".section-title");
    const newUserMsg = document.getElementById("new-user-msg");

    // Restore original text content
    newUserMsg.innerText = "New to us? Signup instead";
    sectionTitle.innerText = "Welcome back";

    // Remove the swapped class to revert styling
    sectionTitle.classList.remove("swapped");
    newUserMsg.classList.remove("swapped-title");

    // Reset transitions
    sectionTitle.style.transform = "translateY(0px)";
    newUserMsg.style.transform = "translateY(0px)";
});

//----------------login-backend-logic--------------------

const API_URL = "https://sanchat.onrender.com/api/auth"; // Change this if deployed elsewhere

// Login handler
document.querySelector('.form-login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  document.querySelector('.loader').style.display = "block";

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);

      // Hide auth section, show dashboard
      document.querySelector('.forms-section').style.display = "none";
      document.querySelector('.blur').style.display = "none";
      document.querySelector('.loader').style.display = "none";
    } else {
      document.querySelector('.loader').style.display = "none";
      alert(data.message || "Login failed.");
    }
  } catch (err) {
    alert("Something went wrong.");
    console.error(err);
  }
});

// Signup handler
document.querySelector('.form-signup').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;

  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    console.log(res);

    if (res.ok) {
      alert("Signup successful! Please log in.");
      // Optionally switch form here
    } else {
      alert(data.message || "Signup failed.");
    }
  } catch (err) {
    alert("Something went wrong.");
    console.error(err);
  }
});

//to auto login when token available, in case of refresh or reload
window.onload = () => {
  const token = localStorage.getItem("token");
  if (token) {
    document.querySelector('.forms-section').style.display = "none";
    document.querySelector('.blur').style.display = "none";
  }
};

//logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  location.reload();
}

//------------------temporary-chats-script---------------------------

const cancelBtn = document.getElementById('cancel');
const buttonGroupButtons = document.querySelectorAll('.button-group button');
const passwordContainer = document.getElementById('passwordContainer');
const secretKeyInput = document.getElementById('secretKey');
const createRoomBtn = popup.querySelector('button[type="submit"]');

let selectedRoomType = 'open'; // default

// Toggle room type buttons
buttonGroupButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active from all buttons
    buttonGroupButtons.forEach(b => b.classList.remove('active'));

    // Set active on clicked button
    btn.classList.add('active');

    // Update selectedRoomType
    selectedRoomType = btn.dataset.room;

    // Show or hide secret key input based on room type
    if (selectedRoomType === 'protected') {
      passwordContainer.classList.remove('hidden');
    } else {
      passwordContainer.classList.add('hidden');
      secretKeyInput.value = ''; // clear input
    }
  });
});

// Cancel button hides the popup
cancelBtn.addEventListener('click', () => {
  popup.classList.remove('visible');
});

// Create room button handler
createRoomBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const secretKey = secretKeyInput.value.trim();

  if (selectedRoomType === 'protected' && !secretKey) {
    alert('Please enter a secret key for protected room.');
    return;
  }

  try {
    const res = await fetch('https://sanchat.onrender.com/api/temp/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomType: selectedRoomType,
        secretKey: selectedRoomType === 'protected' ? secretKey : ''
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert(`Room created! Code: ${data.roomCode}`);
      popup.classList.remove('visible');
      // You can do something else here, like auto-join the room or update UI
      console.log('Created room code:', data.roomCode);
    } else {
      alert(data.message || 'Failed to create room.');
    }
  } catch (err) {
    alert('Error creating room.');
    console.error(err);
  }
});


// fetch("/api/temp/join", { //join room
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({ roomCode: "ABC123", secretKey: "mysecret" })
// })
//   .then((res) => res.json())
//   .then((data) => console.log("Joined:", data));


// ====================Connect to server==========

const socket = io("https://sanchat.onrender.com"); //deployed backend URL

// Join a room
function joinRoom(roomCode) {
  socket.emit("joinRoom", { roomCode });
  console.log("Joined room:", roomCode);
}

// Send a message
function sendMessage(roomCode, text, sender) {
  const messageObject = {
    sender: sender || "Anonymous",
    text,
    timestamp: Date.now()
  };

  socket.emit("sendMessage", {
    roomCode,
    message: messageObject
  });
}

// Receive a message
socket.on("receiveMessage", (message) => {
  console.log("Received message:", message);
  // Update your UI here
  displayIncomingMessage(message);
});

//-------------joinRoom chat logic--------------

let awaitingSecretFor = null;   // roomCode if we’re waiting on a secret
const searchInput = document.getElementById("search-input");
const joinBtn     = document.getElementById("join-btn");
const chatPage    = document.getElementById("chat-page");
const searchBox   = document.getElementById("searchBox");

// Helper: show chat UI
function showChatFor(roomCode) {
  searchBox.style.display = "none";
  chatPage.style.display = "block";
  socket.emit("join-room", roomCode);
}

joinBtn.addEventListener("click", () => {
  const code = searchInput.value.trim();
  if (!code) return;

  // If we’re already awaiting a secret, treat this as secret submission:
  if (awaitingSecretFor) {
    socket.emit("submit-secret", {
      roomCode: awaitingSecretFor,
      secret: code
    });
    return;
  }

  // Otherwise, first check if room exists / is protected
  socket.emit("check-room", code);
});

socket.on("room-check-result", ({ exists, requiresSecret, roomName }) => {
  if (!exists) {
    alert("Room not found.");
    return;
  }

  if (requiresSecret) {
    // Ask user for secret
    awaitingSecretFor = roomName;  
    searchInput.value = "";
    searchInput.placeholder = `Enter secret for room "${roomName}"`;
  } else {
    // No secret needed → join immediately
    showChatFor(roomName);
  }
});

socket.on("secret-result", ({ success }) => {
  if (success && awaitingSecretFor) {
    showChatFor(awaitingSecretFor);
    awaitingSecretFor = null;
  } else {
    alert("Incorrect secret—try again.");
    searchInput.value = "";
  }
});
