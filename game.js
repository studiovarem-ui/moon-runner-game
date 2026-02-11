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
const LUNAR_GRAVITY = 0.027;   // 3x slower than before (was 0.08)
const JUMP_FORCE = -2.2;       // Adjusted for slower gravity - long floaty jump
const GROUND_Y = 560;
const SPRITE_SCALE = 1.3;      // 30% bigger sprites

// --- GAME STATE ---
let gameState = 'title';
let scale = 1;
let offsetX = 0;
let offsetY = 0;

// --- STAGE DATA (speeds reduced ~3x from original) ---
const STAGES = [
    {
        id: 1,
        name: 'Mare Tranquillitatis',
        nameKo: '고요의 바다',
        description: '아폴로 11호 착륙 지점. 비교적 평탄한 지형.',
        speed: 0.35,
        obstacleFreq: 0.008,
        energyFreq: 0.006,
        boosterCount: 5,
        targetDist: 800,
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
        speed: 0.45,
        obstacleFreq: 0.011,
        energyFreq: 0.005,
        boosterCount: 4,
        targetDist: 1200,
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
        speed: 0.55,
        obstacleFreq: 0.014,
        energyFreq: 0.004,
        boosterCount: 3,
        targetDist: 1600,
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
        speed: 0.65,
        obstacleFreq: 0.017,
        energyFreq: 0.003,
        boosterCount: 2,
        targetDist: 2000,
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
        speed: 0.75,
        obstacleFreq: 0.020,
        energyFreq: 0.002,
        boosterCount: 1,
        targetDist: 2500,
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

// --- MOON FACTS (expanded with images/types for card) ---
const MOON_FACTS = [
    { title: '달의 중력', text: '달의 중력은 지구의 약 1/6입니다.\n몸무게 60kg인 사람은 달에서 10kg!', icon: 'gravity', color: '#4488FF' },
    { title: '달까지 거리', text: '달에서 지구까지의 평균 거리는\n384,400km입니다.', icon: 'distance', color: '#44AAFF' },
    { title: '달의 온도', text: '달의 표면 온도는\n낮에 127°C, 밤에 -173°C입니다.', icon: 'temp', color: '#FF6644' },
    { title: '달의 공전', text: '달은 지구 주위를\n29.5일에 한 바퀴 돕니다.', icon: 'orbit', color: '#AABB44' },
    { title: '달의 크기', text: '달의 지름은 3,474km로\n지구의 약 1/4입니다.', icon: 'size', color: '#CC88FF' },
    { title: '달의 대기', text: '달에는 대기가 거의 없습니다.\n하늘이 항상 검은 이유!', icon: 'atmo', color: '#334466' },
    { title: 'Apollo 11', text: '아폴로 11호는 1969년 7월 20일\n달에 착륙했습니다.', icon: 'apollo', color: '#FFD700' },
    { title: '달의 뒷면', text: '달의 뒷면은 지구에서\n볼 수 없습니다. (동주기 자전)', icon: 'darkside', color: '#556688' },
    { title: '달의 바다', text: '달 표면의 어두운 부분을\n"바다(Mare)"라고 부릅니다.', icon: 'mare', color: '#3355AA' },
    { title: '달의 나이', text: '달의 나이는 약 45억 년으로\n지구와 거의 같습니다.', icon: 'age', color: '#AA8855' },
    { title: '닐 암스트롱', text: '닐 암스트롱이 최초로\n달을 밟은 인간입니다.', icon: 'footprint', color: '#DDDDEE' },
    { title: '달의 먼지', text: '달 먼지(레골리스)는 매우\n미세하고 날카롭습니다.', icon: 'dust', color: '#998877' },
    { title: '달의 소리', text: '달에서는 소리가 전달되지\n않습니다. (진공 상태)', icon: 'silent', color: '#667788' },
    { title: '달의 얼음', text: '달의 극지방 크레이터에는\n물(얼음)이 존재합니다.', icon: 'ice', color: '#88DDFF' },
    { title: '달의 질량', text: '달의 질량은 지구의\n약 1/81입니다.', icon: 'mass', color: '#BB99DD' },
];

// --- BADGE DATA ---
const BADGE_COLORS = [
    ['#FFD700', '#FFA500'],
    ['#C0C0C0', '#808080'],
    ['#4169E1', '#1E90FF'],
    ['#FF4500', '#DC143C'],
    ['#9400D3', '#8A2BE2'],
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
let gameOverFactIdx = -1; // fixed index for game over

// --- PARALLAX LAYERS ---
let bgLayers = [
    { offset: 0, speed: 0.1 },
    { offset: 0, speed: 0.3 },
    { offset: 0, speed: 0.6 },
    { offset: 0, speed: 1.0 },
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

// Rounded rect helper
function drawRoundedRect(x, y, w, h, r, fillColor, strokeColor) {
    x = Math.floor(x); y = Math.floor(y);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
    if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = 2; ctx.stroke(); }
}

// --- ROVER SPRITE (scaled by SPRITE_SCALE) ---
function drawRover(x, y, frame, type = 'rover') {
    const f = Math.floor(frame) % 4;
    x = Math.floor(x);
    y = Math.floor(y);
    const S = SPRITE_SCALE;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(S, S);

    if (type === 'rover') {
        // Body
        drawPixelRect(-12, -16, 24, 10, '#C0C0C0');
        drawPixelRect(-10, -18, 20, 4, '#A0A0B0');
        // Top equipment
        drawPixelRect(-4, -24, 3, 6, '#808090');
        drawPixelRect(-5, -26, 5, 3, '#909098');
        // Antenna
        drawPixelRect(6, -28, 2, 14, '#707080');
        drawPixelRect(4, -30, 6, 3, '#FFD700');
        // Solar panel
        drawPixelRect(-14, -22, 8, 2, '#4169E1');
        drawPixelRect(-14, -20, 8, 1, '#1E90FF');
        // Wheels
        const wb = f === 1 || f === 3 ? 1 : 0;
        drawPixelCircle(-8, -2+wb, 5, '#303040');
        drawPixelCircle(-8, -2+wb, 3, '#505060');
        drawPixelCircle(8, -2+wb, 5, '#303040');
        drawPixelCircle(8, -2+wb, 3, '#505060');
        // Wheel spokes
        if (f % 2 === 0) {
            drawPixelRect(-9, -2+wb, 2, 1, '#707080');
            drawPixelRect(7, -2+wb, 2, 1, '#707080');
        } else {
            drawPixelRect(-8, -3+wb, 1, 2, '#707080');
            drawPixelRect(8, -3+wb, 1, 2, '#707080');
        }
        // Camera eye
        drawPixelRect(10, -16, 5, 4, '#303040');
        drawPixelRect(11, -15, 3, 2, '#00FF88');
    } else {
        // ASTRONAUT
        // Helmet
        drawPixelRect(-7, -32, 14, 14, '#E0E0E8');
        drawPixelRect(-5, -30, 10, 10, '#1a1a3a');
        drawPixelRect(-4, -29, 8, 7, '#2a2a5a');
        drawPixelRect(-3, -29, 3, 1, '#FFD700');
        // Body/suit
        drawPixelRect(-8, -18, 16, 16, '#E8E8F0');
        drawPixelRect(-6, -16, 12, 12, '#D0D0E0');
        // Backpack
        drawPixelRect(-10, -17, 3, 12, '#A0A0B0');
        drawPixelRect(-11, -14, 2, 5, '#808090');
        // Arms
        const as = f % 2 === 0 ? 0 : 1;
        drawPixelRect(-10, -16+as, 3, 10, '#D8D8E8');
        drawPixelRect(7, -16-as, 3, 10, '#D8D8E8');
        // Legs
        const ls = f % 2 === 0 ? 1 : -1;
        drawPixelRect(-6, -2, 5, 7+ls, '#C8C8D8');
        drawPixelRect(1, -2, 5, 7-ls, '#C8C8D8');
        // Boots
        drawPixelRect(-7, 5+ls, 6, 3, '#505060');
        drawPixelRect(0, 5-ls, 6, 3, '#505060');
        // Flag patch
        drawPixelRect(-1, -16, 3, 2, '#FF4444');
        drawPixelRect(-1, -14, 3, 2, '#4444FF');
    }

    ctx.restore();
}

// --- OBSTACLE SPRITES (larger + more visible) ---
function drawRock(x, y, size) {
    x = Math.floor(x); y = Math.floor(y);
    const s = (size || 1) * SPRITE_SCALE;

    // Warning glow
    ctx.globalAlpha = 0.15;
    drawPixelCircle(x, y - 6*s, 12*s, '#FF4444');
    ctx.globalAlpha = 1;

    // Shadow
    drawPixelRect(x-10*s, y+2, 20*s, 4, 'rgba(0,0,0,0.4)');
    // Main rock body - brighter, more contrast
    drawPixelRect(x-8*s, y-12*s, 16*s, 14*s, '#7a6a5a');
    drawPixelRect(x-10*s, y-10*s, 20*s, 10*s, '#8a7a6a');
    drawPixelRect(x-7*s, y-14*s, 14*s, 4*s, '#6a5a4a');
    // Highlight edge
    drawPixelRect(x-6*s, y-12*s, 6*s, 2*s, '#aa9a8a');
    drawPixelRect(x-8*s, y-10*s, 2*s, 6*s, '#9a8a7a');
    // Dark cracks
    drawPixelRect(x+2*s, y-8*s, 2*s, 6*s, '#4a3a2a');
    drawPixelRect(x-3*s, y-5*s, 4*s, 2*s, '#4a3a2a');
    // Top warning stripe
    drawPixelRect(x-4*s, y-14*s, 8*s, 2*s, '#FF8844');
}

function drawCrater(x, y, width) {
    x = Math.floor(x); y = Math.floor(y);
    const w = (width || 35) * SPRITE_SCALE;
    // Outer danger rim
    drawPixelRect(x-w/2-2, y-4, w+4, 2, '#FF6644');
    // Crater rim
    drawPixelRect(x-w/2, y-3, w, 3, '#8a8a9a');
    // Crater hole
    drawPixelRect(x-w/2+3, y, w-6, 8, '#0a0a1a');
    drawPixelRect(x-w/2+5, y+3, w-10, 5, '#050510');
    // Inner glow
    drawPixelRect(x-w/4, y+2, w/2, 2, '#1a1a3a');
    // Rim highlight
    drawPixelRect(x-w/2+3, y-4, w-6, 1, '#aaaabc');
}

function drawPuddle(x, y, width) {
    x = Math.floor(x); y = Math.floor(y);
    const w = (width || 35) * SPRITE_SCALE;
    const shimmer = Math.sin(gameTime * 3) > 0 ? 1 : 0;

    // Danger edge
    drawPixelRect(x-w/2-2, y-2, w+4, 1, '#FF6644');
    // Water body - more visible
    drawPixelRect(x-w/2, y-1, w, 7, '#1a3a5a');
    drawPixelRect(x-w/2+3, y+1, w-6, 4, '#2a5a8a');
    // Surface shine
    drawPixelRect(x-w/4+shimmer*4, y+1, 8, 1, '#6abaee');
    drawPixelRect(x+w/4-shimmer*3, y+2, 6, 1, '#5aaadd');
    // Bubbles
    if (Math.sin(gameTime * 5 + x) > 0.5) {
        drawPixelRect(x-w/6, y-1, 2, 2, '#88ccff');
    }
}

// --- ENERGY ITEM (scaled) ---
function drawEnergy(x, y, frame) {
    x = Math.floor(x); y = Math.floor(y);
    const bob = Math.sin(frame * 0.08) * 4;
    const glow = Math.sin(frame * 0.12) * 0.3 + 0.7;
    const S = SPRITE_SCALE;

    // Glow
    ctx.globalAlpha = glow * 0.3;
    drawPixelCircle(x, y+bob, 10*S, '#00FFAA');
    ctx.globalAlpha = 1;

    // Crystal shape
    drawPixelRect(x-3*S, y-7*S+bob, 6*S, 14*S, '#00FF88');
    drawPixelRect(x-5*S, y-4*S+bob, 10*S, 8*S, '#00FFAA');
    // Highlight
    drawPixelRect(x-2*S, y-5*S+bob, 3*S, 5*S, '#AAFFDD');
    // Sparkle
    drawPixelRect(x, y-8*S+bob, 2, 2, '#FFFFFF');
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
    x = Math.floor(x); y = Math.floor(y);
    const r = size || 20;
    drawPixelCircle(x, y, r, '#1a4a8a');
    drawPixelCircle(x, y, r-1, '#2a6aaa');
    drawPixelRect(x-r/2, y-r/3, r/2, r/3, '#2a8a3a');
    drawPixelRect(x+r/4, y-r/4, r/3, r/2, '#3a9a4a');
    drawPixelRect(x-r/4, y+r/6, r/2, r/4, '#2a8a3a');
    drawPixelRect(x-r/3, y-r/2, r/2, 2, 'rgba(255,255,255,0.5)');
    ctx.globalAlpha = 0.15;
    drawPixelCircle(x, y, r+2, '#88BBFF');
    ctx.globalAlpha = 1;
}

function drawMountain(x, y, w, h, color) {
    x = Math.floor(x); y = Math.floor(y);
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
    x = Math.floor(x); y = Math.floor(y);
    drawPixelCircle(x, y, size, '#8B4513');
    drawPixelCircle(x, y, size-2, '#A0522D');
    drawPixelRect(x-1, y-1, 2, 2, '#CD853F');
    for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.7 - i*0.12;
        drawPixelRect(x+size+i*3, y-size+i*2, 3, 2, i < 2 ? '#FF4500' : '#FF8C00');
    }
    ctx.globalAlpha = 1;
}

function drawRocket(x, y) {
    x = Math.floor(x); y = Math.floor(y);
    drawPixelRect(x-3, y-12, 6, 16, '#E0E0E0');
    drawPixelRect(x-2, y-14, 4, 4, '#D0D0D0');
    drawPixelRect(x-1, y-16, 2, 3, '#FF4444');
    drawPixelRect(x-1, y-8, 2, 2, '#4488FF');
    drawPixelRect(x-5, y, 3, 6, '#FF4444');
    drawPixelRect(x+2, y, 3, 6, '#FF4444');
    const flicker = Math.random() > 0.5 ? 1 : 0;
    drawPixelRect(x-2, y+4, 4, 4+flicker, '#FF8800');
    drawPixelRect(x-1, y+6, 2, 4+flicker, '#FFCC00');
}

function drawSpaceship(x, y) {
    x = Math.floor(x); y = Math.floor(y);
    drawPixelRect(x-10, y-2, 20, 4, '#808090');
    drawPixelRect(x-14, y, 28, 3, '#909098');
    drawPixelRect(x-6, y-6, 12, 5, '#A0A0B0');
    drawPixelRect(x-4, y-9, 8, 4, '#88BBFF');
    drawPixelRect(x-3, y-8, 6, 2, '#AADDFF');
    const lightOn = Math.sin(gameTime * 5) > 0;
    drawPixelRect(x-12, y+1, 2, 2, lightOn ? '#FF0000' : '#880000');
    drawPixelRect(x+10, y+1, 2, 2, lightOn ? '#00FF00' : '#008800');
}

// --- CARD ICONS for game over ---
function drawCardIcon(cx, cy, icon, size) {
    const s = size || 30;
    cx = Math.floor(cx); cy = Math.floor(cy);

    switch(icon) {
        case 'gravity':
            // Arrow down with moon
            drawPixelCircle(cx, cy - 8, 10, '#CCCCDD');
            drawPixelCircle(cx + 3, cy - 10, 3, '#BBBBC8');
            drawPixelRect(cx - 2, cy + 6, 4, 12, '#4488FF');
            drawPixelRect(cx - 5, cy + 14, 10, 3, '#4488FF');
            drawPixelRect(cx - 3, cy + 17, 6, 3, '#4488FF');
            break;
        case 'distance':
            // Earth and moon with line
            drawPixelCircle(cx - 12, cy, 8, '#2a6aaa');
            drawPixelRect(cx - 14, cy - 2, 4, 3, '#2a8a3a');
            drawPixelCircle(cx + 14, cy, 5, '#CCCCDD');
            ctx.strokeStyle = '#666';
            ctx.setLineDash([2, 2]);
            ctx.beginPath(); ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 9, cy); ctx.stroke();
            ctx.setLineDash([]);
            break;
        case 'temp':
            // Thermometer
            drawPixelRect(cx - 2, cy - 15, 4, 22, '#DDDDEE');
            drawPixelCircle(cx, cy + 10, 5, '#DDDDEE');
            drawPixelRect(cx - 1, cy - 8, 2, 16, '#FF4444');
            drawPixelCircle(cx, cy + 10, 3, '#FF4444');
            break;
        case 'orbit':
            drawPixelCircle(cx, cy, 6, '#2a6aaa');
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(cx, cy, 18, 10, 0.3, 0, Math.PI * 2); ctx.stroke();
            drawPixelCircle(cx + 15, cy - 5, 3, '#CCCCDD');
            break;
        case 'apollo':
            // Rocket
            drawPixelRect(cx - 3, cy - 14, 6, 18, '#E0E0E0');
            drawPixelRect(cx - 1, cy - 18, 2, 4, '#FF4444');
            drawPixelRect(cx - 5, cy + 2, 3, 6, '#FF4444');
            drawPixelRect(cx + 2, cy + 2, 3, 6, '#FF4444');
            drawPixelRect(cx - 1, cy - 8, 2, 2, '#4488FF');
            break;
        case 'footprint':
            // Boot print
            drawPixelRect(cx - 4, cy - 10, 8, 4, '#999');
            drawPixelRect(cx - 3, cy - 6, 6, 10, '#888');
            drawPixelRect(cx - 5, cy + 4, 10, 4, '#999');
            drawPixelRect(cx - 2, cy - 4, 1, 8, '#666');
            drawPixelRect(cx + 1, cy - 4, 1, 8, '#666');
            break;
        default:
            // Generic moon
            drawPixelCircle(cx, cy, 14, '#CCCCDD');
            drawPixelCircle(cx, cy, 12, '#DDDDEE');
            drawPixelCircle(cx - 4, cy - 3, 4, '#BBBBC8');
            drawPixelCircle(cx + 5, cy + 2, 3, '#C4C4D0');
            drawPixelCircle(cx - 2, cy + 5, 2, '#BBBBC8');
            break;
    }
}

// --- HUD ---
function drawHUD() {
    if (!currentStage) return;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, GAME_WIDTH, 44);

    drawText(currentStage.nameKo, 8, 12, '#FFD700', 9);

    const dist = Math.floor(distance);
    drawText(`${dist}m`, GAME_WIDTH - 8, 12, '#FFFFFF', 9, 'right');

    const progress = Math.min(distance / currentStage.targetDist, 1);
    drawPixelRect(8, 26, GAME_WIDTH - 16, 8, '#1a1a2a');
    drawPixelRect(8, 26, Math.floor((GAME_WIDTH-16) * progress), 8, '#00FF88');
    drawPixelRect(8, 26, Math.floor((GAME_WIDTH-16) * progress), 3, '#88FFBB');
    drawPixelRect(GAME_WIDTH - 14, 24, 6, 12, '#FFD700');

    drawText('다음기지', 10, 38, '#888888', 7);

    // Lives (bottom-left)
    for (let i = 0; i < player.lives; i++) {
        drawHeart(14 + i * 20, GAME_HEIGHT - 32, true);
    }

    // Booster gauge (bottom-right)
    drawText('BOOST', GAME_WIDTH - 90, GAME_HEIGHT - 40, '#888888', 7);
    for (let i = 0; i < player.maxBooster; i++) {
        const filled = i < player.boosterGauge;
        drawPixelRect(GAME_WIDTH - 90 + i * 16, GAME_HEIGHT - 30, 12, 14, filled ? '#00AAFF' : '#1a1a3a');
        if (filled) {
            drawPixelRect(GAME_WIDTH - 90 + i * 16, GAME_HEIGHT - 30, 12, 5, '#44CCFF');
        }
        drawPixelRect(GAME_WIDTH - 90 + i * 16, GAME_HEIGHT - 30, 12, 1, '#0066AA');
    }
}

