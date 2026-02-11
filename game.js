// ============================================
// MOON RUNNER - Main Game
// Pixel art style lunar gravity runner
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const touchArea = document.getElementById('touch-area');

// --- CONSTANTS ---
const GAME_WIDTH = 400;
const GAME_HEIGHT = 700;
const LUNAR_GRAVITY = 0.08;  // Very slow gravity (moon = 1/6 earth)
const JUMP_FORCE = -3.5;
const GROUND_Y = 580;
const PIXEL_SCALE = 2;

// --- GAME STATE ---
let gameState = 'title'; // title, charSelect, stageSelect, playing, paused, stageCleared, gameOver
let scale = 1;
let offsetX = 0;
let offsetY = 0;

// --- STAGE DATA ---
const STAGES = [
    {
        id: 1,
        name: 'Mare Tranquillitatis',
        nameKo: '고요의 바다',
        description: '아폴로 11호 착륙 지점. 비교적 평탄한 지형.',
        speed: 0.75,
        obstacleFreq: 0.012,
        energyFreq: 0.008,
        boosterCount: 5,
        targetDist: 1000,
        bgColor: '#1a1a2e',
        groundColor: '#4a4a5a',
        groundAccent: '#3a3a4a',
        events: ['stars', 'earth'],
        unlocked: true
    },
    {
        id: 2,
        name: 'Oceanus Procellarum',
        nameKo: '폭풍의 대양',
        description: '달에서 가장 큰 바다. 먼지폭풍이 가끔 발생.',
        speed: 1.0,
        obstacleFreq: 0.018,
        energyFreq: 0.006,
        boosterCount: 4,
        targetDist: 1500,
        bgColor: '#151528',
        groundColor: '#555568',
        groundAccent: '#454558',
        events: ['stars', 'dust_storm', 'shooting_star'],
        unlocked: false
    },
    {
        id: 3,
        name: 'Mare Imbrium',
        nameKo: '비의 바다',
        description: '거대한 크레이터 지역. 운석 낙하 주의!',
        speed: 1.25,
        obstacleFreq: 0.022,
        energyFreq: 0.005,
        boosterCount: 3,
        targetDist: 2000,
        bgColor: '#121225',
        groundColor: '#606075',
        groundAccent: '#505065',
        events: ['stars', 'meteor', 'planets'],
        unlocked: false
    },
    {
        id: 4,
        name: 'Tycho Crater',
        nameKo: '티코 크레이터',
        description: '험난한 크레이터 지대. 화산 활동 흔적!',
        speed: 1.5,
        obstacleFreq: 0.028,
        energyFreq: 0.004,
        boosterCount: 2,
        targetDist: 2500,
        bgColor: '#0e0e20',
        groundColor: '#6a6a80',
        groundAccent: '#5a5a70',
        events: ['stars', 'volcano', 'shooting_star', 'rocket'],
        unlocked: false
    },
    {
        id: 5,
        name: 'Mare Frigoris',
        nameKo: '추위의 바다',
        description: '달의 극지방. 극한의 환경에서 생존하라!',
        speed: 1.75,
        obstacleFreq: 0.035,
        energyFreq: 0.003,
        boosterCount: 1,
        targetDist: 3000,
        bgColor: '#0a0a1a',
        groundColor: '#7a7a90',
        groundAccent: '#6a6a80',
        events: ['stars', 'meteor', 'volcano', 'spaceship', 'sun'],
        unlocked: false
    }
];

// --- CHARACTERS ---
const CHARACTERS = [
    { id: 'rover', name: 'Luna Rover', nameKo: '루나 로버', unlockDist: 0, type: 'rover' },
    { id: 'astro', name: 'Astronaut', nameKo: '우주비행사', unlockDist: 0, type: 'astronaut' },
    { id: 'rover2', name: 'Heavy Rover', nameKo: '헤비 로버', unlockDist: 3000, type: 'rover' },
    { id: 'astro2', name: 'Commander', nameKo: '커맨더', unlockDist: 5000, type: 'astronaut' },
    { id: 'rover3', name: 'Speed Rover', nameKo: '스피드 로버', unlockDist: 10000, type: 'rover' },
    { id: 'astro3', name: 'Explorer', nameKo: '익스플로러', unlockDist: 15000, type: 'astronaut' },
];

// --- MOON FACTS ---
const MOON_FACTS = [
    '달의 중력은 지구의 약 1/6입니다.',
    '달에서 지구까지의 평균 거리는 384,400km입니다.',
    '달의 표면 온도는 낮에 127°C, 밤에 -173°C입니다.',
    '달은 지구 주위를 29.5일에 한 바퀴 돕니다.',
    '달의 지름은 지구의 약 1/4입니다.',
    '달에는 대기가 거의 없습니다.',
    '아폴로 11호는 1969년 7월 20일 달에 착륙했습니다.',
    '달의 뒷면은 지구에서 볼 수 없습니다.',
    '달 표면의 어두운 부분을 "바다(Mare)"라고 부릅니다.',
    '달에서 몸무게는 지구의 약 16.5%입니다.',
    '달에는 물(얼음)이 존재합니다.',
    '달의 나이는 약 45억 년입니다.',
    '닐 암스트롱이 최초로 달을 밟은 인간입니다.',
    '달 먼지는 매우 미세하고 날카롭습니다.',
    '달에서는 소리가 전달되지 않습니다.',
];

// --- BADGE DATA ---
const BADGE_COLORS = [
    ['#FFD700', '#FFA500'], // Gold/Orange
    ['#C0C0C0', '#808080'], // Silver/Gray
    ['#4169E1', '#1E90FF'], // Blue
    ['#FF4500', '#DC143C'], // Red
    ['#9400D3', '#8A2BE2'], // Purple
];

// --- SAVE DATA ---
let saveData = {
    totalDistance: 0,
    highScores: [0, 0, 0, 0, 0],
    clearedStages: [],
    selectedChar: 'rover',
    badges: []
};

function loadSave() {
    try {
        const s = localStorage.getItem('moonrunner_save');
        if (s) saveData = JSON.parse(s);
    } catch(e) {}
    // Update stage unlock status
    STAGES[0].unlocked = true;
    for (let i = 1; i < STAGES.length; i++) {
        STAGES[i].unlocked = saveData.clearedStages.includes(STAGES[i-1].id);
    }
}

function saveSave() {
    try {
        localStorage.setItem('moonrunner_save', JSON.stringify(saveData));
    } catch(e) {}
}

loadSave();

// --- PLAYER ---
let player = {
    x: 80,
    y: GROUND_Y,
    vy: 0,
    width: 32,
    height: 32,
    isJumping: false,
    boosterGauge: 5,
    maxBooster: 5,
    boosterRechargeTimer: 0,
    lives: 3,
    invincible: 0,
    animFrame: 0,
    animTimer: 0,
    dustParticles: []
};

// --- GAME VARS ---
let currentStage = null;
let distance = 0;
let scrollSpeed = 0;
let obstacles = [];
let energyItems = [];
let bgObjects = [];
let bgStars = [];
let groundTiles = [];
let particles = [];
let screenShake = 0;
let titleAnimTimer = 0;
let titleRoverX = -50;
let stageSelectScroll = 0;
let charSelectIndex = 0;
let uiButtons = [];
let gameTime = 0;

