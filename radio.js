const knob = document.getElementById('knob');
const staticSound = document.getElementById('staticSound');
const jumpscareSound = new Audio('shhh.mp3');
jumpscareSound.volume = 1.0;

const display = document.querySelector('.frequency-display');

let angle = 0;
let isDragging = false;

let searchingTime = 0;
let lastTimestamp = null;
let jumpscarePlayed = false;

let isTuned = false;
let timeTuned = 0;

knob.addEventListener('mousedown', () => {
  isDragging = true;
  if (!lastTimestamp) lastTimestamp = performance.now();
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', e => {
  if (!isDragging) return;

  const rect = knob.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const dx = e.clientX - cx;
  const dy = e.clientY - cy;

  const newAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  angle = (newAngle + 360) % 360;

  knob.style.transform = `rotate(${angle}deg)`;

  const frequency = Math.round(angle / 360 * 180) * 2;
  display.textContent = `Frequência: ${frequency} AM`;

  const distance = Math.abs(212 - frequency);
  staticSound.volume = Math.max(0.2, 1.0 - distance / 200);
  if (staticSound.paused) staticSound.play();

  const now = performance.now();
  if (lastTimestamp !== null && !jumpscarePlayed) {
    searchingTime += now - lastTimestamp;
    if (searchingTime >= 10000) {
      jumpscarePlayed = true;
      jumpscareSound.pause();
      jumpscareSound.currentTime = 0;
      jumpscareSound.volume = 1.0;
      jumpscareSound.play().catch(err => console.error('Autoplay bloqueado:', err));
      console.log('💀 Jumpscare tocou!');
    }
  }
  lastTimestamp = now;

  isTuned = (frequency === 212);
});

// Verifica sintonia a cada 100ms
setInterval(() => {
  if (isTuned) {
    timeTuned += 100;
    console.log(`⏳ Sintonizado por: ${timeTuned} ms`);
    if (timeTuned >= 2000) {
      console.log('✅ Redirecionando para riamo.html...');
      window.location.href = 'riamo.html';
    }
  } else {
    if (timeTuned > 0) console.log('❌ Saiu da sintonia');
    timeTuned = 0;
  }
}, 100);