function drawHeart(x, y, filled) {
    if (filled) {
        drawPixelRect(x, y+1, 3, 5, '#FF4444');
        drawPixelRect(x+3, y, 3, 6, '#FF4444');
        drawPixelRect(x+6, y+1, 3, 5, '#FF4444');
        drawPixelRect(x+9, y, 3, 6, '#FF4444');
        drawPixelRect(x+12, y+1, 3, 5, '#FF4444');
        drawPixelRect(x+3, y+6, 9, 3, '#FF4444');
        drawPixelRect(x+5, y+9, 5, 2, '#FF4444');
        drawPixelRect(x+6, y+11, 3, 1, '#FF4444');
        drawPixelRect(x+3, y+1, 3, 2, '#FF8888');
    }
}

// --- TEXT ---
function drawText(text, x, y, color, size, align) {
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
    ctx.fillStyle = outlineColor || '#000000';
    for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
            if (ox === 0 && oy === 0) continue;
            ctx.fillText(text, Math.floor(x+ox), Math.floor(y+oy));
        }
    }
    ctx.fillStyle = color || '#FFFFFF';
    ctx.fillText(text, Math.floor(x), Math.floor(y));
}

function wrapText(text, x, y, maxWidth, lineHeight, color, size, align) {
    ctx.font = `bold ${size}px monospace`;
    const lines = text.split('\n');
    let lineY = y;
    for (const rawLine of lines) {
        const chars = rawLine.split('');
        let line = '';
        for (let i = 0; i < chars.length; i++) {
            const testLine = line + chars[i];
            if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
                drawText(line, x, lineY, color, size, align);
                line = chars[i];
                lineY += lineHeight;
            } else {
                line = testLine;
            }
        }
        drawText(line, x, lineY, color, size, align);
        lineY += lineHeight;
    }
}

