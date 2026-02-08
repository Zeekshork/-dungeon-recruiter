const canvas = document.getElementById('battlefield');
const ctx = canvas.getContext('2d');

const soulEl = document.getElementById('souls');
const waveEl = document.getElementById('wave');
const altarEl = document.getElementById('altarHp');
const defeatedEl = document.getElementById('defeated');
const messageEl = document.getElementById('message');

const summonImpBtn = document.getElementById('summonImp');
const summonBruteBtn = document.getElementById('summonBrute');
const startWaveBtn = document.getElementById('startWave');
const restartBtn = document.getElementById('restart');

const state = {
  souls: 15,
  wave: 1,
  altarHp: 100,
  defeated: 0,
  waveInProgress: false,
  gameOver: false,
  demons: [],
  knights: []
};

const costs = { imp: 10, brute: 25 };

function makeDemon(type) {
  if (type === 'imp') {
    return {
      type,
      hp: 35,
      maxHp: 35,
      damage: 6,
      speed: 1.35,
      x: 100,
      y: 260 + Math.random() * 70,
      attackCooldown: 0
    };
  }

  return {
    type,
    hp: 80,
    maxHp: 80,
    damage: 12,
    speed: 0.9,
    x: 70,
    y: 255 + Math.random() * 75,
    attackCooldown: 0
  };
}

function makeKnight(strengthScale = 1) {
  const tanky = Math.random() < 0.35;
  return {
    hp: tanky ? 95 * strengthScale : 55 * strengthScale,
    maxHp: tanky ? 95 * strengthScale : 55 * strengthScale,
    damage: tanky ? 11 * strengthScale : 8 * strengthScale,
    speed: tanky ? 0.55 : 0.9,
    x: canvas.width - 80,
    y: 245 + Math.random() * 85,
    attackCooldown: 0,
    tanky
  };
}

function spendSouls(cost) {
  if (state.souls < cost || state.gameOver) return false;
  state.souls -= cost;
  return true;
}

function summon(type) {
  const cost = costs[type];
  if (!spendSouls(cost)) {
    setMessage('Not enough souls for that summon.', true);
    return;
  }

  state.demons.push(makeDemon(type));
  setMessage(`${type === 'imp' ? 'Imp' : 'Brute'} summoned.`);
  updateHud();
}

function startWave() {
  if (state.waveInProgress || state.gameOver) return;

  const amount = 3 + state.wave * 2;
  const strength = 1 + state.wave * 0.12;
  for (let i = 0; i < amount; i += 1) {
    const knight = makeKnight(strength);
    knight.x += i * 35;
    state.knights.push(knight);
  }
  state.waveInProgress = true;
  setMessage(`Wave ${state.wave} begins! ${amount} knights advance.`);
}

function collide(a, b, range = 20) {
  return Math.abs(a.x - b.x) < range && Math.abs(a.y - b.y) < range;
}

function updateUnits() {
  state.demons.forEach((demon) => {
    if (demon.hp <= 0) return;

    const target = state.knights.find((k) => k.hp > 0);
    if (!target) return;

    if (collide(demon, target, 28)) {
      if (demon.attackCooldown <= 0) {
        target.hp -= demon.damage;
        demon.attackCooldown = 28;
      }
    } else {
      demon.x += demon.speed;
      demon.y += (target.y - demon.y) * 0.02;
    }

    demon.attackCooldown -= 1;
  });

  state.knights.forEach((knight) => {
    if (knight.hp <= 0) return;

    const target = state.demons.find((d) => d.hp > 0);
    if (!target) {
      knight.x -= knight.speed;
      if (knight.x < 52) {
        state.altarHp -= knight.damage * 0.55;
        knight.hp = 0;
      }
      return;
    }

    if (collide(knight, target, 30)) {
      if (knight.attackCooldown <= 0) {
        target.hp -= knight.damage;
        knight.attackCooldown = 36;
      }
    } else {
      knight.x -= knight.speed;
      knight.y += (target.y - knight.y) * 0.02;
    }

    knight.attackCooldown -= 1;
  });

  const previousKnightCount = state.knights.length;
  state.demons = state.demons.filter((d) => d.hp > 0);
  state.knights = state.knights.filter((k) => k.hp > 0);
  const removed = previousKnightCount - state.knights.length;
  if (removed > 0) {
    state.defeated += removed;
    state.souls += removed * 4;
  }

  if (state.waveInProgress && state.knights.length === 0) {
    state.waveInProgress = false;
    state.wave += 1;
    state.souls += 12;
    setMessage(`Victory! Prepare for wave ${state.wave}.`);
  }

  if (state.altarHp <= 0 && !state.gameOver) {
    state.altarHp = 0;
    state.gameOver = true;
    setMessage('Your altar has fallen. The knights win.', true);
    restartBtn.classList.remove('hidden');
  }
}

function drawHealthBar(x, y, width, hp, maxHp, color) {
  const ratio = Math.max(0, hp / maxHp);
  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * ratio, 5);
}

function drawUnits() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#7f283a';
  ctx.fillRect(8, 210, 45, 150);
  ctx.fillStyle = '#f6ca4a';
  ctx.beginPath();
  ctx.arc(30, 210, 11, 0, Math.PI * 2);
  ctx.fill();

  state.demons.forEach((demon) => {
    ctx.fillStyle = demon.type === 'imp' ? '#ef6f4f' : '#9334a7';
    ctx.beginPath();
    ctx.arc(demon.x, demon.y, demon.type === 'imp' ? 12 : 18, 0, Math.PI * 2);
    ctx.fill();
    drawHealthBar(demon.x - 16, demon.y - 20, 32, demon.hp, demon.maxHp, '#55da7f');
  });

  state.knights.forEach((knight) => {
    ctx.fillStyle = knight.tanky ? '#84b0ff' : '#d7e2ef';
    ctx.fillRect(knight.x - 10, knight.y - 14, 20, 28);
    ctx.fillStyle = '#60789c';
    ctx.fillRect(knight.x - 8, knight.y - 20, 16, 8);
    drawHealthBar(knight.x - 16, knight.y - 28, 32, knight.hp, knight.maxHp, '#e75a5a');
  });
}

function setMessage(text, danger = false) {
  messageEl.textContent = text;
  messageEl.style.color = danger ? '#ff9b9b' : '#f3dfd3';
}

function updateHud() {
  soulEl.textContent = Math.floor(state.souls).toString();
  waveEl.textContent = state.wave.toString();
  altarEl.textContent = Math.floor(state.altarHp).toString();
  defeatedEl.textContent = state.defeated.toString();
  summonImpBtn.disabled = state.souls < costs.imp || state.gameOver;
  summonBruteBtn.disabled = state.souls < costs.brute || state.gameOver;
  startWaveBtn.disabled = state.waveInProgress || state.gameOver;
}

function reset() {
  state.souls = 15;
  state.wave = 1;
  state.altarHp = 100;
  state.defeated = 0;
  state.waveInProgress = false;
  state.gameOver = false;
  state.demons = [];
  state.knights = [];
  restartBtn.classList.add('hidden');
  setMessage('Gather souls over time and prepare for battle.');
  updateHud();
}

summonImpBtn.addEventListener('click', () => summon('imp'));
summonBruteBtn.addEventListener('click', () => summon('brute'));
startWaveBtn.addEventListener('click', startWave);
restartBtn.addEventListener('click', reset);

setInterval(() => {
  if (!state.gameOver) {
    state.souls += 0.8;
  }
}, 1000);

function loop() {
  updateUnits();
  drawUnits();
  updateHud();
  requestAnimationFrame(loop);
}

reset();
loop();