// --- PARALLAX LAYERS ---
let bgLayers = [
    { offset: 0, speed: 0.1 }, // far stars
    { offset: 0, speed: 0.3 }, // mid objects (planets, etc)
    { offset: 0, speed: 0.6 }, // near mountains
    { offset: 0, speed: 1.0 }, // ground
];

// ============================================
// PIXEL ART DRAWING FUNCTIONS
// ============================================

function drawPixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function drawPixelCircle(cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
            if (x*x + y*y <= r*r) {
                ctx.fillRect(Math.floor(cx+x), Math.floor(cy+y), 1, 1);
            }
        }
    }
}

// --- ROVER SPRITE ---
function drawRover(x, y, frame, type = 'rover') {
    const f = Math.floor(frame) % 4;
    x = Math.floor(x);
    y = Math.floor(y);

    if (type === 'rover') {
        // Body
        drawPixelRect(x-12, y-16, 24, 10, '#C0C0C0');
        drawPixelRect(x-10, y-18, 20, 4, '#A0A0B0');
        // Top equipment
        drawPixelRect(x-4, y-24, 3, 6, '#808090');
        drawPixelRect(x-5, y-26, 5, 3, '#909098');
        // Antenna
        drawPixelRect(x+6, y-28, 2, 14, '#707080');
        drawPixelRect(x+4, y-30, 6, 3, '#FFD700');
        // Solar panel
        drawPixelRect(x-14, y-22, 8, 2, '#4169E1');
        drawPixelRect(x-14, y-20, 8, 1, '#1E90FF');
        // Wheels
        const wheelBounce = f === 1 || f === 3 ? 1 : 0;
        drawPixelCircle(x-8, y-2+wheelBounce, 4, '#404050');
        drawPixelCircle(x-8, y-2+wheelBounce, 2, '#505060');
        drawPixelCircle(x+8, y-2+wheelBounce, 4, '#404050');
        drawPixelCircle(x+8, y-2+wheelBounce, 2, '#505060');
        // Wheel spokes animation
        if (f % 2 === 0) {
            drawPixelRect(x-9, y-2+wheelBounce, 2, 1, '#606070');
            drawPixelRect(x+7, y-2+wheelBounce, 2, 1, '#606070');
        } else {
            drawPixelRect(x-8, y-3+wheelBounce, 1, 2, '#606070');
            drawPixelRect(x+8, y-3+wheelBounce, 1, 2, '#606070');
        }
        // Camera eye
        drawPixelRect(x+10, y-16, 4, 3, '#303040');
        drawPixelRect(x+11, y-15, 2, 1, '#00FF88');
    } else {
        // ASTRONAUT
        // Helmet
        drawPixelRect(x-6, y-30, 12, 12, '#E0E0E8');
        drawPixelRect(x-4, y-28, 8, 8, '#1a1a3a');
        drawPixelRect(x-3, y-27, 6, 5, '#2a2a5a');
        // Visor reflection
        drawPixelRect(x-2, y-27, 2, 1, '#FFD700');
        // Body/suit
        drawPixelRect(x-7, y-18, 14, 14, '#E8E8F0');
        drawPixelRect(x-5, y-16, 10, 10, '#D0D0E0');
        // Backpack
        drawPixelRect(x-9, y-17, 3, 10, '#A0A0B0');
        drawPixelRect(x-10, y-14, 2, 4, '#808090');
        // Arms
        const armSwing = f % 2 === 0 ? 0 : 1;
        drawPixelRect(x-9, y-16+armSwing, 3, 8, '#D8D8E8');
        drawPixelRect(x+6, y-16-armSwing, 3, 8, '#D8D8E8');
        // Legs
        const legSwing = f % 2 === 0 ? 1 : -1;
        drawPixelRect(x-5, y-4, 4, 6+legSwing, '#C8C8D8');
        drawPixelRect(x+1, y-4, 4, 6-legSwing, '#C8C8D8');
        // Boots
        drawPixelRect(x-6, y+2+legSwing, 5, 3, '#505060');
        drawPixelRect(x, y+2-legSwing, 5, 3, '#505060');
        // Flag patch
        drawPixelRect(x-1, y-16, 3, 2, '#FF4444');
        drawPixelRect(x-1, y-14, 3, 2, '#4444FF');
    }
}

// --- OBSTACLE SPRITES ---
function drawRock(x, y, size) {
    x = Math.floor(x);
    y = Math.floor(y);
    const s = size || 1;
    // Shadow
    drawPixelRect(x-8*s, y+2, 16*s, 3, 'rgba(0,0,0,0.3)');
    // Main rock body
    drawPixelRect(x-6*s, y-10*s, 12*s, 12*s, '#5a5a6a');
    drawPixelRect(x-8*s, y-8*s, 16*s, 8*s, '#6a6a7a');
    drawPixelRect(x-6*s, y-12*s, 10*s, 4*s, '#4a4a5a');
    // Highlight
    drawPixelRect(x-4*s, y-10*s, 4*s, 2*s, '#7a7a8a');
    // Dark spots
    drawPixelRect(x+2*s, y-6*s, 3*s, 3*s, '#3a3a4a');
}

function drawCrater(x, y, width) {
    x = Math.floor(x);
    y = Math.floor(y);
    const w = width || 30;
    // Crater rim
    drawPixelRect(x-w/2, y-2, w, 2, '#6a6a7a');
    // Crater hole
    drawPixelRect(x-w/2+2, y, w-4, 6, '#1a1a2a');
    drawPixelRect(x-w/2+4, y+2, w-8, 4, '#0a0a1a');
    // Rim highlight
    drawPixelRect(x-w/2+2, y-3, w-4, 1, '#8a8a9a');
}

function drawPuddle(x, y, width) {
    x = Math.floor(x);
    y = Math.floor(y);
    const w = width || 30;
    const shimmer = Math.sin(gameTime * 3) > 0 ? 1 : 0;
    // Water body
    drawPixelRect(x-w/2, y-1, w, 5, '#2a4a6a');
    drawPixelRect(x-w/2+2, y, w-4, 3, '#3a6a9a');
    // Shimmer
    drawPixelRect(x-w/4+shimmer*3, y+1, 4, 1, '#5a9aca');
    drawPixelRect(x+w/4-shimmer*2, y, 3, 1, '#5a9aca');
}

// --- ENERGY ITEM ---
function drawEnergy(x, y, frame) {
    x = Math.floor(x);
    y = Math.floor(y);
    const bob = Math.sin(frame * 0.1) * 3;
    const glow = Math.sin(frame * 0.15) * 0.3 + 0.7;

    // Glow
    ctx.globalAlpha = glow * 0.3;
    drawPixelCircle(x, y+bob, 8, '#00FFAA');
    ctx.globalAlpha = 1;

    // Crystal shape
    drawPixelRect(x-2, y-6+bob, 4, 12, '#00FF88');
    drawPixelRect(x-4, y-3+bob, 8, 6, '#00FFAA');
    // Highlight
    drawPixelRect(x-1, y-4+bob, 2, 4, '#AAFFDD');
}

// --- BACKGROUND ELEMENTS ---
function drawStar(x, y, size, twinkle) {
    const alpha = 0.5 + Math.sin(twinkle) * 0.5;
    ctx.globalAlpha = alpha;
    drawPixelRect(x, y, size, size, '#FFFFFF');
    if (size > 1) {
        drawPixelRect(x-1, y+Math.floor(size/2), 1, 1, '#FFFFFF');
        drawPixelRect(x+size, y+Math.floor(size/2), 1, 1, '#FFFFFF');
    }
    ctx.globalAlpha = 1;
}