// ============================================
// SCREENS
// ============================================

function updateTitle(dt) {
    titleAnimTimer += dt;
    titleRoverX += 0.3;
    if (titleRoverX > GAME_WIDTH + 50) titleRoverX = -50;
}

function drawTitle() {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#050510');
    grad.addColorStop(0.6, '#0a0a2a');
    grad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        drawStar(s.x, s.y, s.size, titleAnimTimer * s.speed + s.phase);
    }

    const moonY = 180 + Math.sin(titleAnimTimer * 0.3) * 5;
    drawPixelCircle(GAME_WIDTH/2, moonY, 80, '#C0C0C8');
    drawPixelCircle(GAME_WIDTH/2, moonY, 78, '#D0D0D8');
    drawPixelCircle(GAME_WIDTH/2 - 20, moonY - 15, 12, '#B0B0B8');
    drawPixelCircle(GAME_WIDTH/2 + 30, moonY + 10, 8, '#B8B8C0');
    drawPixelCircle(GAME_WIDTH/2 - 35, moonY + 25, 6, '#A8A8B0');
    drawPixelCircle(GAME_WIDTH/2 + 10, moonY - 30, 10, '#B5B5BD');

    drawEarth(GAME_WIDTH - 50, 70, 25);

    drawPixelRect(0, GROUND_Y + 10, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 10, '#3a3a4a');
    drawPixelRect(0, GROUND_Y + 10, GAME_WIDTH, 3, '#5a5a6a');
    for (let i = 0; i < 20; i++) {
        drawPixelRect(i * 22 + 5, GROUND_Y + 15, 8, 2, '#2a2a3a');
    }

    drawRover(titleRoverX, GROUND_Y + 8, titleAnimTimer * 3, 'rover');
    for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.3 - i * 0.07;
        drawPixelRect(titleRoverX - 25 - i*14, GROUND_Y + 6 + i*2, 5, 4, '#8a8a9a');
    }
    ctx.globalAlpha = 1;

    const titleY = 350;
    const titleBounce = Math.sin(titleAnimTimer * 1.5) * 3;

    drawTextOutline('MOON', GAME_WIDTH/2, titleY + titleBounce, '#FFD700', '#8B6914', 48, 'center');
    drawTextOutline('RUNNER', GAME_WIDTH/2, titleY + 50 + titleBounce, '#FFFFFF', '#555555', 48, 'center');

    drawText('Lunar Gravity Explorer', GAME_WIDTH/2, titleY + 108, '#8888AA', 10, 'center');

    if (Math.sin(titleAnimTimer * 3) > 0) {
        drawTextOutline('TAP TO START', GAME_WIDTH/2, 540, '#FFFFFF', '#333333', 16, 'center');
    }

    drawText('v1.1', GAME_WIDTH - 10, GAME_HEIGHT - 16, '#333344', 8, 'right');
}

