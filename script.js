const toggle = document.getElementById('darkModeToggle');
const body = document.body;

if(localStorage.getItem('dark-mode') === 'true'){
    body.classList.add('dark-mode');
    toggle.checked = true;
}

toggle.addEventListener('change', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', body.classList.contains('dark-mode'));
});

function updateTime(){
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isPM = hours >=12;

    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const ampm = isPM ? 'PM' : 'AM';

    const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
    document.getElementById('timeDisplay').textContent = timeString;
}

updateTime();
setInterval(updateTime, 30000)