function drawEarth(x, y, size) {
    x = Math.floor(x);
    y = Math.floor(y);
    const r = size || 20;
    drawPixelCircle(x, y, r, '#1a4a8a');
    drawPixelCircle(x, y, r-1, '#2a6aaa');
    // Continents
    drawPixelRect(x-r/2, y-r/3, r/2, r/3, '#2a8a3a');
    drawPixelRect(x+r/4, y-r/4, r/3, r/2, '#3a9a4a');
    drawPixelRect(x-r/4, y+r/6, r/2, r/4, '#2a8a3a');
    // Clouds
    drawPixelRect(x-r/3, y-r/2, r/2, 2, 'rgba(255,255,255,0.5)');
    drawPixelRect(x+r/4, y+r/4, r/3, 2, 'rgba(255,255,255,0.4)');
    // Atmosphere glow
    ctx.globalAlpha = 0.15;
    drawPixelCircle(x, y, r+2, '#88BBFF');
    ctx.globalAlpha = 1;
}

function drawMountain(x, y, w, h, color) {
    x = Math.floor(x);
    y = Math.floor(y);
    for (let i = 0; i < h; i++) {
        const ratio = i / h;
        const lineW = Math.floor(w * ratio);
        drawPixelRect(x - lineW/2, y - h + i, lineW, 1, color);
    }
}

function drawShootingStar(x, y, len) {
    for (let i = 0; i < len; i++) {
        ctx.globalAlpha = 1 - i/len;
        drawPixelRect(Math.floor(x+i*2), Math.floor(y+i), 2, 1, '#FFFFFF');
    }
    ctx.globalAlpha = 1;
}

function drawMeteor(x, y, size) {
    x = Math.floor(x);
    y = Math.floor(y);
    drawPixelCircle(x, y, size, '#8B4513');
    drawPixelCircle(x, y, size-2, '#A0522D');
    drawPixelRect(x-1, y-1, 2, 2, '#CD853F');
    // Fire trail
    for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.7 - i*0.12;
        drawPixelRect(x+size+i*3, y-size+i*2, 3, 2, i < 2 ? '#FF4500' : '#FF8C00');
    }
    ctx.globalAlpha = 1;
}

function drawRocket(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    // Body
    drawPixelRect(x-3, y-12, 6, 16, '#E0E0E0');
    drawPixelRect(x-2, y-14, 4, 4, '#D0D0D0');
    // Nose
    drawPixelRect(x-1, y-16, 2, 3, '#FF4444');
    // Window
    drawPixelRect(x-1, y-8, 2, 2, '#4488FF');
    // Fins
    drawPixelRect(x-5, y, 3, 6, '#FF4444');
    drawPixelRect(x+2, y, 3, 6, '#FF4444');
    // Flame
    const flicker = Math.random() > 0.5 ? 1 : 0;
    drawPixelRect(x-2, y+4, 4, 4+flicker, '#FF8800');
    drawPixelRect(x-1, y+6, 2, 4+flicker, '#FFCC00');
}

function drawSpaceship(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    // Saucer shape
    drawPixelRect(x-10, y-2, 20, 4, '#808090');
    drawPixelRect(x-14, y, 28, 3, '#909098');
    drawPixelRect(x-6, y-6, 12, 5, '#A0A0B0');
    // Dome
    drawPixelRect(x-4, y-9, 8, 4, '#88BBFF');
    drawPixelRect(x-3, y-8, 6, 2, '#AADDFF');
    // Lights
    const lightOn = Math.sin(gameTime * 5) > 0;
    drawPixelRect(x-12, y+1, 2, 2, lightOn ? '#FF0000' : '#880000');
    drawPixelRect(x+10, y+1, 2, 2, lightOn ? '#00FF00' : '#008800');
    drawPixelRect(x-2, y+2, 2, 1, lightOn ? '#FFFF00' : '#888800');
}

// --- HUD ---
function drawHUD() {
    if (!currentStage) return;

    // Top bar background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, GAME_WIDTH, 44);

    // Stage name
    drawText(currentStage.nameKo, 8, 12, '#FFD700', 8);

    // Distance
    const dist = Math.floor(distance);
    drawText(`${dist}m`, GAME_WIDTH - 8, 12, '#FFFFFF', 8, 'right');

    // Next base progress bar
    const progress = Math.min(distance / currentStage.targetDist, 1);
    drawPixelRect(8, 26, GAME_WIDTH - 16, 6, '#1a1a2a');
    drawPixelRect(8, 26, Math.floor((GAME_WIDTH-16) * progress), 6, '#00FF88');
    drawPixelRect(8, 26, Math.floor((GAME_WIDTH-16) * progress), 2, '#88FFBB');
    // Base icon at end
    drawPixelRect(GAME_WIDTH - 14, 24, 6, 10, '#FFD700');

    // Next base label
    drawText('다음기지', 10, 36, '#888888', 6);

    // Lives (bottom-left)
    for (let i = 0; i < player.lives; i++) {
        drawHeart(12 + i * 16, GAME_HEIGHT - 28, i < player.lives);
    }

    // Booster gauge (bottom-right)
    drawText('BOOST', GAME_WIDTH - 80, GAME_HEIGHT - 36, '#888888', 6);
    for (let i = 0; i < player.maxBooster; i++) {
        const filled = i < player.boosterGauge;
        drawPixelRect(GAME_WIDTH - 80 + i * 14, GAME_HEIGHT - 28, 10, 12, filled ? '#00AAFF' : '#1a1a3a');
        if (filled) {
            drawPixelRect(GAME_WIDTH - 80 + i * 14, GAME_HEIGHT - 28, 10, 4, '#44CCFF');
        }
        drawPixelRect(GAME_WIDTH - 80 + i * 14, GAME_HEIGHT - 28, 10, 1, '#0066AA');
    }
}

function drawHeart(x, y, filled) {
    if (filled) {
        drawPixelRect(x, y+1, 2, 4, '#FF4444');
        drawPixelRect(x+2, y, 2, 5, '#FF4444');
        drawPixelRect(x+4, y+1, 2, 4, '#FF4444');
        drawPixelRect(x+6, y, 2, 5, '#FF4444');
        drawPixelRect(x+8, y+1, 2, 4, '#FF4444');
        drawPixelRect(x+2, y+5, 6, 2, '#FF4444');
        drawPixelRect(x+3, y+7, 4, 1, '#FF4444');
        drawPixelRect(x+4, y+8, 2, 1, '#FF4444');
        // Highlight
        drawPixelRect(x+2, y+1, 2, 2, '#FF8888');
    } else {
        drawPixelRect(x+2, y+1, 6, 1, '#444');
        drawPixelRect(x+1, y+2, 8, 1, '#444');
    }
}

// --- TEXT RENDERING ---
const PIXEL_FONT = {};
function initPixelFont() {
    // We'll use canvas font rendering with pixelated feel
}

function drawText(text, x, y, color, size, align, font) {
    ctx.fillStyle = color || '#FFFFFF';
    ctx.font = `bold ${size || 10}px monospace`;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, Math.floor(x), Math.floor(y));
}