// --- CHARACTER SELECT ---
function drawCharSelect() {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#08081a');
    grad.addColorStop(1, '#151530');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        drawStar(s.x, s.y, s.size, gameTime * s.speed + s.phase);
    }

    drawTextOutline('캐릭터 선택', GAME_WIDTH/2, 30, '#FFD700', '#000', 20, 'center');
    drawText('CHARACTER SELECT', GAME_WIDTH/2, 55, '#8888AA', 8, 'center');
    drawText(`총 누적거리: ${Math.floor(saveData.totalDistance)}m`, GAME_WIDTH/2, 80, '#AAAACC', 9, 'center');

    uiButtons = [];

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

        ctx.fillStyle = isSelected ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(cx, cy, cardW, cardH);
        ctx.strokeStyle = isSelected ? '#FFD700' : (isUnlocked ? '#555566' : '#333344');
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(cx, cy, cardW, cardH);

        if (isUnlocked) {
            drawRover(cx + cardW/2, cy + 65, gameTime * 3, c.type);
            drawText(c.nameKo, cx + cardW/2, cy + 90, '#FFFFFF', 10, 'center');
            drawText(c.name, cx + cardW/2, cy + 105, '#888899', 7, 'center');
            if (isSelected) {
                drawText('✓ SELECTED', cx + cardW/2, cy + 120, '#FFD700', 8, 'center');
            }
            uiButtons.push({ x: cx, y: cy, w: cardW, h: cardH, action: 'selectChar', data: c.id });
        } else {
            drawText('🔒', cx + cardW/2, cy + 40, '#555566', 24, 'center');
            drawText(c.nameKo, cx + cardW/2, cy + 90, '#555566', 10, 'center');
            drawText(`${c.unlockDist}m 필요`, cx + cardW/2, cy + 108, '#666677', 8, 'center');
        }
    }

    drawButton(20, GAME_HEIGHT - 60, 80, 35, '◀ 뒤로', 'back');
    drawButton(GAME_WIDTH - 120, GAME_HEIGHT - 60, 100, 35, '스테이지 ▶', 'toStageSelect');

    if (Math.sin(gameTime * 2) > -0.3) {
        drawText('캐릭터를 선택하거나 아무 곳을 탭하세요', GAME_WIDTH/2, GAME_HEIGHT - 20, '#666677', 8, 'center');
        drawText('PC: Enter / ← → 키로 조작', GAME_WIDTH/2, GAME_HEIGHT - 8, '#555566', 7, 'center');
    }
}

