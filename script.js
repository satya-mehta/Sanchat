const toggle = document.getElementById('darkModeToggle');
const body = document.body;

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

// Chat open/close
document.getElementById('amigo').addEventListener('click', () => {
  document.getElementById('chat-container').classList.add('hidden');
  document.getElementById('chat-page').classList.remove('hidden');
  document.getElementById('header').classList.add('hidden');
  document.getElementById('searchBox').classList.add('hidden');

  // scroll once when opening the chat
  scrollChatToBottom();
});

document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('chat-container').classList.remove('hidden');
  document.getElementById('chat-page').classList.add('hidden');
  document.getElementById('header').classList.remove('hidden');
  document.getElementById('searchBox').classList.remove('hidden');
});

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