function drawTextOutline(text, x, y, color, outlineColor, size, align) {
    ctx.font = `bold ${size || 10}px monospace`;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';

    // Outline
    ctx.fillStyle = outlineColor || '#000000';
    for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
            if (ox === 0 && oy === 0) continue;
            ctx.fillText(text, Math.floor(x+ox), Math.floor(y+oy));
        }
    }
    // Main text
    ctx.fillStyle = color || '#FFFFFF';
    ctx.fillText(text, Math.floor(x), Math.floor(y));
}

// ============================================
// SCREENS
// ============================================

// --- TITLE SCREEN ---
function updateTitle(dt) {
    titleAnimTimer += dt;
    titleRoverX += 0.5;
    if (titleRoverX > GAME_WIDTH + 50) titleRoverX = -50;
}

function drawTitle() {
    // Background - space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#050510');
    grad.addColorStop(0.6, '#0a0a2a');
    grad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        drawStar(s.x, s.y, s.size, titleAnimTimer * s.speed + s.phase);
    }

    // Large moon in background
    const moonY = 180 + Math.sin(titleAnimTimer * 0.3) * 5;
    drawPixelCircle(GAME_WIDTH/2, moonY, 80, '#C0C0C8');
    drawPixelCircle(GAME_WIDTH/2, moonY, 78, '#D0D0D8');
    // Craters on moon
    drawPixelCircle(GAME_WIDTH/2 - 20, moonY - 15, 12, '#B0B0B8');
    drawPixelCircle(GAME_WIDTH/2 + 30, moonY + 10, 8, '#B8B8C0');
    drawPixelCircle(GAME_WIDTH/2 - 35, moonY + 25, 6, '#A8A8B0');
    drawPixelCircle(GAME_WIDTH/2 + 10, moonY - 30, 10, '#B5B5BD');
    drawPixelCircle(GAME_WIDTH/2 + 25, moonY - 20, 5, '#AAABB3');

    // Earth in corner
    drawEarth(GAME_WIDTH - 50, 70, 25);

    // Ground
    drawPixelRect(0, GROUND_Y + 10, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 10, '#3a3a4a');
    drawPixelRect(0, GROUND_Y + 10, GAME_WIDTH, 3, '#5a5a6a');
    // Ground details
    for (let i = 0; i < 20; i++) {
        drawPixelRect(i * 22 + 5, GROUND_Y + 15, 8, 2, '#2a2a3a');
        drawPixelRect(i * 22 + 12, GROUND_Y + 20, 5, 2, '#323242');
    }

    // Animated rover on ground
    drawRover(titleRoverX, GROUND_Y + 8, titleAnimTimer * 4, 'rover');
    // Dust trail behind rover
    for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.3 - i * 0.07;
        drawPixelRect(titleRoverX - 20 - i*12, GROUND_Y + 6 + i*2, 4, 3, '#8a8a9a');
    }
    ctx.globalAlpha = 1;

    // Title
    const titleY = 350;
    const titleBounce = Math.sin(titleAnimTimer * 1.5) * 3;

    // Title shadow
    drawTextOutline('MOON', GAME_WIDTH/2, titleY + titleBounce + 2, '#000000', '#000000', 48, 'center');
    drawTextOutline('RUNNER', GAME_WIDTH/2, titleY + 48 + titleBounce + 2, '#000000', '#000000', 48, 'center');

    // Title text
    drawTextOutline('MOON', GAME_WIDTH/2, titleY + titleBounce, '#FFD700', '#8B6914', 48, 'center');
    drawTextOutline('RUNNER', GAME_WIDTH/2, titleY + 48 + titleBounce, '#FFFFFF', '#555555', 48, 'center');

    // Subtitle
    drawText('Lunar Gravity Explorer', GAME_WIDTH/2, titleY + 105, '#8888AA', 10, 'center');

    // Tap to start - blinking
    if (Math.sin(titleAnimTimer * 3) > 0) {
        drawTextOutline('TAP TO START', GAME_WIDTH/2, 540, '#FFFFFF', '#333333', 16, 'center');
    }

    // Version
    drawText('v1.0', GAME_WIDTH - 10, GAME_HEIGHT - 16, '#333344', 8, 'right');
}

// --- CHARACTER SELECT SCREEN ---
function drawCharSelect() {
    // BG
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#08081a');
    grad.addColorStop(1, '#151530');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        drawStar(s.x, s.y, s.size, gameTime * s.speed + s.phase);
    }

    // Title
    drawTextOutline('캐릭터 선택', GAME_WIDTH/2, 30, '#FFD700', '#000', 20, 'center');
    drawText('CHARACTER SELECT', GAME_WIDTH/2, 55, '#8888AA', 8, 'center');

    // Total distance info
    drawText(`총 누적거리: ${Math.floor(saveData.totalDistance)}m`, GAME_WIDTH/2, 80, '#AAAACC', 9, 'center');

    uiButtons = [];

    // Character cards
    const cardW = 160;
    const cardH = 140;
    const startY = 110;

    for (let i = 0; i < CHARACTERS.length; i++) {
        const c = CHARACTERS[i];
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = 30 + col * (cardW + 20);
        const cy = startY + row * (cardH + 15);
        const isUnlocked = saveData.totalDistance >= c.unlockDist;
        const isSelected = saveData.selectedChar === c.id;

        // Card bg
        ctx.fillStyle = isSelected ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(cx, cy, cardW, cardH);

        // Border
        ctx.strokeStyle = isSelected ? '#FFD700' : (isUnlocked ? '#555566' : '#333344');
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(cx, cy, cardW, cardH);

        if (isUnlocked) {
            // Character preview
            drawRover(cx + cardW/2, cy + 65, gameTime * 3, c.type === 'rover' ? 'rover' : 'astronaut');

            // Name
            drawText(c.nameKo, cx + cardW/2, cy + 90, '#FFFFFF', 10, 'center');
            drawText(c.name, cx + cardW/2, cy + 105, '#888899', 7, 'center');

            // Selected indicator
            if (isSelected) {
                drawText('✓ SELECTED', cx + cardW/2, cy + 120, '#FFD700', 8, 'center');
            }

            uiButtons.push({
                x: cx, y: cy, w: cardW, h: cardH,
                action: 'selectChar', data: c.id
            });
        } else {
            // Locked
            drawText('🔒', cx + cardW/2, cy + 40, '#555566', 24, 'center');
            drawText(c.nameKo, cx + cardW/2, cy + 90, '#555566', 10, 'center');
            drawText(`${c.unlockDist}m 필요`, cx + cardW/2, cy + 108, '#666677', 8, 'center');
        }
    }

    // Back button
    drawButton(20, GAME_HEIGHT - 60, 80, 35, '◀ 뒤로', 'back');

    // Next button
    drawButton(GAME_WIDTH - 120, GAME_HEIGHT - 60, 100, 35, '스테이지 ▶', 'toStageSelect');

    // Hint text
    if (Math.sin(gameTime * 2) > -0.3) {
        drawText('캐릭터를 선택하거나 아무 곳을 탭하세요', GAME_WIDTH/2, GAME_HEIGHT - 20, '#666677', 8, 'center');
        drawText('PC: Enter / ← → 키로 조작', GAME_WIDTH/2, GAME_HEIGHT - 8, '#555566', 7, 'center');
    }
}