// --- STAGE SELECT ---
function drawStageSelect() {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#06061a');
    grad.addColorStop(1, '#12122a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        drawStar(s.x, s.y, s.size, gameTime * s.speed + s.phase);
    }

    drawPixelCircle(GAME_WIDTH/2, 130, 70, '#C0C0C8');
    drawPixelCircle(GAME_WIDTH/2, 130, 68, '#D0D0D8');

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
        } else if (isUnlocked) {
            const pulse = Math.sin(gameTime * 3) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            drawPixelCircle(sp.x, sp.y, 6, '#FFD700');
            ctx.globalAlpha = 1;
            drawPixelCircle(sp.x, sp.y, 4, '#FFD700');
        } else {
            drawPixelCircle(sp.x, sp.y, 4, '#444455');
        }

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

    drawTextOutline('스테이지 지도', GAME_WIDTH/2, 20, '#FFD700', '#000', 18, 'center');

    uiButtons = [];

    const cardStartY = 220;
    for (let i = 0; i < STAGES.length; i++) {
        const stage = STAGES[i];
        const cy = cardStartY + i * 72;
        const isCleared = saveData.clearedStages.includes(stage.id);

        ctx.fillStyle = stage.unlocked ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
        ctx.fillRect(15, cy, GAME_WIDTH - 30, 62);
        ctx.strokeStyle = isCleared ? '#00FF88' : (stage.unlocked ? '#555566' : '#222233');
        ctx.lineWidth = 1;
        ctx.strokeRect(15, cy, GAME_WIDTH - 30, 62);

        drawTextOutline(`${stage.id}`, 35, cy + 8,
            isCleared ? '#00FF88' : (stage.unlocked ? '#FFD700' : '#444455'), '#000', 22, 'center');

        drawText(stage.nameKo, 55, cy + 8, stage.unlocked ? '#FFFFFF' : '#555566', 11);
        drawText(stage.name, 55, cy + 24, stage.unlocked ? '#8888AA' : '#333344', 7);
        drawText(stage.description, 55, cy + 38, stage.unlocked ? '#777788' : '#333344', 7);

        if (stage.unlocked && saveData.highScores[i] > 0) {
            drawText(`BEST: ${saveData.highScores[i]}m`, GAME_WIDTH - 30, cy + 8, '#FFD700', 8, 'right');
        }
        if (isCleared) {
            drawText('✓ CLEAR', GAME_WIDTH - 30, cy + 42, '#00FF88', 9, 'right');
        }
        if (stage.unlocked) {
            for (let d = 0; d < 5; d++) {
                drawPixelRect(GAME_WIDTH - 30 - (5-d)*8, cy + 26, 5, 5, d < stage.id ? '#FF6644' : '#333344');
            }
            uiButtons.push({ x: 15, y: cy, w: GAME_WIDTH - 30, h: 62, action: 'startStage', data: i });
        }
    }

    drawButton(20, GAME_HEIGHT - 55, 80, 35, '◀ 뒤로', 'toCharSelect');
}

// --- STAGE CLEAR (no spinning stars) ---
function drawStageClear() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Simple subtle particles rising
    for (let i = 0; i < 15; i++) {
        const px = 30 + (i * 27) % (GAME_WIDTH - 60);
        const py = GAME_HEIGHT - ((gameTime * 30 + i * 50) % GAME_HEIGHT);
        ctx.globalAlpha = 0.2 + Math.sin(gameTime + i) * 0.15;
        drawPixelRect(px, py, 2, 2, '#FFD700');
    }
    ctx.globalAlpha = 1;

    drawTextOutline('STAGE CLEAR!', GAME_WIDTH/2, 160, '#FFD700', '#8B6914', 28, 'center');
    drawTextOutline('스테이지 클리어!', GAME_WIDTH/2, 200, '#FFFFFF', '#333', 16, 'center');

    drawText(`달린 거리: ${Math.floor(distance)}m`, GAME_WIDTH/2, 260, '#AAAACC', 12, 'center');

    // Badge (clean, no orbiting stars)
    if (currentStage) {
        const badgeIdx = currentStage.id - 1;
        const bc = BADGE_COLORS[badgeIdx];
        const bx = GAME_WIDTH/2;
        const by = 350;

        // Badge outer ring
        drawPixelCircle(bx, by, 32, bc[0]);
        drawPixelCircle(bx, by, 28, bc[1]);
        drawPixelCircle(bx, by, 25, '#1a1a2a');

        // Stage number
        drawTextOutline(`${currentStage.id}`, bx, by - 8, bc[0], '#000', 22, 'center');

        drawText('뱃지 획득!', bx, by + 42, '#FFD700', 11, 'center');
        drawText(currentStage.nameKo, bx, by + 58, '#AAAACC', 9, 'center');
    }

    uiButtons = [];
    drawButton(GAME_WIDTH/2 - 60, 460, 120, 40, '계속하기', 'toStageSelect');
}

// --- GAME OVER (Pokemon card style moon fact) ---
function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawTextOutline('GAME OVER', GAME_WIDTH/2, 80, '#FF4444', '#880000', 32, 'center');

    drawText(`달린 거리: ${Math.floor(distance)}m`, GAME_WIDTH/2, 130, '#FFFFFF', 12, 'center');

    if (currentStage) {
        const stageIdx = currentStage.id - 1;
        if (distance > saveData.highScores[stageIdx]) {
            drawText('★ NEW RECORD! ★', GAME_WIDTH/2, 155, '#FFD700', 14, 'center');
        }
    }

    // --- POKEMON CARD STYLE MOON FACT ---
    if (gameOverFactIdx < 0) gameOverFactIdx = Math.floor(Math.random() * MOON_FACTS.length);
    const fact = MOON_FACTS[gameOverFactIdx];

    const cardX = 40;
    const cardY = 195;
    const cardW = GAME_WIDTH - 80;
    const cardH = 280;

    // Card outer border (holographic feel)
    const hueShift = Math.sin(gameTime) * 20;
    ctx.save();

    // Card shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cardX + 4, cardY + 4, cardW, cardH);

    // Card background
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardGrad.addColorStop(0, '#1a1a3a');
    cardGrad.addColorStop(0.5, '#1e1e40');
    cardGrad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = cardGrad;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Card border
    ctx.strokeStyle = fact.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Inner border
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12);

    // Card header ribbon
    ctx.fillStyle = fact.color;
    ctx.fillRect(cardX, cardY, cardW, 4);

    // Title area
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(cardX + 10, cardY + 14, cardW - 20, 22);
    drawText(`🌙 ${fact.title}`, GAME_WIDTH/2, cardY + 16, fact.color, 12, 'center');

    // Icon area (image section of the card)
    const iconBgY = cardY + 46;
    ctx.fillStyle = 'rgba(0,0,20,0.5)';
    ctx.fillRect(cardX + 15, iconBgY, cardW - 30, 90);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(cardX + 15, iconBgY, cardW - 30, 90);

    // Draw the icon centered
    drawCardIcon(GAME_WIDTH/2, iconBgY + 45, fact.icon, 30);

    // Separator line
    ctx.fillStyle = fact.color;
    ctx.fillRect(cardX + 20, iconBgY + 100, cardW - 40, 2);

    // Description text area
    const textY = iconBgY + 112;
    wrapText(fact.text, GAME_WIDTH/2, textY, cardW - 50, 16, '#CCCCDD', 10, 'center');

    // Card category tag
    ctx.fillStyle = fact.color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(cardX + 10, cardY + cardH - 28, 60, 18);
    ctx.globalAlpha = 1;
    drawText('MOON', cardX + 14, cardY + cardH - 25, '#FFFFFF', 8);

    // Card number
    drawText(`#${String(gameOverFactIdx + 1).padStart(2, '0')}/${MOON_FACTS.length}`, cardX + cardW - 55, cardY + cardH - 25, '#666688', 8);

    // Sparkle on card edge
    if (Math.sin(gameTime * 4) > 0.7) {
        drawPixelRect(cardX + 2, cardY + 2, 3, 3, '#FFFFFF');
    }
    if (Math.sin(gameTime * 3 + 1) > 0.7) {
        drawPixelRect(cardX + cardW - 5, cardY + cardH - 5, 3, 3, '#FFFFFF');
    }

    ctx.restore();

    uiButtons = [];
    drawButton(GAME_WIDTH/2 - 70, 510, 140, 40, '다시 도전', 'retry');
    drawButton(GAME_WIDTH/2 - 70, 565, 140, 40, '스테이지 선택', 'toStageSelect');
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
    gameOverFactIdx = -1;

    player.y = GROUND_Y;
    player.vy = 0;
    player.isJumping = false;
    player.boosterGauge = currentStage.boosterCount;
    player.maxBooster = currentStage.boosterCount;
    player.lives = 3;
    player.invincible = 0;
    player.animFrame = 0;
    player.animTimer = 0;
    player.dustParticles = [];

    bgLayers.forEach(l => l.offset = 0);

    for (let i = 0; i < Math.ceil(GAME_WIDTH / 20) + 2; i++) {
        groundTiles.push({
            x: i * 20,
            height: 3 + Math.random() * 5,
            shade: Math.random() * 0.2
        });
    }

    initBgObjects();
    gameState = 'playing';
}

