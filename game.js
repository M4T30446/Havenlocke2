const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const jumpscareDiv = document.getElementById("jumpscare");
const jumpscareSound = document.getElementById("jumpscareSound");
const ost = document.getElementById("ost");

const keys = {};
let mouseX = 0;
let mouseY = 0;
let bullets = [];
let corruptionLevel = 0;
let gameOver = false;
let bossDefeated = false;
let loopId = null;
let running = false; // flag para evitar múltiplos loops

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});
canvas.addEventListener("click", shoot);

const player = { x: 400, y: 300, size: 40, speed: 2.5 };
const exitDoor = { x: 750, y: 50, size: 50, open: false };
let monsters = [];

const messages = [
  { text: "Você sente que algo observa...", color: "#8f00ff" },
  { text: "O ar ficou mais pesado aqui.", color: "#ff0080" },
  { text: "Eles nunca descansam.", color: "#00ffff" },
  { text: "Ouça os sussurros da 212.", color: "#ff4000" },
  { text: "Não olhe para trás.", color: "#ffff00" },
  { text: "Eles querem você.", color: "#00ff00" },
  { text: "A porta está se fechando...", color: "#ff00ff" },
  { text: "Corrompido. Não confie.", color: "#ff8040" },
  { text: "Eles caminham entre as sombras.", color: "#8040ff" },
  { text: "A saída está perto... ou não.", color: "#ff0040" },
  { text: "Algo está vindo.", color: "#40ff00" },
  { text: "Não entre na 212", color: "#ff0040" },
  
];
const finalMessage = { text: "Fqybge", color: "#ff0000" };

function spawnMonsters(count) {
  monsters = [];

  if (corruptionLevel === 12) {
    monsters.push({
      x: 600, y: 400, size: 120, alive: true,
      speed: 1.5, health: 212, isBoss: true
    });
    return;
  }

  let attempts = 0;
  while (monsters.length < count && attempts < count * 10) {
    attempts++;
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    const safeDistance = 150;
    if (Math.hypot(x - player.x, y - player.y) > safeDistance) {
      monsters.push({
        x, y, size: 50, alive: true,
        speed: 0.7 + 0.1 * corruptionLevel, isBoss: false
      });
    }
  }
}

function updateBullets() {
  bullets.forEach(b => {
    if (corruptionLevel >= 9) {
      let closest = null;
      let minDist = Infinity;
      monsters.forEach(m => {
        if (m.alive) {
          const d = Math.hypot(b.x - m.x, b.y - m.y);
          if (d < minDist) {
            minDist = d;
            closest = m;
          }
        }
      });
      if (closest) {
        const dx = closest.x - b.x;
        const dy = closest.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          b.dx = (dx / dist) * 5;
          b.dy = (dy / dist) * 5;
        }
      }
    }
    b.x += b.dx;
    b.y += b.dy;
  });
}

function shoot() {
  if (gameOver) return;
  const angle = Math.atan2(mouseY - player.y, mouseX - player.x);

  if (corruptionLevel >= 5) {
    const spread = 0.1;
    for (let i = -1; i <= 1; i++) {
      bullets.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(angle + i * spread) * 5,
        dy: Math.sin(angle + i * spread) * 5
      });
    }
  } else {
    bullets.push({
      x: player.x, y: player.y,
      dx: Math.cos(angle) * 5,
      dy: Math.sin(angle) * 5
    });
  }
}

function update() {
  if (gameOver) return;

  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  player.x = Math.max(0, Math.min(canvas.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height, player.y));

  updateBullets();

  monsters.forEach(monster => {
    if (!monster.alive) return;

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      monster.x += (dx / dist) * monster.speed;
      monster.y += (dy / dist) * monster.speed;
    }

    if (dist < (monster.size / 2 + player.size / 2)) {
      triggerJumpscare();
    }

    bullets.forEach((b, i) => {
      const d = Math.hypot(b.x - monster.x, b.y - monster.y);
      if (d < monster.size / 2) {
        if (monster.isBoss) {
          monster.health--;
          if (monster.health <= 0) {
            monster.alive = false;
            exitDoor.open = true;
            bossDefeated = true;
            gameOver = true;
            setTimeout(() => {
              window.location.href = "blackpoint.html";
            }, 4000);
          }
        } else {
          monster.alive = false;
          if (monsters.every(m => !m.alive)) exitDoor.open = true;
        }
        bullets.splice(i, 1);
      }
    });
  });

  const distExit = Math.hypot(player.x - exitDoor.x, player.y - exitDoor.y);
  if (exitDoor.open && distExit < exitDoor.size) nextLoop();
}