// --- STAGE SELECT SCREEN ---
function drawStageSelect() {
    // BG
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#06061a');
    grad.addColorStop(1, '#12122a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        drawStar(s.x, s.y, s.size, gameTime * s.speed + s.phase);
    }

    // Moon map (simplified)
    drawPixelCircle(GAME_WIDTH/2, 130, 70, '#C0C0C8');
    drawPixelCircle(GAME_WIDTH/2, 130, 68, '#D0D0D8');
    // Stage markers on moon
    const stagePositions = [
        { x: GAME_WIDTH/2 + 10, y: 140 },
        { x: GAME_WIDTH/2 - 30, y: 125 },
        { x: GAME_WIDTH/2 - 10, y: 110 },
        { x: GAME_WIDTH/2 + 20, y: 100 },
        { x: GAME_WIDTH/2, y: 80 },
    ];

    for (let i = 0; i < stagePositions.length; i++) {
        const sp = stagePositions[i];
        const isUnlocked = STAGES[i].unlocked;
        const isCleared = saveData.clearedStages.includes(STAGES[i].id);

        if (isCleared) {
            drawPixelCircle(sp.x, sp.y, 5, '#00FF88');
            drawPixelCircle(sp.x, sp.y, 3, '#88FFBB');
        } else if (isUnlocked) {
            const pulse = Math.sin(gameTime * 3) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            drawPixelCircle(sp.x, sp.y, 6, '#FFD700');
            ctx.globalAlpha = 1;
            drawPixelCircle(sp.x, sp.y, 4, '#FFD700');
        } else {
            drawPixelCircle(sp.x, sp.y, 4, '#444455');
        }

        // Connect lines
        if (i > 0) {
            const prev = stagePositions[i-1];
            ctx.strokeStyle = isUnlocked ? '#FFD700' : '#333344';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(sp.x, sp.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Title
    drawTextOutline('스테이지 지도', GAME_WIDTH/2, 20, '#FFD700', '#000', 18, 'center');

    uiButtons = [];

    // Stage cards
    const cardStartY = 220;
    for (let i = 0; i < STAGES.length; i++) {
        const stage = STAGES[i];
        const cy = cardStartY + i * 72;
        const isCleared = saveData.clearedStages.includes(stage.id);

        // Card
        ctx.fillStyle = stage.unlocked ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
        ctx.fillRect(15, cy, GAME_WIDTH - 30, 62);

        ctx.strokeStyle = isCleared ? '#00FF88' : (stage.unlocked ? '#555566' : '#222233');
        ctx.lineWidth = 1;
        ctx.strokeRect(15, cy, GAME_WIDTH - 30, 62);

        // Stage number
        drawTextOutline(`${stage.id}`, 35, cy + 8,
            isCleared ? '#00FF88' : (stage.unlocked ? '#FFD700' : '#444455'), '#000', 22, 'center');

        // Stage name
        drawText(stage.nameKo, 55, cy + 8, stage.unlocked ? '#FFFFFF' : '#555566', 11);
        drawText(stage.name, 55, cy + 24, stage.unlocked ? '#8888AA' : '#333344', 7);

        // Description
        drawText(stage.description, 55, cy + 38, stage.unlocked ? '#777788' : '#333344', 7);

        // Best score
        if (stage.unlocked && saveData.highScores[i] > 0) {
            drawText(`BEST: ${saveData.highScores[i]}m`, GAME_WIDTH - 30, cy + 8, '#FFD700', 8, 'right');
        }

        // Badge
        if (isCleared) {
            drawText('✓ CLEAR', GAME_WIDTH - 30, cy + 42, '#00FF88', 9, 'right');
        }

        // Difficulty dots
        if (stage.unlocked) {
            for (let d = 0; d < 5; d++) {
                drawPixelRect(GAME_WIDTH - 30 - (5-d)*8, cy + 26, 5, 5,
                    d < stage.id ? '#FF6644' : '#333344');
            }
        }

        if (stage.unlocked) {
            uiButtons.push({
                x: 15, y: cy, w: GAME_WIDTH - 30, h: 62,
                action: 'startStage', data: i
            });
        }
    }

    // Back button
    drawButton(20, GAME_HEIGHT - 55, 80, 35, '◀ 뒤로', 'toCharSelect');
}

// --- STAGE CLEAR SCREEN ---
function drawStageClear() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars celebration
    for (let i = 0; i < 30; i++) {
        const angle = (gameTime * 0.5 + i * 0.2) % (Math.PI * 2);
        const r = 50 + i * 5 + Math.sin(gameTime + i) * 20;
        const sx = GAME_WIDTH/2 + Math.cos(angle) * r;
        const sy = 200 + Math.sin(angle) * r * 0.4;
        drawStar(sx, sy, 1 + (i % 3), gameTime * 2 + i);
    }

    drawTextOutline('STAGE CLEAR!', GAME_WIDTH/2, 150, '#FFD700', '#8B6914', 28, 'center');
    drawTextOutline('스테이지 클리어!', GAME_WIDTH/2, 190, '#FFFFFF', '#333', 16, 'center');

    // Distance
    drawText(`달린 거리: ${Math.floor(distance)}m`, GAME_WIDTH/2, 250, '#AAAACC', 12, 'center');

    // Badge
    if (currentStage) {
        const badgeIdx = currentStage.id - 1;
        const bc = BADGE_COLORS[badgeIdx];
        const bx = GAME_WIDTH/2;
        const by = 340;

        // Badge circle
        drawPixelCircle(bx, by, 30, bc[0]);
        drawPixelCircle(bx, by, 27, bc[1]);
        drawPixelCircle(bx, by, 24, '#1a1a2a');

        // Stage number in badge
        drawTextOutline(`${currentStage.id}`, bx, by - 8, bc[0], '#000', 20, 'center');

        drawText('뱃지 획득!', bx, by + 40, '#FFD700', 10, 'center');
        drawText(currentStage.nameKo, bx, by + 55, '#AAAACC', 9, 'center');
    }

    uiButtons = [];
    drawButton(GAME_WIDTH/2 - 60, 450, 120, 40, '계속하기', 'toStageSelect');
}

// --- GAME OVER SCREEN ---
function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawTextOutline('GAME OVER', GAME_WIDTH/2, 150, '#FF4444', '#880000', 32, 'center');

    // Distance
    drawText(`달린 거리: ${Math.floor(distance)}m`, GAME_WIDTH/2, 220, '#FFFFFF', 12, 'center');

    // High score
    if (currentStage) {
        const stageIdx = currentStage.id - 1;
        if (distance > saveData.highScores[stageIdx]) {
            drawText('★ NEW RECORD! ★', GAME_WIDTH/2, 250, '#FFD700', 14, 'center');
        }
    }

    // Random moon fact
    const factIdx = Math.floor(gameTime * 7) % MOON_FACTS.length;
    const fact = MOON_FACTS[factIdx];

    // Fact box
    ctx.fillStyle = 'rgba(30,30,60,0.8)';
    ctx.fillRect(20, 300, GAME_WIDTH - 40, 80);
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 300, GAME_WIDTH - 40, 80);

    drawText('🌙 달에 대한 사실', GAME_WIDTH/2, 310, '#FFD700', 10, 'center');

    // Word wrap the fact
    wrapText(fact, GAME_WIDTH/2, 335, GAME_WIDTH - 60, 14, '#CCCCDD', 10, 'center');

    uiButtons = [];
    drawButton(GAME_WIDTH/2 - 70, 420, 140, 40, '다시 도전', 'retry');
    drawButton(GAME_WIDTH/2 - 70, 475, 140, 40, '스테이지 선택', 'toStageSelect');
}