function initBgObjects() {
    if (!currentStage) return;
    for (let i = 0; i < 8; i++) {
        bgObjects.push({
            type: 'mountain', x: i * 80 + Math.random() * 40, y: GROUND_Y + 10,
            w: 30 + Math.random() * 40, h: 20 + Math.random() * 30,
            layer: 2, color: '#2a2a3a'
        });
    }
    if (currentStage.events.includes('earth')) {
        bgObjects.push({ type: 'earth', x: GAME_WIDTH - 60, y: 60, size: 22, layer: 1 });
    }
}

// --- Calculate jump distance to properly space obstacles ---
// With gravity=0.027 and jumpForce=-2.2:
// Time to peak = |jumpForce| / gravity = 2.2/0.027 ≈ 81 frames
// Total air time ≈ 162 frames
// At speed 0.35, obstacle moves 0.35*2*162 = 113px during one jump
// So minimum gap between obstacles should be ~120px at stage 1
function getMinObstacleGap() {
    if (!currentStage) return 120;
    const airTime = (Math.abs(JUMP_FORCE) / LUNAR_GRAVITY) * 2;
    const obsSpeed = scrollSpeed * 2;
    const jumpCover = obsSpeed * airTime * 0.6; // 60% of theoretical max (need margin)
    return Math.max(100, jumpCover + 40); // +40 for safe landing
}

function jump() {
    if (gameState !== 'playing') return;

    if (!player.isJumping) {
        player.vy = JUMP_FORCE;
        player.isJumping = true;
        addDustBurst(player.x, GROUND_Y);
    } else if (player.boosterGauge > 0) {
        player.vy = JUMP_FORCE * 0.75;
        player.boosterGauge--;
        player.boosterRechargeTimer = 0;
        addBoostEffect(player.x, player.y);
    }
}

function addDustBurst(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 20, y: y,
            vx: (Math.random() - 0.5) * 1.5, vy: -Math.random() * 1,
            life: 40 + Math.random() * 20, maxLife: 60,
            size: 2 + Math.random() * 2, color: '#8a8a9a', type: 'dust'
        });
    }
}

function addBoostEffect(x, y) {
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 10, y: y + 10,
            vx: (Math.random() - 0.5) * 1, vy: Math.random() * 1.5,
            life: 25 + Math.random() * 10, maxLife: 35,
            size: 2 + Math.random() * 3, color: '#00AAFF', type: 'boost'
        });
    }
}

function addHitEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
            life: 25 + Math.random() * 15, maxLife: 40,
            size: 3 + Math.random() * 3, color: '#FF4444', type: 'hit'
        });
    }
    screenShake = 10;
}

function updateGame(dt) {
    if (!currentStage) return;

    gameTime += dt;
    const spd = scrollSpeed * (1 + distance * 0.00003);

    distance += spd * 0.5;

    if (distance >= currentStage.targetDist) {
        stageClear();
        return;
    }

    bgLayers.forEach(l => { l.offset += spd * l.speed; });

    // Player physics - VERY FLOATY lunar gravity
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

    // Booster recharge
    if (!player.isJumping && player.boosterGauge < player.maxBooster) {
        player.boosterRechargeTimer += dt;
        if (player.boosterRechargeTimer > 3) {
            player.boosterGauge++;
            player.boosterRechargeTimer = 0;
        }
    }

    if (player.invincible > 0) player.invincible -= dt;

    if (!player.isJumping) {
        player.animTimer += dt * spd * 2;
        player.animFrame = player.animTimer;
    }

    // Spawn obstacles (respecting jump distance)
    if (Math.random() < currentStage.obstacleFreq * spd) {
        spawnObstacle();
    }

    if (Math.random() < currentStage.energyFreq) {
        spawnEnergy();
    }

    spawnBgEvents(spd);

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= spd * 2;
        if (obstacles[i].x < -60) { obstacles.splice(i, 1); continue; }
        if (player.invincible <= 0 && checkCollision(player, obstacles[i])) {
            hitPlayer();
            obstacles.splice(i, 1);
        }
    }

    // Update energy
    for (let i = energyItems.length - 1; i >= 0; i--) {
        energyItems[i].x -= spd * 2;
        energyItems[i].frame++;
        if (energyItems[i].x < -20) { energyItems.splice(i, 1); continue; }
        if (checkCollisionEnergy(player, energyItems[i])) {
            collectEnergy(energyItems[i]);
            energyItems.splice(i, 1);
        }
    }

    // Update bg objects
    for (let i = bgObjects.length - 1; i >= 0; i--) {
        const obj = bgObjects[i];
        if (obj.layer !== undefined) obj.x -= spd * bgLayers[obj.layer].speed;
        if (obj.x < -100) { bgObjects.splice(i, 1); continue; }
        if (obj.type === 'meteor') { obj.x -= 1; obj.y += 0.7; if (obj.y > GROUND_Y) { addDustBurst(obj.x, GROUND_Y); bgObjects.splice(i, 1); } }
        if (obj.type === 'shooting_star') { obj.x -= 3; obj.y += 1; obj.life--; if (obj.life <= 0) bgObjects.splice(i, 1); }
    }

    // Ground tiles
    for (let i = groundTiles.length - 1; i >= 0; i--) {
        groundTiles[i].x -= spd * 2;
        if (groundTiles[i].x < -25) {
            groundTiles[i].x = GAME_WIDTH + 5;
            groundTiles[i].height = 3 + Math.random() * 5;
            groundTiles[i].shade = Math.random() * 0.2;
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.type === 'dust') p.vy += 0.015;
        if (p.life <= 0) particles.splice(i, 1);
    }

    if (screenShake > 0) screenShake *= 0.85;
    if (screenShake < 0.5) screenShake = 0;
}