function drawFloor() {
  const tileSize = 40;
  for (let y = 0; y < canvas.height; y += tileSize) {
    for (let x = 0; x < canvas.width; x += tileSize) {
      const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isLight ? "#3a2c23" : "#221a15";
      ctx.fillRect(x, y, tileSize, tileSize);

      if (Math.random() < 0.1) {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(x + Math.random()*tileSize*0.7, y + Math.random()*tileSize*0.7, 6, 6);
      }
    }
  }
}

function drawDoor(x, y, w, h, open) {
  ctx.save();
  ctx.fillStyle = open ? "#4b2e2e" : "#2f1f1f";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 20;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "#1a0f0f";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    let startX = x + Math.random() * w;
    let startY = y + Math.random() * h;
    let endX = startX + (Math.random() * 30 - 15);
    let endY = startY + (Math.random() * 30 - 15);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.lineWidth = 8;
  ctx.strokeStyle = "#0b0707";
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = open ? "#d4b483" : "#6f5a44";
  ctx.beginPath();
  ctx.arc(x + w - 15, y + h/2, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5a3f1c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + w - 15, y + h/2, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawMessages() {
  ctx.font = "20px monospace";
  ctx.textAlign = "center";
  if (bossDefeated) {
    ctx.font = "80px monospace";
    ctx.fillStyle = finalMessage.color;
    ctx.fillText(finalMessage.text, canvas.width / 2, canvas.height / 2);
  } else {
    if (corruptionLevel === 1) {
      ctx.fillStyle = "#aaa";
      ctx.fillText("WASD para mover, Mouse para mirar, Clique para atirar", canvas.width / 2, canvas.height - 50);
    }
    const message = corruptionLevel < 12 ? messages[corruptionLevel - 1] : finalMessage;
    ctx.fillStyle = message.color;
    ctx.fillText(message.text, canvas.width / 2, canvas.height - 20);
  }
}

function draw() {
  drawFloor();
  ctx.fillStyle = "rgba(30, 0, 30, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f0";
  ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

  monsters.forEach(monster => {
    if (monster.alive) {
      ctx.fillStyle = monster.isBoss ? "#ff8800" : "#f00";
      ctx.fillRect(monster.x - monster.size / 2, monster.y - monster.size / 2, monster.size, monster.size);
    }
  });

  const doorW = exitDoor.size;
  const doorH = exitDoor.size * 1.5;
  drawDoor(exitDoor.x - doorW / 2, exitDoor.y - doorH / 2, doorW, doorH, exitDoor.open);

  ctx.fillStyle = "#fff";
  bullets.forEach(b => {
    ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
  });

  if (corruptionLevel > 0) {
    ctx.fillStyle = `rgba(128, 0, 128, ${0.02 * corruptionLevel})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawMessages();
}

function loop() {
  update();
  draw();
  if (!gameOver && corruptionLevel <= 12) {
    loopId = requestAnimationFrame(loop);
  } else {
    cancelAnimationFrame(loopId);
    running = false;
  }
}

function nextLoop() {
  corruptionLevel++;
  if (corruptionLevel > 12) {
    gameOver = true;
    return;
  }
  player.x = 400;
  player.y = 300;
  bullets = [];
  exitDoor.open = false;
  player.speed += 0.2;

  const monsterCount = corruptionLevel < 12 ? Math.ceil(1 + corruptionLevel * 1.5) : 1;
  spawnMonsters(monsterCount);

  console.log(`Ciclo ${corruptionLevel}: ${monsterCount} inimigos. Velocidade player: ${player.speed.toFixed(2)}`);
}

function resetGame() {
  cancelAnimationFrame(loopId);

  player.x = 400;
  player.y = 300;
  bullets = [];
  corruptionLevel = 0;
  exitDoor.open = false;
  monsters = [];
  bossDefeated = false;
  gameOver = false;
  player.speed = 2.5;

  ost.currentTime = 0;
  ost.play();
  jumpscareDiv.style.display = "none";

  nextLoop();
  if (!running) {
    running = true;
    loop();
  }
}

function triggerJumpscare() {
  gameOver = true;
  jumpscareDiv.style.display = "block";
  jumpscareSound.play();
  ost.pause();

  // Aguarda 5 segundos, depois recarrega toda a página
  setTimeout(() => {
    window.location.reload();
  }, 5000);
}


// inicial
nextLoop();
running = true;
loop();