function wrapText(text, x, y, maxWidth, lineHeight, color, size, align) {
    ctx.font = `bold ${size}px monospace`;
    const words = text.split('');
    let line = '';
    let lineY = y;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line.length > 0) {
            drawText(line, x, lineY, color, size, align);
            line = words[i];
            lineY += lineHeight;
        } else {
            line = testLine;
        }
    }
    drawText(line, x, lineY, color, size, align);
}

function drawButton(x, y, w, h, text, action) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    drawText(text, x + w/2, y + h/2 - 6, '#FFFFFF', 11, 'center');

    uiButtons.push({ x, y, w, h, action, data: null });
}

// ============================================
// GAME LOGIC
// ============================================

function initStars() {
    bgStars = [];
    for (let i = 0; i < 100; i++) {
        bgStars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * (GROUND_Y - 50),
            size: Math.random() > 0.8 ? 2 : 1,
            speed: 0.5 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function initGame(stageIdx) {
    currentStage = STAGES[stageIdx];
    distance = 0;
    scrollSpeed = currentStage.speed;
    obstacles = [];
    energyItems = [];
    bgObjects = [];
    particles = [];
    groundTiles = [];

    player.y = GROUND_Y;
    player.vy = 0;
    player.isJumping = false;
    player.boosterGauge = currentStage.boosterCount;
    player.maxBooster = currentStage.boosterCount;
    player.lives = 3;
    player.invincible = 0;
    player.animFrame = 0;
    player.dustParticles = [];

    // Init background layers
    bgLayers.forEach(l => l.offset = 0);

    // Init ground tiles
    for (let i = 0; i < Math.ceil(GAME_WIDTH / 20) + 2; i++) {
        groundTiles.push({
            x: i * 20,
            height: 3 + Math.random() * 5,
            shade: Math.random() * 0.2
        });
    }

    // Init some background objects
    initBgObjects();

    gameState = 'playing';
}

function initBgObjects() {
    // Add initial bg objects based on stage events
    if (!currentStage) return;

    // Always add distant mountains
    for (let i = 0; i < 8; i++) {
        bgObjects.push({
            type: 'mountain',
            x: i * 80 + Math.random() * 40,
            y: GROUND_Y + 10,
            w: 30 + Math.random() * 40,
            h: 20 + Math.random() * 30,
            layer: 2,
            color: '#2a2a3a'
        });
    }

    // Add event objects
    if (currentStage.events.includes('earth')) {
        bgObjects.push({
            type: 'earth',
            x: GAME_WIDTH - 60,
            y: 60,
            size: 22,
            layer: 1
        });
    }
}

function jump() {
    if (gameState !== 'playing') return;

    if (!player.isJumping) {
        // First jump from ground
        player.vy = JUMP_FORCE;
        player.isJumping = true;
        addDustBurst(player.x, GROUND_Y);
    } else if (player.boosterGauge > 0) {
        // Air boost (double jump / booster)
        player.vy = JUMP_FORCE * 0.8;
        player.boosterGauge--;
        player.boosterRechargeTimer = 0;
        addBoostEffect(player.x, player.y);
    }
}

function addDustBurst(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 1.5,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            size: 1 + Math.random() * 2,
            color: '#8a8a9a',
            type: 'dust'
        });
    }
}

function addBoostEffect(x, y) {
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + 10,
            vx: (Math.random() - 0.5) * 1,
            vy: Math.random() * 2,
            life: 20 + Math.random() * 10,
            maxLife: 30,
            size: 2 + Math.random() * 2,
            color: '#00AAFF',
            type: 'boost'
        });
    }
}

function addHitEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 20 + Math.random() * 15,
            maxLife: 35,
            size: 2 + Math.random() * 3,
            color: '#FF4444',
            type: 'hit'
        });
    }
    screenShake = 10;
}

function updateGame(dt) {
    if (!currentStage) return;

    gameTime += dt;
    const spd = scrollSpeed * (1 + distance * 0.00005); // Gradual speed increase

    // Update distance
    distance += spd * 0.5;

    // Check stage clear
    if (distance >= currentStage.targetDist) {
        stageClear();
        return;
    }

    // Update parallax
    bgLayers.forEach(l => {
        l.offset += spd * l.speed;
    });

    // Player physics - LUNAR GRAVITY (very floaty)
    if (player.isJumping) {
        player.vy += LUNAR_GRAVITY;
        player.y += player.vy;

        if (player.y >= GROUND_Y) {
            player.y = GROUND_Y;
            player.vy = 0;
            player.isJumping = false;
            addDustBurst(player.x, GROUND_Y);
        }
    }

    // Booster recharge (slow)
    if (!player.isJumping && player.boosterGauge < player.maxBooster) {
        player.boosterRechargeTimer += dt;
        if (player.boosterRechargeTimer > 3) { // 3 seconds to recharge one
            player.boosterGauge++;
            player.boosterRechargeTimer = 0;
        }
    }

    // Invincibility timer
    if (player.invincible > 0) {
        player.invincible -= dt;
    }

    // Animation
    if (!player.isJumping) {
        player.animTimer += dt * spd * 2;
        player.animFrame = player.animTimer;
    }

    // Spawn obstacles
    if (Math.random() < currentStage.obstacleFreq * spd) {
        spawnObstacle();
    }

    // Spawn energy
    if (Math.random() < currentStage.energyFreq) {
        spawnEnergy();
    }

    // Spawn bg events
    spawnBgEvents(spd);

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= spd * 2;
        if (obstacles[i].x < -50) {
            obstacles.splice(i, 1);
            continue;
        }

        // Collision check
        if (player.invincible <= 0 && checkCollision(player, obstacles[i])) {
            hitPlayer();
            obstacles.splice(i, 1);
        }
    }

    // Update energy items
    for (let i = energyItems.length - 1; i >= 0; i--) {
        energyItems[i].x -= spd * 2;
        energyItems[i].frame++;
        if (energyItems[i].x < -20) {
            energyItems.splice(i, 1);
            continue;
        }

        if (checkCollisionEnergy(player, energyItems[i])) {
            collectEnergy(energyItems[i]);
            energyItems.splice(i, 1);
        }
    }

    // Update bg objects
    for (let i = bgObjects.length - 1; i >= 0; i--) {
        const obj = bgObjects[i];
        if (obj.layer !== undefined) {
            obj.x -= spd * bgLayers[obj.layer].speed;
        }
        if (obj.x < -100) {
            bgObjects.splice(i, 1);
        }
        // Special updates
        if (obj.type === 'meteor') {
            obj.x -= 1.5;
            obj.y += 1;
            if (obj.y > GROUND_Y) {
                addDustBurst(obj.x, GROUND_Y);
                bgObjects.splice(i, 1);
            }
        }
        if (obj.type === 'shooting_star') {
            obj.x -= 4;
            obj.y += 1.5;
            obj.life--;
            if (obj.life <= 0) bgObjects.splice(i, 1);
        }
    }

    // Update ground tiles
    for (let i = groundTiles.length - 1; i >= 0; i--) {
        groundTiles[i].x -= spd * 2;
        if (groundTiles[i].x < -25) {
            groundTiles[i].x = GAME_WIDTH + 5;
            groundTiles[i].height = 3 + Math.random() * 5;
            groundTiles[i].shade = Math.random() * 0.2;
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.type === 'dust') p.vy += 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Screen shake decay
    if (screenShake > 0) screenShake *= 0.85;
    if (screenShake < 0.5) screenShake = 0;
}