function spawnObstacle() {
    const types = ['rock', 'crater', 'puddle'];
    const type = types[Math.floor(Math.random() * types.length)];
    const minGap = getMinObstacleGap();

    let obs = { x: GAME_WIDTH + 30, y: GROUND_Y, type: type, width: 20, height: 15 };

    switch(type) {
        case 'rock':
            const size = 0.9 + Math.random() * 0.5;
            obs.size = size;
            obs.width = 20 * size * SPRITE_SCALE;
            obs.height = 16 * size * SPRITE_SCALE;
            obs.y = GROUND_Y;
            break;
        case 'crater':
            obs.width = (30 + Math.random() * 15) * SPRITE_SCALE;
            obs.height = 8 * SPRITE_SCALE;
            obs.y = GROUND_Y + 2;
            break;
        case 'puddle':
            obs.width = (30 + Math.random() * 15) * SPRITE_SCALE;
            obs.height = 7 * SPRITE_SCALE;
            obs.y = GROUND_Y + 2;
            break;
    }

    // Check gap from last obstacle
    if (obstacles.length > 0) {
        const last = obstacles[obstacles.length - 1];
        if (GAME_WIDTH + 30 - last.x < minGap) return;
    }

    obstacles.push(obs);
}

function spawnEnergy() {
    if (energyItems.length > 3) return;
    energyItems.push({
        x: GAME_WIDTH + 20,
        y: GROUND_Y - 50 - Math.random() * 60,
        frame: 0, type: 'energy'
    });
}

function spawnBgEvents(spd) {
    if (!currentStage) return;
    if (Math.random() < 0.002) {
        const events = currentStage.events;
        const evt = events[Math.floor(Math.random() * events.length)];
        switch(evt) {
            case 'shooting_star':
                bgObjects.push({ type: 'shooting_star', x: GAME_WIDTH + 20, y: 20 + Math.random() * 100, len: 8 + Math.random() * 12, life: 60, layer: undefined }); break;
            case 'meteor':
                bgObjects.push({ type: 'meteor', x: GAME_WIDTH + 50, y: -20, size: 4 + Math.random() * 4, layer: undefined }); break;
            case 'rocket':
                bgObjects.push({ type: 'rocket', x: GAME_WIDTH + 20, y: 50 + Math.random() * 100, layer: 1 }); break;
            case 'spaceship':
                bgObjects.push({ type: 'spaceship', x: GAME_WIDTH + 30, y: 30 + Math.random() * 80, layer: 1 }); break;
            case 'planets':
                bgObjects.push({ type: 'planet', x: GAME_WIDTH + 30, y: 30 + Math.random() * 60, size: 8 + Math.random() * 12, color: ['#8B4513', '#4169E1', '#FF6347', '#9370DB'][Math.floor(Math.random()*4)], layer: 1 }); break;
        }
    }
    const maxMountainX = bgObjects.filter(o => o.type === 'mountain').reduce((max, o) => Math.max(max, o.x), 0);
    if (maxMountainX < GAME_WIDTH + 50) {
        bgObjects.push({ type: 'mountain', x: GAME_WIDTH + 20 + Math.random() * 40, y: GROUND_Y + 10, w: 30 + Math.random() * 40, h: 20 + Math.random() * 30, layer: 2, color: '#2a2a3a' });
    }
}

function checkCollision(player, obs) {
    const S = SPRITE_SCALE;
    const px = player.x - 10 * S;
    const py = player.y - 26 * S;
    const pw = 20 * S;
    const ph = 30 * S;

    const ox = obs.x - obs.width/2;
    const oy = obs.y - obs.height;
    const ow = obs.width;
    const oh = obs.height;

    return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
}

function checkCollisionEnergy(player, energy) {
    const dx = player.x - energy.x;
    const dy = (player.y - 12) - energy.y;
    return Math.sqrt(dx*dx + dy*dy) < 25;
}

function hitPlayer() {
    player.lives--;
    player.invincible = 2;
    addHitEffect(player.x, player.y);
    if (player.lives <= 0) gameOver();
}

function collectEnergy(item) {
    if (player.boosterGauge < player.maxBooster) player.boosterGauge++;
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: item.x, y: item.y,
            vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
            life: 20, maxLife: 20, size: 3, color: '#00FFAA', type: 'sparkle'
        });
    }
}

function stageClear() {
    gameState = 'stageCleared';
    const stageIdx = currentStage.id - 1;
    if (!saveData.clearedStages.includes(currentStage.id)) saveData.clearedStages.push(currentStage.id);
    if (distance > saveData.highScores[stageIdx]) saveData.highScores[stageIdx] = Math.floor(distance);
    saveData.totalDistance += Math.floor(distance);
    if (stageIdx + 1 < STAGES.length) STAGES[stageIdx + 1].unlocked = true;
    if (!saveData.badges.includes(currentStage.id)) saveData.badges.push(currentStage.id);
    saveSave();
}

function gameOver() {
    gameState = 'gameOver';
    gameOverFactIdx = Math.floor(Math.random() * MOON_FACTS.length);
    const stageIdx = currentStage.id - 1;
    if (distance > saveData.highScores[stageIdx]) saveData.highScores[stageIdx] = Math.floor(distance);
    saveData.totalDistance += Math.floor(distance);
    saveSave();
}

// ============================================
// DRAWING - GAME SCREEN
// ============================================

