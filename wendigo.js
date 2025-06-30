const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const jumpscareDiv = document.getElementById('jumpscare');
const wendigoAudio = new Audio('wendigo.wav');
wendigoAudio.loop = true;
const gritoAudio = new Audio('grito.mp3');

const player = {
  x: 400,
  y: 300,
  size: 20,
  speed: 3,
  startX: 400,
  startY: 300
};

const PATH_WIDTH = 40;

const correctSequence = ['N', 'N', 'S', 'S', 'W', 'E', 'W', 'E'];
let pathIndex = 0;

let rainLevel = 1;
let rainSpeed = 0.5;

let rainDrops = [];
const anomalies = [];

let wendigo = null;
let wendigoSpawned = false;
let gameOver = false;
let playerWon = false;
let winTime = null;

const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function movePlayer() {
  let dx = 0, dy = 0;

  if (keys['w']) dy -= player.speed;
  if (keys['s']) dy += player.speed;
  if (keys['a']) dx -= player.speed;
  if (keys['d']) dx += player.speed;

  let newX = player.x + dx;
  let newY = player.y + dy;

  if (!collidesWithForest(newX, newY)) {
    player.x = newX;
    player.y = newY;
  }

  checkCrossroads();
}

function collidesWithForest(x, y) {
  const inHorizontal = (
    y > player.startY - PATH_WIDTH / 2 &&
    y < player.startY + PATH_WIDTH / 2
  );
  const inVertical = (
    x > player.startX - PATH_WIDTH / 2 &&
    x < player.startX + PATH_WIDTH / 2
  );

  return !(inHorizontal || inVertical);
}

function checkCrossroads() {
  const dx = player.x - player.startX;
  const dy = player.y - player.startY;

  const verticalThreshold = 300;
  const horizontalThreshold = 410;

  let dir = null;

  if (Math.abs(dx) > Math.abs(dy)) {
    dir = dx > 0 ? 'E' : 'W';
  } else {
    dir = dy > 0 ? 'S' : 'N';
  }

  const passed =
    (dir === 'N' && player.y <= player.startY - verticalThreshold) ||
    (dir === 'S' && player.y >= player.startY + verticalThreshold) ||
    (dir === 'W' && player.x <= player.startX - horizontalThreshold) ||
    (dir === 'E' && player.x >= player.startX + horizontalThreshold);

  if (passed) {
    if (dir === correctSequence[pathIndex]) {
      pathIndex++;
      rainLevel += 2.0;
      rainSpeed += 1.5;
      spawnAnomaly(pathIndex);

      if (pathIndex >= correctSequence.length) {
        playerWon = true;
        gameOver = true;
      }
    } else {
      pathIndex = 0;
      rainLevel = 1;
      rainSpeed = 0.5;
      anomalies.length = 0;
    }

    player.x = player.startX;
    player.y = player.startY;
  }
}

function spawnAnomaly(step) {
  switch (step) {
    case 1:
      anomalies.push({ type: 'tree', x: 600, y: 100, color: '#004400' });
      break;
    case 2:
      anomalies.push({ type: 'bush', x: 200, y: 500, color: '#226600' });
      break;
    case 3:
      anomalies.push({ type: 'rock', x: 700, y: 300, color: '#555555' });
      break;
    case 4:
      anomalies.push({ type: 'mushroom', x: 150, y: 200, color: '#aa0000' });
      break;
    case 5:
      anomalies.push({ type: 'weirdTree', x: 650, y: 450, color: '#113311' });
      break;
    case 6:
      anomalies.push({ type: 'flower', x: 300, y: 150, color: '#ff00ff' });
      break;
    case 7:
      anomalies.push({ type: 'statue', x: 500, y: 100, color: '#999999' });
      break;
    case 8:
      anomalies.push({ type: 'shadow', x: 400, y: 500, color: '#330000' });
      break;
  }
}

function drawBackground() {
  ctx.fillStyle = '#001100';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#111';
  ctx.fillRect(player.startX - PATH_WIDTH / 2, 0, PATH_WIDTH, canvas.height);
  ctx.fillRect(0, player.startY - PATH_WIDTH / 2, canvas.width, PATH_WIDTH);

  anomalies.forEach(obj => {
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x, obj.y, 20, 20);
  });
}

function drawRain() {
  ctx.fillStyle = 'rgba(0,150,255,0.4)';
  const maxDrops = rainLevel * 50;
  if (rainDrops.length < maxDrops) {
    for (let i = 0; i < rainLevel * 5; i++) {
      rainDrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
      });
    }
  }

  rainDrops.forEach(drop => {
    ctx.fillRect(drop.x, drop.y, 2, 8);
    drop.y += rainSpeed;
    if (drop.y > canvas.height) {
      drop.y = -8;
      drop.x = Math.random() * canvas.width;
    }
  });
}

function drawPlayer() {
  ctx.fillStyle = '#005500';
  ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

function spawnWendigo() {
  if (wendigoSpawned) return;

  wendigo = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 2
  };
  wendigoSpawned = true;
  wendigoAudio.play();
}

function moveWendigo() {
  const dx = player.x - wendigo.x;
  const dy = player.y - wendigo.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 0) {
    wendigo.x += (dx / dist) * wendigo.speed;
    wendigo.y += (dy / dist) * wendigo.speed;
  }

  if (dist < player.size) {
  jumpscareDiv.style.display = 'flex';
  gameOver = true;

  wendigoAudio.pause();
  gritoAudio.play();

  // Reinicia o jogo em 5 segundos, mesmo que o áudio ainda esteja tocando
  setTimeout(() => {
    jumpscareDiv.style.display = 'none';
    gritoAudio.pause();
    gritoAudio.currentTime = 0;
    resetGame();
  }, 5000);
}
}

function drawWendigo() {
  if (!wendigo) return;
  ctx.fillStyle = '#aa0000';
  ctx.fillRect(wendigo.x - 10, wendigo.y - 10, 20, 20);
}

function drawWinScreen() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'lime';
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('bm9zdGVy', canvas.width / 2, canvas.height / 2);
}

function update() {
  if (gameOver || playerWon) return;

  movePlayer();
  if (wendigo) moveWendigo();
}

function draw() {
  if (playerWon) {
    if (!winTime) {
      winTime = Date.now();
    }

    drawWinScreen();

    if (Date.now() - winTime >= 3000) {
      window.location.href = "radio.html";
    }
    return;
  }

  drawBackground();
  drawRain();
  drawPlayer();
  drawWendigo();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function resetGame() {
  player.x = player.startX;
  player.y = player.startY;
  pathIndex = 0;
  rainLevel = 1;
  rainSpeed = 0.5;
  rainDrops = [];
  anomalies.length = 0;
  wendigo = null;
  wendigoSpawned = false;
  wendigoAudio.pause();
  wendigoAudio.currentTime = 0;
  gameOver = false;
  playerWon = false;
  winTime = null;

  setTimeout(spawnWendigo, 30000);
}

jumpscareDiv.style.display = 'none';

setTimeout(spawnWendigo, 30000);
loop();