function spawnObstacle() {
    const types = ['rock', 'crater', 'puddle'];
    const type = types[Math.floor(Math.random() * types.length)];

    let obs = {
        x: GAME_WIDTH + 20,
        y: GROUND_Y,
        type: type,
        width: 20,
        height: 15
    };

    switch(type) {
        case 'rock':
            const size = 0.8 + Math.random() * 0.7;
            obs.size = size;
            obs.width = 16 * size;
            obs.height = 14 * size;
            obs.y = GROUND_Y;
            break;
        case 'crater':
            obs.width = 25 + Math.random() * 15;
            obs.height = 6;
            obs.y = GROUND_Y + 2;
            break;
        case 'puddle':
            obs.width = 25 + Math.random() * 15;
            obs.height = 5;
            obs.y = GROUND_Y + 2;
            break;
    }

    // Check minimum distance from last obstacle
    if (obstacles.length > 0) {
        const last = obstacles[obstacles.length - 1];
        if (GAME_WIDTH + 20 - last.x < 80) return;
    }

    obstacles.push(obs);
}

function spawnEnergy() {
    if (energyItems.length > 3) return;

    energyItems.push({
        x: GAME_WIDTH + 20,
        y: GROUND_Y - 40 - Math.random() * 60,
        frame: 0,
        type: 'energy'
    });
}

function spawnBgEvents(spd) {
    if (!currentStage) return;

    // Random background events
    if (Math.random() < 0.002) {
        const events = currentStage.events;
        const evt = events[Math.floor(Math.random() * events.length)];

        switch(evt) {
            case 'shooting_star':
                bgObjects.push({
                    type: 'shooting_star',
                    x: GAME_WIDTH + 20,
                    y: 20 + Math.random() * 100,
                    len: 8 + Math.random() * 12,
                    life: 60,
                    layer: undefined
                });
                break;
            case 'meteor':
                bgObjects.push({
                    type: 'meteor',
                    x: GAME_WIDTH + 50,
                    y: -20,
                    size: 4 + Math.random() * 4,
                    layer: undefined
                });
                break;
            case 'rocket':
                bgObjects.push({
                    type: 'rocket',
                    x: GAME_WIDTH + 20,
                    y: 50 + Math.random() * 100,
                    layer: 1
                });
                break;
            case 'spaceship':
                bgObjects.push({
                    type: 'spaceship',
                    x: GAME_WIDTH + 30,
                    y: 30 + Math.random() * 80,
                    layer: 1
                });
                break;
            case 'planets':
                bgObjects.push({
                    type: 'planet',
                    x: GAME_WIDTH + 30,
                    y: 30 + Math.random() * 60,
                    size: 8 + Math.random() * 12,
                    color: ['#8B4513', '#4169E1', '#FF6347', '#9370DB'][Math.floor(Math.random()*4)],
                    layer: 1
                });
                break;
        }
    }

    // Replenish mountains
    const maxMountainX = bgObjects.filter(o => o.type === 'mountain').reduce((max, o) => Math.max(max, o.x), 0);
    if (maxMountainX < GAME_WIDTH + 50) {
        bgObjects.push({
            type: 'mountain',
            x: GAME_WIDTH + 20 + Math.random() * 40,
            y: GROUND_Y + 10,
            w: 30 + Math.random() * 40,
            h: 20 + Math.random() * 30,
            layer: 2,
            color: '#2a2a3a'
        });
    }
}

function checkCollision(player, obs) {
    // Simple AABB
    const px = player.x - 10;
    const py = player.y - 24;
    const pw = 20;
    const ph = 28;

    const ox = obs.x - obs.width/2;
    const oy = obs.y - obs.height;
    const ow = obs.width;
    const oh = obs.height;

    return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
}

function checkCollisionEnergy(player, energy) {
    const dx = player.x - energy.x;
    const dy = (player.y - 12) - energy.y;
    return Math.sqrt(dx*dx + dy*dy) < 20;
}

function hitPlayer() {
    player.lives--;
    player.invincible = 2; // 2 seconds invincibility
    addHitEffect(player.x, player.y);

    if (player.lives <= 0) {
        gameOver();
    }
}

function collectEnergy(item) {
    if (player.boosterGauge < player.maxBooster) {
        player.boosterGauge++;
    }
    // Sparkle effect
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: item.x,
            y: item.y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 20,
            maxLife: 20,
            size: 2,
            color: '#00FFAA',
            type: 'sparkle'
        });
    }
}

function stageClear() {
    gameState = 'stageCleared';

    // Save progress
    const stageIdx = currentStage.id - 1;
    if (!saveData.clearedStages.includes(currentStage.id)) {
        saveData.clearedStages.push(currentStage.id);
    }
    if (distance > saveData.highScores[stageIdx]) {
        saveData.highScores[stageIdx] = Math.floor(distance);
    }
    saveData.totalDistance += Math.floor(distance);

    // Unlock next stage
    if (stageIdx + 1 < STAGES.length) {
        STAGES[stageIdx + 1].unlocked = true;
    }

    // Badge
    if (!saveData.badges.includes(currentStage.id)) {
        saveData.badges.push(currentStage.id);
    }

    saveSave();
}

function gameOver() {
    gameState = 'gameOver';

    // Save distance
    const stageIdx = currentStage.id - 1;
    if (distance > saveData.highScores[stageIdx]) {
        saveData.highScores[stageIdx] = Math.floor(distance);
    }
    saveData.totalDistance += Math.floor(distance);
    saveSave();
}

// ============================================
// DRAWING - GAME SCREEN
// ============================================