function drawGame() {
    if (!currentStage) return;

    ctx.save();
    if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, currentStage.bgColor);
    grad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y + 10);

    for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        const sx = ((s.x - bgLayers[0].offset * s.speed * 0.2) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
        drawStar(sx, s.y, s.size, gameTime * s.speed + s.phase);
    }

    bgObjects.filter(o => o.layer === 1).forEach(obj => {
        switch(obj.type) {
            case 'earth': drawEarth(obj.x, obj.y, obj.size); break;
            case 'rocket': drawRocket(obj.x, obj.y); break;
            case 'spaceship': drawSpaceship(obj.x, obj.y); break;
            case 'planet':
                drawPixelCircle(Math.floor(obj.x), Math.floor(obj.y), obj.size, obj.color);
                break;
        }
    });

    bgObjects.filter(o => o.layer === 2).forEach(obj => {
        if (obj.type === 'mountain') drawMountain(obj.x, obj.y, obj.w, obj.h, obj.color);
    });

    bgObjects.filter(o => o.layer === undefined).forEach(obj => {
        switch(obj.type) {
            case 'shooting_star': drawShootingStar(obj.x, obj.y, obj.len); break;
            case 'meteor': drawMeteor(obj.x, obj.y, obj.size); break;
        }
    });

    // Ground
    ctx.fillStyle = currentStage.groundColor;
    ctx.fillRect(0, GROUND_Y + 5, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
    drawPixelRect(0, GROUND_Y + 5, GAME_WIDTH, 3, currentStage.groundAccent);

    groundTiles.forEach(tile => {
        ctx.fillStyle = `rgba(0,0,0,${0.1 + tile.shade})`;
        ctx.fillRect(Math.floor(tile.x), GROUND_Y + 10, 12, tile.height);
    });

    for (let i = 0; i < 15; i++) {
        const rx = ((i * 37 + 10 - bgLayers[3].offset * 0.5) % (GAME_WIDTH + 40)) - 20;
        drawPixelRect(Math.floor(rx), GROUND_Y + 8 + (i % 3) * 4, 3, 2, '#3a3a4a');
    }

    // Obstacles
    obstacles.forEach(obs => {
        switch(obs.type) {
            case 'rock': drawRock(obs.x, obs.y, obs.size); break;
            case 'crater': drawCrater(obs.x, obs.y, obs.width / SPRITE_SCALE); break;
            case 'puddle': drawPuddle(obs.x, obs.y, obs.width / SPRITE_SCALE); break;
        }
    });

    energyItems.forEach(e => { drawEnergy(e.x, e.y, e.frame); });

    // Player
    if (player.invincible > 0) {
        if (Math.sin(player.invincible * 15) > 0) {
            const charType = CHARACTERS.find(c => c.id === saveData.selectedChar)?.type || 'rover';
            drawRover(player.x, player.y, player.animFrame, charType);
        }
    } else {
        const charType = CHARACTERS.find(c => c.id === saveData.selectedChar)?.type || 'rover';
        drawRover(player.x, player.y, player.animFrame, charType);
    }

    // Jump shadow
    if (player.isJumping) {
        const shadowScale = Math.max(0.2, 1 - (GROUND_Y - player.y) / 250);
        ctx.globalAlpha = 0.25 * shadowScale;
        drawPixelRect(player.x - 10 * shadowScale, GROUND_Y + 6, 20 * shadowScale, 3, '#000000');
        ctx.globalAlpha = 1;
    }

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        drawPixelRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size, p.color);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    drawHUD();
}

function shadeColor(color, amount) {
    let r = parseInt(color.slice(1,3), 16) + amount;
    let g = parseInt(color.slice(3,5), 16) + amount;
    let b = parseInt(color.slice(5,7), 16) + amount;
    return `rgb(${Math.max(0,Math.min(255,r))},${Math.max(0,Math.min(255,g))},${Math.max(0,Math.min(255,b))})`;
}

// ============================================
// INPUT HANDLING
// ============================================

function handleInput(x, y) {
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
            let buttonHit = false;
            for (const btn of uiButtons) {
                if (gx >= btn.x && gx <= btn.x + btn.w && gy >= btn.y && gy <= btn.y + btn.h) {
                    handleButton(btn);
                    buttonHit = true;
                    break;
                }
            }
            if (!buttonHit) {
                if (gameState === 'charSelect') gameState = 'stageSelect';
                else if (gameState === 'stageCleared') gameState = 'stageSelect';
                else if (gameState === 'gameOver') gameState = 'stageSelect';
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
        case 'toStageSelect': gameState = 'stageSelect'; break;
        case 'toCharSelect': gameState = 'charSelect'; break;
        case 'startStage': initGame(btn.data); break;
        case 'retry': if (currentStage) initGame(currentStage.id - 1); break;
        case 'back': gameState = 'title'; break;
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
window.addEventListener('keydown', function(e) {
    const code = e.code;
    const key = e.key;

    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(code)) {
        e.preventDefault();
    }

    switch (gameState) {
        case 'title':
            gameState = 'charSelect';
            break;

        case 'charSelect':
            if (code === 'Enter' || code === 'Space') {
                gameState = 'stageSelect';
            } else if (code === 'ArrowLeft' || code === 'ArrowRight') {
                const unlockedChars = CHARACTERS.filter(c => saveData.totalDistance >= c.unlockDist);
                const currentIdx = unlockedChars.findIndex(c => c.id === saveData.selectedChar);
                let newIdx;
                if (code === 'ArrowRight') newIdx = (currentIdx + 1) % unlockedChars.length;
                else newIdx = (currentIdx - 1 + unlockedChars.length) % unlockedChars.length;
                saveData.selectedChar = unlockedChars[newIdx].id;
                saveSave();
            } else if (code === 'Escape') {
                gameState = 'title';
            }
            break;

        case 'stageSelect':
            if (code === 'Escape') {
                gameState = 'charSelect';
            } else {
                const num = parseInt(key);
                if (num >= 1 && num <= 5 && STAGES[num-1].unlocked) {
                    initGame(num - 1);
                } else if (code === 'Enter' || code === 'Space') {
                    const firstUnlocked = STAGES.findIndex(s => s.unlocked && !saveData.clearedStages.includes(s.id));
                    const idx = firstUnlocked >= 0 ? firstUnlocked : 0;
                    if (STAGES[idx].unlocked) initGame(idx);
                }
            }
            break;

        case 'playing':
            if (code === 'Space' || code === 'ArrowUp') jump();
            break;

        case 'stageCleared':
            if (code === 'Enter' || code === 'Space') gameState = 'stageSelect';
            break;

        case 'gameOver':
            if (code === 'Enter' || code === 'Space') {
                if (currentStage) initGame(currentStage.id - 1);
            } else if (code === 'Escape') {
                gameState = 'stageSelect';
            }
            break;
    }
}, true);

// ============================================
// RESIZE
// ============================================

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scaleX = w / GAME_WIDTH;
    const scaleY = h / GAME_HEIGHT;
    scale = Math.min(scaleX, scaleY);

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    canvas.style.width = `${GAME_WIDTH * scale}px`;
    canvas.style.height = `${GAME_HEIGHT * scale}px`;

    offsetX = (w - GAME_WIDTH * scale) / 2;
    offsetY = (h - GAME_HEIGHT * scale) / 2;
    canvas.style.marginLeft = `${offsetX}px`;
    canvas.style.marginTop = `${offsetY}px`;

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

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    switch (gameState) {
        case 'title': updateTitle(dt); drawTitle(); break;
        case 'charSelect': gameTime += dt; drawCharSelect(); break;
        case 'stageSelect': gameTime += dt; drawStageSelect(); break;
        case 'playing': updateGame(dt); drawGame(); break;
        case 'stageCleared': gameTime += dt; drawStageClear(); break;
        case 'gameOver': gameTime += dt; drawGameOver(); break;
    }

    requestAnimationFrame(gameLoop);
}

// Initialize
initStars();
touchArea.focus();
touchArea.addEventListener('click', () => touchArea.focus());
requestAnimationFrame(gameLoop);