function drawGame() {
    if (!currentStage) return;

    // Apply screen shake
    ctx.save();
    if (screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
    }

    // Sky background
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, currentStage.bgColor);
    grad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y + 10);

    // Stars (layer 0)
    for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        const sx = ((s.x - bgLayers[0].offset * s.speed * 0.2) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
        drawStar(sx, s.y, s.size, gameTime * s.speed + s.phase);
    }

    // Background objects (layer 1 - far)
    bgObjects.filter(o => o.layer === 1).forEach(obj => {
        switch(obj.type) {
            case 'earth': drawEarth(obj.x, obj.y, obj.size); break;
            case 'rocket': drawRocket(obj.x, obj.y); break;
            case 'spaceship': drawSpaceship(obj.x, obj.y); break;
            case 'planet':
                drawPixelCircle(Math.floor(obj.x), Math.floor(obj.y), obj.size, obj.color);
                drawPixelCircle(Math.floor(obj.x)-2, Math.floor(obj.y)-2, obj.size-3, shadeColor(obj.color, 20));
                break;
        }
    });

    // Background objects (layer 2 - mountains)
    bgObjects.filter(o => o.layer === 2).forEach(obj => {
        if (obj.type === 'mountain') {
            drawMountain(obj.x, obj.y, obj.w, obj.h, obj.color);
        }
    });

    // Floating bg objects (no layer)
    bgObjects.filter(o => o.layer === undefined).forEach(obj => {
        switch(obj.type) {
            case 'shooting_star': drawShootingStar(obj.x, obj.y, obj.len); break;
            case 'meteor': drawMeteor(obj.x, obj.y, obj.size); break;
        }
    });

    // Ground
    ctx.fillStyle = currentStage.groundColor;
    ctx.fillRect(0, GROUND_Y + 5, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    // Ground surface line
    drawPixelRect(0, GROUND_Y + 5, GAME_WIDTH, 3, currentStage.groundAccent);

    // Ground detail tiles
    groundTiles.forEach(tile => {
        ctx.fillStyle = `rgba(0,0,0,${0.1 + tile.shade})`;
        ctx.fillRect(Math.floor(tile.x), GROUND_Y + 10, 12, tile.height);
    });

    // Small rocks on ground
    for (let i = 0; i < 15; i++) {
        const rx = ((i * 37 + 10 - bgLayers[3].offset * 0.5) % (GAME_WIDTH + 40)) - 20;
        drawPixelRect(Math.floor(rx), GROUND_Y + 8 + (i % 3) * 4, 2 + (i % 2), 1 + (i % 2), '#3a3a4a');
    }

    // Obstacles
    obstacles.forEach(obs => {
        switch(obs.type) {
            case 'rock': drawRock(obs.x, obs.y, obs.size); break;
            case 'crater': drawCrater(obs.x, obs.y, obs.width); break;
            case 'puddle': drawPuddle(obs.x, obs.y, obs.width); break;
        }
    });

    // Energy items
    energyItems.forEach(e => {
        drawEnergy(e.x, e.y, e.frame);
    });

    // Player
    if (player.invincible > 0) {
        // Blink when invincible
        if (Math.sin(player.invincible * 15) > 0) {
            const charType = CHARACTERS.find(c => c.id === saveData.selectedChar)?.type || 'rover';
            drawRover(player.x, player.y, player.animFrame, charType);
        }
    } else {
        const charType = CHARACTERS.find(c => c.id === saveData.selectedChar)?.type || 'rover';
        drawRover(player.x, player.y, player.animFrame, charType);
    }

    // Jump indicator (shadow on ground when jumping)
    if (player.isJumping) {
        const shadowScale = 1 - (GROUND_Y - player.y) / 200;
        ctx.globalAlpha = 0.3 * shadowScale;
        drawPixelRect(player.x - 8 * shadowScale, GROUND_Y + 6, 16 * shadowScale, 3, '#000000');
        ctx.globalAlpha = 1;
    }

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        drawPixelRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size, p.color);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    // HUD (not affected by shake)
    drawHUD();
}

function shadeColor(color, amount) {
    let r = parseInt(color.slice(1,3), 16) + amount;
    let g = parseInt(color.slice(3,5), 16) + amount;
    let b = parseInt(color.slice(5,7), 16) + amount;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
}

// ============================================
// INPUT HANDLING
// ============================================

function handleInput(x, y) {
    // Convert screen coords to game coords
    const gx = (x - offsetX) / scale;
    const gy = (y - offsetY) / scale;

    switch (gameState) {
        case 'title':
            gameState = 'charSelect';
            break;

        case 'charSelect':
        case 'stageSelect':
        case 'stageCleared':
        case 'gameOver':
            // Check button clicks
            let buttonHit = false;
            for (const btn of uiButtons) {
                if (gx >= btn.x && gx <= btn.x + btn.w && gy >= btn.y && gy <= btn.y + btn.h) {
                    handleButton(btn);
                    buttonHit = true;
                    break;
                }
            }
            // If no button hit, allow tap-to-advance on certain screens
            if (!buttonHit) {
                if (gameState === 'charSelect') {
                    gameState = 'stageSelect';
                } else if (gameState === 'stageCleared') {
                    gameState = 'stageSelect';
                } else if (gameState === 'gameOver') {
                    gameState = 'stageSelect';
                }
            }
            break;

        case 'playing':
            jump();
            break;
    }
}

function handleButton(btn) {
    switch (btn.action) {
        case 'selectChar':
            saveData.selectedChar = btn.data;
            saveSave();
            gameState = 'stageSelect';
            break;
        case 'toStageSelect':
            gameState = 'stageSelect';
            break;
        case 'toCharSelect':
            gameState = 'charSelect';
            break;
        case 'startStage':
            initGame(btn.data);
            break;
        case 'retry':
            if (currentStage) initGame(currentStage.id - 1);
            break;
        case 'back':
            gameState = 'title';
            break;
    }
}

// Touch events
touchArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleInput(touch.clientX, touch.clientY);
}, { passive: false });

// Mouse events
touchArea.addEventListener('mousedown', (e) => {
    handleInput(e.clientX, e.clientY);
});

// Keyboard events
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'playing') {
            jump();
        } else if (gameState === 'title') {
            gameState = 'charSelect';
        }
    }
    if (e.code === 'Enter') {
        e.preventDefault();
        if (gameState === 'title') {
            gameState = 'charSelect';
        } else if (gameState === 'charSelect') {
            gameState = 'stageSelect';
        } else if (gameState === 'stageCleared') {
            gameState = 'stageSelect';
        } else if (gameState === 'gameOver') {
            if (currentStage) initGame(currentStage.id - 1);
        }
    }
    // Number keys 1-5 to start stages (from stage select screen)
    if (gameState === 'stageSelect') {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5 && STAGES[num-1].unlocked) {
            initGame(num - 1);
        }
    }
    // Arrow keys for character select
    if (gameState === 'charSelect') {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            e.preventDefault();
            const unlockedChars = CHARACTERS.filter(c => saveData.totalDistance >= c.unlockDist);
            const currentIdx = unlockedChars.findIndex(c => c.id === saveData.selectedChar);
            let newIdx;
            if (e.code === 'ArrowRight') {
                newIdx = (currentIdx + 1) % unlockedChars.length;
            } else {
                newIdx = (currentIdx - 1 + unlockedChars.length) % unlockedChars.length;
            }
            saveData.selectedChar = unlockedChars[newIdx].id;
            saveSave();
        }
    }
    // Escape to go back
    if (e.code === 'Escape') {
        if (gameState === 'charSelect') gameState = 'title';
        else if (gameState === 'stageSelect') gameState = 'charSelect';
    }
});

// ============================================
// RESIZE HANDLING
// ============================================

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Calculate scale to fit
    const scaleX = w / GAME_WIDTH;
    const scaleY = h / GAME_HEIGHT;
    scale = Math.min(scaleX, scaleY);

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    // CSS scaling
    canvas.style.width = `${GAME_WIDTH * scale}px`;
    canvas.style.height = `${GAME_HEIGHT * scale}px`;

    offsetX = (w - GAME_WIDTH * scale) / 2;
    offsetY = (h - GAME_HEIGHT * scale) / 2;

    canvas.style.marginLeft = `${offsetX}px`;
    canvas.style.marginTop = `${offsetY}px`;

    // Disable smoothing for pixel art
    ctx.imageSmoothingEnabled = false;
}

window.addEventListener('resize', resize);
resize();

// ============================================
// MAIN LOOP
// ============================================

let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // Clear
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Update & Draw based on state
    switch (gameState) {
        case 'title':
            updateTitle(dt);
            drawTitle();
            break;
        case 'charSelect':
            gameTime += dt;
            drawCharSelect();
            break;
        case 'stageSelect':
            gameTime += dt;
            drawStageSelect();
            break;
        case 'playing':
            updateGame(dt);
            drawGame();
            break;
        case 'stageCleared':
            gameTime += dt;
            drawStageClear();
            break;
        case 'gameOver':
            gameTime += dt;
            drawGameOver();
            break;
    }

    requestAnimationFrame(gameLoop);
}

// Initialize
initStars();
requestAnimationFrame(gameLoop);
