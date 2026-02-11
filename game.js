// ============================================
// MOON RUNNER v2.0 - Major Visual/Audio Overhaul
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const touchArea = document.getElementById('touch-area');

// --- CONSTANTS ---
const GAME_WIDTH = 400;
const GAME_HEIGHT = 700;
const LUNAR_GRAVITY = 0.027;
const JUMP_FORCE = -2.2;
const GROUND_Y = 560;
const SPRITE_SCALE = 1.3;

// --- GAME STATE ---
let gameState = 'title';
let scale = 1;
let offsetX = 0;
let offsetY = 0;

// --- STAGES ---
const STAGES = [
    { id:1, name:'Mare Tranquillitatis', nameKo:'고요의 바다', description:'아폴로 11호 착륙 지점. 비교적 평탄한 지형.', speed:0.35, obstacleFreq:0.008, energyFreq:0.006, boosterCount:5, targetDist:800, bgColor:'#1a1a2e', groundColor:'#4a4a5a', groundAccent:'#3a3a4a', events:['stars','earth'], unlocked:true },
    { id:2, name:'Oceanus Procellarum', nameKo:'폭풍의 대양', description:'달에서 가장 큰 바다. 먼지폭풍이 가끔 발생.', speed:0.45, obstacleFreq:0.011, energyFreq:0.005, boosterCount:4, targetDist:1200, bgColor:'#151528', groundColor:'#555568', groundAccent:'#454558', events:['stars','dust_storm','shooting_star'], unlocked:false },
    { id:3, name:'Mare Imbrium', nameKo:'비의 바다', description:'거대한 크레이터 지역. 운석 낙하 주의!', speed:0.55, obstacleFreq:0.014, energyFreq:0.004, boosterCount:3, targetDist:1600, bgColor:'#121225', groundColor:'#606075', groundAccent:'#505065', events:['stars','meteor','planets'], unlocked:false },
    { id:4, name:'Tycho Crater', nameKo:'티코 크레이터', description:'험난한 크레이터 지대. 화산 활동 흔적!', speed:0.65, obstacleFreq:0.017, energyFreq:0.003, boosterCount:2, targetDist:2000, bgColor:'#0e0e20', groundColor:'#6a6a80', groundAccent:'#5a5a70', events:['stars','volcano','shooting_star','rocket'], unlocked:false },
    { id:5, name:'Mare Frigoris', nameKo:'추위의 바다', description:'달의 극지방. 극한의 환경에서 생존하라!', speed:0.75, obstacleFreq:0.020, energyFreq:0.002, boosterCount:1, targetDist:2500, bgColor:'#0a0a1a', groundColor:'#7a7a90', groundAccent:'#6a6a80', events:['stars','meteor','volcano','spaceship','sun'], unlocked:false }
];

// --- CHARACTERS ---
const CHARACTERS = [
    { id:'rover', name:'Luna Rover', nameKo:'루나 로버', unlockDist:0, type:'rover' },
    { id:'astro', name:'Astronaut', nameKo:'우주비행사', unlockDist:0, type:'astronaut' },
    { id:'rover2', name:'Heavy Rover', nameKo:'헤비 로버', unlockDist:3000, type:'rover' },
    { id:'astro2', name:'Commander', nameKo:'커맨더', unlockDist:5000, type:'astronaut' },
    { id:'rover3', name:'Speed Rover', nameKo:'스피드 로버', unlockDist:10000, type:'rover' },
    { id:'astro3', name:'Explorer', nameKo:'익스플로러', unlockDist:15000, type:'astronaut' },
];

// --- MOON FACTS ---
const MOON_FACTS = [
    { title:'달의 중력', text:'달의 중력은 지구의 약 1/6입니다.\n몸무게 60kg인 사람은 달에서 10kg!', icon:'gravity', color:'#4488FF' },
    { title:'달까지 거리', text:'달에서 지구까지의 평균 거리는\n384,400km입니다.', icon:'distance', color:'#44AAFF' },
    { title:'달의 온도', text:'달의 표면 온도는\n낮에 127°C, 밤에 -173°C입니다.', icon:'temp', color:'#FF6644' },
    { title:'달의 공전', text:'달은 지구 주위를\n29.5일에 한 바퀴 돕니다.', icon:'orbit', color:'#AABB44' },
    { title:'달의 크기', text:'달의 지름은 3,474km로\n지구의 약 1/4입니다.', icon:'size', color:'#CC88FF' },
    { title:'달의 대기', text:'달에는 대기가 거의 없습니다.\n하늘이 항상 검은 이유!', icon:'atmo', color:'#334466' },
    { title:'Apollo 11', text:'아폴로 11호는 1969년 7월 20일\n달에 착륙했습니다.', icon:'apollo', color:'#FFD700' },
    { title:'달의 뒷면', text:'달의 뒷면은 지구에서\n볼 수 없습니다. (동주기 자전)', icon:'darkside', color:'#556688' },
    { title:'달의 바다', text:'달 표면의 어두운 부분을\n"바다(Mare)"라고 부릅니다.', icon:'mare', color:'#3355AA' },
    { title:'달의 나이', text:'달의 나이는 약 45억 년으로\n지구와 거의 같습니다.', icon:'age', color:'#AA8855' },
    { title:'닐 암스트롱', text:'닐 암스트롱이 최초로\n달을 밟은 인간입니다.', icon:'footprint', color:'#DDDDEE' },
    { title:'달의 먼지', text:'달 먼지(레골리스)는 매우\n미세하고 날카롭습니다.', icon:'dust', color:'#998877' },
    { title:'달의 소리', text:'달에서는 소리가 전달되지\n않습니다. (진공 상태)', icon:'silent', color:'#667788' },
    { title:'달의 얼음', text:'달의 극지방 크레이터에는\n물(얼음)이 존재합니다.', icon:'ice', color:'#88DDFF' },
    { title:'달의 질량', text:'달의 질량은 지구의\n약 1/81입니다.', icon:'mass', color:'#BB99DD' },
];

const BADGE_COLORS = [['#FFD700','#FFA500'],['#C0C0C0','#808080'],['#4169E1','#1E90FF'],['#FF4500','#DC143C'],['#9400D3','#8A2BE2']];
const MILESTONES = [100,300,500,1000,1500,2000,2500];

// ============================================
// AUDIO MANAGER - Web Audio API
// ============================================
const Audio = {
    ctx: null,
    masterGain: null,
    bgmGain: null,
    sfxGain: null,
    bgmNodes: [],
    initialized: false,
    muted: false,

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.6;
            this.masterGain.connect(this.ctx.destination);
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = 0.3;
            this.bgmGain.connect(this.masterGain);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.masterGain);
            this.initialized = true;
        } catch(e) { console.warn('Audio init failed', e); }
    },

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 0.6;
    },

    stopBGM() {
        this.bgmNodes.forEach(n => { try { n.stop(); } catch(e){} });
        this.bgmNodes = [];
    },

    // --- BGM generators ---
    playTitleBGM() {
        if (!this.initialized) return;
        this.stopBGM();
        const c = this.ctx;
        const now = c.currentTime;
        // Pad drone
        const osc1 = c.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 110;
        const g1 = c.createGain();
        g1.gain.value = 0.15;
        osc1.connect(g1);
        g1.connect(this.bgmGain);
        osc1.start(now);
        this.bgmNodes.push(osc1);
        // High shimmer
        const osc2 = c.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 440;
        const g2 = c.createGain();
        g2.gain.value = 0;
        osc2.connect(g2);
        g2.connect(this.bgmGain);
        osc2.start(now);
        this.bgmNodes.push(osc2);
        // LFO on shimmer
        const lfo = c.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.3;
        const lfoGain = c.createGain();
        lfoGain.gain.value = 0.06;
        lfo.connect(lfoGain);
        lfoGain.connect(g2.gain);
        lfo.start(now);
        this.bgmNodes.push(lfo);
        // Arpeggio notes cycling
        const notes = [261.6, 329.6, 392, 523.3, 392, 329.6];
        const osc3 = c.createOscillator();
        osc3.type = 'triangle';
        const g3 = c.createGain();
        g3.gain.value = 0.04;
        osc3.connect(g3);
        g3.connect(this.bgmGain);
        osc3.start(now);
        this.bgmNodes.push(osc3);
        let t = now;
        for (let loop = 0; loop < 200; loop++) {
            for (const n of notes) {
                osc3.frequency.setValueAtTime(n, t);
                t += 1.2;
            }
        }
    },

    playGameBGM() {
        if (!this.initialized) return;
        this.stopBGM();
        const c = this.ctx;
        const now = c.currentTime;
        // Bass drone
        const bass = c.createOscillator();
        bass.type = 'sawtooth';
        bass.frequency.value = 55;
        const bGain = c.createGain();
        bGain.gain.value = 0.08;
        const bFilter = c.createBiquadFilter();
        bFilter.type = 'lowpass';
        bFilter.frequency.value = 200;
        bass.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(this.bgmGain);
        bass.start(now);
        this.bgmNodes.push(bass);
        // Pulse beat
        const pulse = c.createOscillator();
        pulse.type = 'square';
        pulse.frequency.value = 82.4;
        const pGain = c.createGain();
        pGain.gain.value = 0;
        pulse.connect(pGain);
        pGain.connect(this.bgmGain);
        pulse.start(now);
        this.bgmNodes.push(pulse);
        let t = now;
        for (let i = 0; i < 600; i++) {
            pGain.gain.setValueAtTime(0.06, t);
            pGain.gain.setValueAtTime(0, t + 0.08);
            t += 0.5;
        }
        // Tension notes
        const ten = c.createOscillator();
        ten.type = 'sine';
        ten.frequency.value = 220;
        const tGain = c.createGain();
        tGain.gain.value = 0.03;
        ten.connect(tGain);
        tGain.connect(this.bgmGain);
        ten.start(now);
        this.bgmNodes.push(ten);
        const tNotes = [220, 233, 220, 196, 220, 247, 233, 220];
        let tt = now;
        for (let loop = 0; loop < 100; loop++) {
            for (const n of tNotes) {
                ten.frequency.setValueAtTime(n, tt);
                tt += 2;
            }
        }
    },

    playClearJingle() {
        if (!this.initialized) return;
        this.stopBGM();
        const c = this.ctx;
        const now = c.currentTime;
        const notes = [523.3, 659.3, 784, 1047];
        notes.forEach((freq, i) => {
            const o = c.createOscillator();
            o.type = 'sine';
            o.frequency.value = freq;
            const g = c.createGain();
            g.gain.setValueAtTime(0, now + i * 0.2);
            g.gain.linearRampToValueAtTime(0.15, now + i * 0.2 + 0.05);
            g.gain.linearRampToValueAtTime(0.08, now + i * 0.2 + 0.5);
            g.gain.linearRampToValueAtTime(0, now + 2);
            o.connect(g);
            g.connect(this.bgmGain);
            o.start(now + i * 0.2);
            o.stop(now + 2.5);
        });
        // Sustained pad
        const pad = c.createOscillator();
        pad.type = 'sine';
        pad.frequency.value = 261.6;
        const pG = c.createGain();
        pG.gain.setValueAtTime(0, now + 0.8);
        pG.gain.linearRampToValueAtTime(0.1, now + 1.2);
        pad.connect(pG);
        pG.connect(this.bgmGain);
        pad.start(now + 0.8);
        this.bgmNodes.push(pad);
    },

    playGameOverBGM() {
        if (!this.initialized) return;
        this.stopBGM();
        const c = this.ctx;
        const now = c.currentTime;
        const notes = [220, 196, 174.6, 164.8];
        notes.forEach((freq, i) => {
            const o = c.createOscillator();
            o.type = 'sine';
            o.frequency.value = freq;
            const g = c.createGain();
            g.gain.setValueAtTime(0, now + i * 0.6);
            g.gain.linearRampToValueAtTime(0.1, now + i * 0.6 + 0.1);
            g.gain.linearRampToValueAtTime(0.04, now + i * 0.6 + 0.5);
            g.gain.linearRampToValueAtTime(0, now + 4);
            o.connect(g);
            g.connect(this.bgmGain);
            o.start(now + i * 0.6);
            o.stop(now + 5);
        });
        // Low drone
        const drone = c.createOscillator();
        drone.type = 'sine';
        drone.frequency.value = 82.4;
        const dG = c.createGain();
        dG.gain.value = 0.06;
        drone.connect(dG);
        dG.connect(this.bgmGain);
        drone.start(now);
        this.bgmNodes.push(drone);
    },

    // --- SFX generators ---
    playJump() {
        if (!this.initialized) return;
        const c = this.ctx;
        const now = c.currentTime;
        const o = c.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(200, now);
        o.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        const g = c.createGain();
        g.gain.setValueAtTime(0.15, now);
        g.gain.linearRampToValueAtTime(0, now + 0.2);
        o.connect(g);
        g.connect(this.sfxGain);
        o.start(now);
        o.stop(now + 0.2);
    },

    playLand() {
        if (!this.initialized) return;
        const c = this.ctx;
        const now = c.currentTime;
        const o = c.createOscillator();
        o.type = 'sine';
        o.frequency.value = 80;
        const g = c.createGain();
        g.gain.setValueAtTime(0.2, now);
        g.gain.linearRampToValueAtTime(0, now + 0.12);
        o.connect(g);
        g.connect(this.sfxGain);
        o.start(now);
        o.stop(now + 0.15);
        // Noise thud
        const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const noise = c.createBufferSource();
        noise.buffer = buf;
        const nG = c.createGain();
        nG.gain.value = 0.1;
        const nF = c.createBiquadFilter();
        nF.type = 'lowpass';
        nF.frequency.value = 300;
        noise.connect(nF);
        nF.connect(nG);
        nG.connect(this.sfxGain);
        noise.start(now);
    },

    playBoost() {
        if (!this.initialized) return;
        const c = this.ctx;
        const now = c.currentTime;
        const buf = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = c.createBufferSource();
        noise.buffer = buf;
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1200;
        f.Q.value = 2;
        const g = c.createGain();
        g.gain.setValueAtTime(0.12, now);
        g.gain.linearRampToValueAtTime(0, now + 0.25);
        noise.connect(f);
        f.connect(g);
        g.connect(this.sfxGain);
        noise.start(now);
    },

    playHit() {
        if (!this.initialized) return;
        const c = this.ctx;
        const now = c.currentTime;
        const o = c.createOscillator();
        o.type = 'square';
        o.frequency.setValueAtTime(150, now);
        o.frequency.linearRampToValueAtTime(50, now + 0.2);
        const g = c.createGain();
        g.gain.setValueAtTime(0.2, now);
        g.gain.linearRampToValueAtTime(0, now + 0.25);
        o.connect(g);
        g.connect(this.sfxGain);
        o.start(now);
        o.stop(now + 0.25);
        // Noise burst
        const buf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const n = c.createBufferSource();
        n.buffer = buf;
        const nG = c.createGain();
        nG.gain.value = 0.15;
        n.connect(nG);
        nG.connect(this.sfxGain);
        n.start(now);
    },

    playCollect() {
        if (!this.initialized) return;
        const c = this.ctx;
        const now = c.currentTime;
        const o = c.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(523, now);
        o.frequency.setValueAtTime(784, now + 0.08);
        const g = c.createGain();
        g.gain.setValueAtTime(0.15, now);
        g.gain.linearRampToValueAtTime(0, now + 0.2);
        o.connect(g);
        g.connect(this.sfxGain);
        o.start(now);
        o.stop(now + 0.25);
    },

    playClick() {
        if (!this.initialized) return;
        const c = this.ctx;
        const now = c.currentTime;
        const o = c.createOscillator();
        o.type = 'sine';
        o.frequency.value = 1000;
        const g = c.createGain();
        g.gain.setValueAtTime(0.1, now);
        g.gain.linearRampToValueAtTime(0, now + 0.05);
        o.connect(g);
        g.connect(this.sfxGain);
        o.start(now);
        o.stop(now + 0.06);
    },

    playDeath() {
        if (!this.initialized) return;
        const c = this.ctx;
        const now = c.currentTime;
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, now);
        o.frequency.exponentialRampToValueAtTime(40, now + 0.5);
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 400;
        const g = c.createGain();
        g.gain.setValueAtTime(0.15, now);
        g.gain.linearRampToValueAtTime(0, now + 0.6);
        o.connect(f);
        f.connect(g);
        g.connect(this.sfxGain);
        o.start(now);
        o.stop(now + 0.6);
    },

    playMilestone() {
        if (!this.initialized) return;
        const c = this.ctx;
        const now = c.currentTime;
        [784, 988, 1175].forEach((freq, i) => {
            const o = c.createOscillator();
            o.type = 'sine';
            o.frequency.value = freq;
            const g = c.createGain();
            g.gain.setValueAtTime(0, now + i * 0.1);
            g.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.03);
            g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.3);
            o.connect(g);
            g.connect(this.sfxGain);
            o.start(now + i * 0.1);
            o.stop(now + 0.5);
        });
    }
};

// ============================================
// TRANSITION SYSTEM
// ============================================
const transition = {
    active: false,
    phase: 'out', // 'out' = fading out old, 'in' = fading in new
    progress: 0,
    duration: 0.4,
    toState: null,
    flashColor: null,
    callback: null
};

function setGameState(newState) {
    Audio.init();
    if (transition.active) return;

    const transMap = {
        'title': { duration: 0.3 },
        'charSelect': { duration: 0.35 },
        'stageSelect': { duration: 0.35 },
        'playing': { duration: 0.4 },
        'stageCleared': { duration: 0.3, flash: 'rgba(255,255,200,0.6)' },
        'gameOver': { duration: 0.4, flash: 'rgba(255,0,0,0.4)' }
    };

    const cfg = transMap[newState] || { duration: 0.3 };
    transition.active = true;
    transition.phase = 'out';
    transition.progress = 0;
    transition.duration = cfg.duration;
    transition.toState = newState;
    transition.flashColor = cfg.flash || null;
    transition.callback = () => {
        gameState = newState;
        // BGM switching
        switch(newState) {
            case 'title': Audio.playTitleBGM(); break;
            case 'charSelect': case 'stageSelect': break; // keep title bgm
            case 'playing': Audio.playGameBGM(); break;
            case 'stageCleared': Audio.playClearJingle(); break;
            case 'gameOver': Audio.playGameOverBGM(); break;
        }
    };
}

function updateTransition(dt) {
    if (!transition.active) return;
    transition.progress += dt / transition.duration;
    if (transition.progress >= 1) {
        if (transition.phase === 'out') {
            transition.phase = 'in';
            transition.progress = 0;
            if (transition.callback) transition.callback();
        } else {
            transition.active = false;
        }
    }
}

function drawTransition() {
    if (!transition.active) return;
    let alpha;
    if (transition.phase === 'out') {
        alpha = transition.progress;
    } else {
        alpha = 1 - transition.progress;
    }
    if (transition.flashColor && transition.phase === 'out' && transition.progress < 0.3) {
        ctx.fillStyle = transition.flashColor;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.85})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

// ============================================
// SAVE DATA
// ============================================
let saveData = { totalDistance:0, highScores:[0,0,0,0,0], clearedStages:[], selectedChar:'rover', badges:[] };
function loadSave() {
    try { const s = localStorage.getItem('moonrunner_save'); if (s) saveData = JSON.parse(s); } catch(e) {}
    STAGES[0].unlocked = true;
    for (let i = 1; i < STAGES.length; i++) STAGES[i].unlocked = saveData.clearedStages.includes(STAGES[i-1].id);
}
function saveSave() { try { localStorage.setItem('moonrunner_save', JSON.stringify(saveData)); } catch(e) {} }
loadSave();

// ============================================
// GAME VARIABLES
// ============================================
let player = {
    x:80, y:GROUND_Y, vy:0, width:32, height:32,
    isJumping:false, boosterGauge:5, maxBooster:5,
    boosterRechargeTimer:0, lives:3, invincible:0,
    animFrame:0, animTimer:0, dustParticles:[],
    squashX:1, squashY:1, boostTrail:false
};

let currentStage = null;
let distance = 0;
let scrollSpeed = 0;
let obstacles = [];
let energyItems = [];
let bgObjects = [];
let bgStars = [];
let groundTiles = [];
let particles = [];
let floatingTexts = [];
let screenShake = 0;
let hitFlash = 0;
let titleAnimTimer = 0;
let titleRoverX = -50;
let titleTypewriter = 0;
let titleShootingStars = [];
let charSelectIndex = 0;
let uiButtons = [];
let gameTime = 0;
let gameOverFactIdx = -1;
let stageBannerTimer = 0;
let comboCount = 0;
let comboTimer = 0;
let lastMilestone = 0;
let impactRings = [];
let bgLayers = [{ offset:0, speed:0.1 }, { offset:0, speed:0.3 }, { offset:0, speed:0.6 }, { offset:0, speed:1.0 }];

// ============================================
// PIXEL ART DRAWING HELPERS
// ============================================
function drawPixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}
function drawPixelCircle(cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
            if (x*x + y*y <= r*r) ctx.fillRect(Math.floor(cx+x), Math.floor(cy+y), 1, 1);
        }
    }
}
function drawText(text, x, y, color, size, align) {
    ctx.fillStyle = color || '#FFFFFF';
    ctx.font = `bold ${size || 10}px monospace`;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, Math.floor(x), Math.floor(y));
}
function drawTextOutline(text, x, y, color, outColor, size, align) {
    ctx.font = `bold ${size || 10}px monospace`;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = outColor || '#000';
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        if (ox === 0 && oy === 0) continue;
        ctx.fillText(text, Math.floor(x+ox), Math.floor(y+oy));
    }
    ctx.fillStyle = color || '#FFF';
    ctx.fillText(text, Math.floor(x), Math.floor(y));
}
function drawGlowText(text, x, y, color, size, align) {
    ctx.save();
    ctx.font = `bold ${size || 10}px monospace`;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.fillText(text, Math.floor(x), Math.floor(y));
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, Math.floor(x), Math.floor(y));
    ctx.restore();
}
function wrapText(text, x, y, maxW, lh, color, size, align) {
    ctx.font = `bold ${size}px monospace`;
    const lines = text.split('\n');
    let ly = y;
    for (const raw of lines) {
        let line = '';
        for (let i = 0; i < raw.length; i++) {
            const test = line + raw[i];
            if (ctx.measureText(test).width > maxW && line.length > 0) {
                drawText(line, x, ly, color, size, align);
                line = raw[i]; ly += lh;
            } else line = test;
        }
        drawText(line, x, ly, color, size, align);
        ly += lh;
    }
}

// ============================================
// SPRITE DRAWING - ENHANCED
// ============================================
function drawRover(x, y, frame, type) {
    const f = Math.floor(frame) % 8;
    x = Math.floor(x); y = Math.floor(y);
    const S = SPRITE_SCALE;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(S * player.squashX, S * player.squashY);

    if (type === 'rover') {
        // Shadow underneath
        ctx.globalAlpha = 0.2;
        drawPixelRect(-12, 4, 24, 3, '#000');
        ctx.globalAlpha = 1;
        // Body - 3-tone shading
        drawPixelRect(-13, -16, 26, 11, '#A0A0B0');
        drawPixelRect(-12, -17, 24, 10, '#C0C0C8');
        drawPixelRect(-10, -18, 20, 4, '#D0D0D8');
        // Highlight strip
        drawPixelRect(-10, -17, 18, 1, '#E8E8F0');
        // Equipment bay
        drawPixelRect(-8, -14, 16, 6, '#B0B0C0');
        drawPixelRect(-6, -13, 12, 4, '#909098');
        // Dish antenna (circular)
        drawPixelRect(5, -30, 2, 14, '#707080');
        drawPixelCircle(6, -32, 4, '#B0B0C0');
        drawPixelCircle(6, -32, 3, '#C8C8D0');
        drawPixelCircle(6, -32, 1, '#FFD700');
        // Antenna wobble
        const wobble = Math.sin(gameTime * 4) * 0.5;
        drawPixelRect(5 + wobble, -28, 2, 2, '#707080');
        // Solar panels with stripes
        drawPixelRect(-16, -22, 10, 3, '#4169E1');
        drawPixelRect(-16, -21, 10, 1, '#1E90FF');
        for (let i = 0; i < 5; i++) drawPixelRect(-16 + i*2, -22, 1, 3, '#2a4aA0');
        // Sample arm
        drawPixelRect(12, -14, 6, 2, '#808090');
        drawPixelRect(16, -16, 2, 4, '#909098');
        // Wheels with track pattern
        const wb = f % 2 === 0 ? 0 : 1;
        for (let side = -1; side <= 1; side += 2) {
            const wx = side * 8;
            drawPixelCircle(wx, -2+wb, 6, '#252535');
            drawPixelCircle(wx, -2+wb, 5, '#353545');
            drawPixelCircle(wx, -2+wb, 3, '#454555');
            // Track teeth
            for (let t = 0; t < 4; t++) {
                const angle = (f * 0.5 + t * Math.PI/2);
                const tx = Math.cos(angle) * 5;
                const ty = Math.sin(angle) * 5;
                drawPixelRect(wx+tx-0.5, -2+wb+ty-0.5, 2, 2, '#555565');
            }
        }
        // Camera with lens glint
        drawPixelRect(10, -17, 6, 5, '#303040');
        drawPixelRect(11, -16, 4, 3, '#00FF88');
        const glint = Math.sin(gameTime * 3) * 0.5 + 0.5;
        ctx.globalAlpha = glint;
        drawPixelRect(12, -16, 2, 1, '#FFFFFF');
        ctx.globalAlpha = 1;
    } else {
        // ASTRONAUT - Enhanced
        // Helmet - rounded with visor
        drawPixelRect(-8, -34, 16, 16, '#E0E0E8');
        drawPixelRect(-7, -33, 14, 14, '#E8E8F0');
        drawPixelRect(-6, -32, 12, 12, '#F0F0F8');
        // Visor with moving reflection
        drawPixelRect(-5, -30, 10, 8, '#1a1a3a');
        drawPixelRect(-4, -29, 8, 6, '#2a2a5a');
        const visorGlint = (gameTime * 30) % 12;
        ctx.globalAlpha = 0.6;
        drawPixelRect(-5 + visorGlint, -29, 2, 5, '#88BBFF');
        ctx.globalAlpha = 0.3;
        drawPixelRect(-4 + visorGlint, -28, 1, 3, '#FFFFFF');
        ctx.globalAlpha = 1;
        // Gold visor reflection
        drawPixelRect(-3, -30, 3, 1, '#FFD700');
        // Suit body - better proportions
        drawPixelRect(-9, -18, 18, 17, '#E8E8F0');
        drawPixelRect(-8, -17, 16, 15, '#D8D8E8');
        // Suit details
        drawPixelRect(-1, -17, 2, 15, '#C0C0D0'); // zipper
        drawPixelRect(-4, -16, 3, 3, '#FF4444'); // patch
        drawPixelRect(1, -16, 3, 3, '#4444FF'); // patch
        // NASA text area
        drawPixelRect(-3, -12, 6, 2, '#CCCCDD');
        // Backpack with O2 tanks
        drawPixelRect(-12, -17, 4, 14, '#A0A0B0');
        drawPixelRect(-13, -15, 2, 4, '#808890');
        drawPixelRect(-13, -10, 2, 4, '#808890');
        // Backpack lights
        drawPixelRect(-12, -17, 1, 1, Math.sin(gameTime*5) > 0 ? '#00FF00' : '#004400');
        // Arms with bounce animation
        const armSwing = Math.sin(f * Math.PI / 4) * 2;
        drawPixelRect(-11, -16+armSwing, 3, 11, '#D8D8E8');
        drawPixelRect(-12, -7+armSwing, 4, 3, '#B0B0C0'); // glove
        drawPixelRect(8, -16-armSwing, 3, 11, '#D8D8E8');
        drawPixelRect(8, -7-armSwing, 4, 3, '#B0B0C0'); // glove
        // Legs with walk cycle
        const legL = Math.sin(f * Math.PI / 4) * 3;
        const legR = Math.sin(f * Math.PI / 4 + Math.PI) * 3;
        drawPixelRect(-7, -1, 6, 8+legL, '#C8C8D8');
        drawPixelRect(1, -1, 6, 8+legR, '#C8C8D8');
        // Boots
        drawPixelRect(-8, 7+legL, 7, 3, '#505060');
        drawPixelRect(0, 7+legR, 7, 3, '#505060');
        // Moon bounce effect when walking
        if (!player.isJumping) {
            const bounce = Math.abs(Math.sin(f * Math.PI / 4)) * 1.5;
            ctx.translate(0, -bounce);
        }
    }
    ctx.restore();
}

// Enhanced obstacles
function drawRock(x, y, size) {
    x = Math.floor(x); y = Math.floor(y);
    const s = (size || 1) * SPRITE_SCALE;
    // Warning glow
    ctx.globalAlpha = 0.12;
    drawPixelCircle(x, y-6*s, 14*s, '#FF4444');
    ctx.globalAlpha = 1;
    // Shadow
    drawPixelRect(x-10*s, y+2, 20*s, 4, 'rgba(0,0,0,0.4)');
    // 5-layer shading
    drawPixelRect(x-10*s, y-10*s, 20*s, 12*s, '#5a4a3a');
    drawPixelRect(x-9*s, y-12*s, 18*s, 12*s, '#6a5a4a');
    drawPixelRect(x-8*s, y-11*s, 16*s, 10*s, '#7a6a5a');
    drawPixelRect(x-7*s, y-14*s, 14*s, 5*s, '#6a5a4a');
    drawPixelRect(x-6*s, y-13*s, 12*s, 3*s, '#8a7a6a');
    // Top highlight
    drawPixelRect(x-5*s, y-13*s, 8*s, 2*s, '#aa9a8a');
    drawPixelRect(x-8*s, y-10*s, 3*s, 4*s, '#9a8a7a');
    // Mineral spots
    drawPixelRect(x+2*s, y-8*s, 3*s, 2*s, '#88aacc');
    drawPixelRect(x-5*s, y-6*s, 2*s, 2*s, '#ccaa88');
    // Dark cracks
    drawPixelRect(x+1*s, y-9*s, 1*s, 7*s, '#3a2a1a');
    drawPixelRect(x-3*s, y-5*s, 5*s, 1*s, '#3a2a1a');
    // Warning stripe
    drawPixelRect(x-4*s, y-14*s, 8*s, 2*s, '#FF8844');
}

function drawCrater(x, y, width) {
    x = Math.floor(x); y = Math.floor(y);
    const w = (width || 35) * SPRITE_SCALE;
    // Danger rim
    drawPixelRect(x-w/2-2, y-5, w+4, 2, '#FF6644');
    // Rim with detail
    drawPixelRect(x-w/2, y-4, w, 4, '#8a8a9a');
    drawPixelRect(x-w/2+2, y-5, w-4, 2, '#9a9aaa');
    // Small debris on rim
    drawPixelRect(x-w/2-3, y-3, 2, 2, '#7a7a8a');
    drawPixelRect(x+w/2+1, y-4, 2, 2, '#7a7a8a');
    // Crater hole - 3 depth levels
    drawPixelRect(x-w/2+3, y, w-6, 9, '#0a0a1a');
    drawPixelRect(x-w/2+5, y+2, w-10, 6, '#060612');
    drawPixelRect(x-w/2+7, y+4, w-14, 3, '#030308');
    // Inner glow
    drawPixelRect(x-w/4, y+1, w/2, 1, '#1a1a3a');
    // Rim highlight
    drawPixelRect(x-w/2+3, y-5, w-6, 1, '#bbbbd0');
}

function drawPuddle(x, y, width) {
    x = Math.floor(x); y = Math.floor(y);
    const w = (width || 35) * SPRITE_SCALE;
    const wave1 = Math.sin(gameTime * 3);
    const wave2 = Math.sin(gameTime * 5 + 1);
    // Danger edge
    drawPixelRect(x-w/2-2, y-2, w+4, 1, '#FF6644');
    // Water body
    drawPixelRect(x-w/2, y-1, w, 8, '#1a3a5a');
    drawPixelRect(x-w/2+2, y+1, w-4, 5, '#2a5a8a');
    // Reflective surface shimmer
    drawPixelRect(x-w/4+wave1*4, y, 10, 1, '#6abaee');
    drawPixelRect(x+w/4-wave2*3, y+1, 8, 1, '#5aaadd');
    drawPixelRect(x-w/6+wave2*2, y+3, 6, 1, '#4a9acc');
    // Bubbles (always 2-3)
    if (wave1 > 0) drawPixelRect(x-w/6, y-2, 2, 2, '#88ccff');
    if (wave2 > -0.3) drawPixelRect(x+w/5, y-1, 2, 2, '#88ccff');
    drawPixelRect(x, y-1+wave1, 2, 2, '#aaddff');
}

function drawEnergy(x, y, frame) {
    x = Math.floor(x); y = Math.floor(y);
    const bob = Math.sin(frame * 0.08) * 4;
    const glow = Math.sin(frame * 0.12) * 0.3 + 0.7;
    const S = SPRITE_SCALE;
    ctx.globalAlpha = glow * 0.3;
    drawPixelCircle(x, y+bob, 10*S, '#00FFAA');
    ctx.globalAlpha = 1;
    drawPixelRect(x-3*S, y-7*S+bob, 6*S, 14*S, '#00FF88');
    drawPixelRect(x-5*S, y-4*S+bob, 10*S, 8*S, '#00FFAA');
    drawPixelRect(x-2*S, y-5*S+bob, 3*S, 5*S, '#AAFFDD');
    drawPixelRect(x, y-8*S+bob, 2, 2, '#FFFFFF');
}

// ============================================
// BACKGROUND ELEMENTS
// ============================================
function drawStar(x, y, size, twinkle) {
    const alpha = 0.4 + Math.sin(twinkle) * 0.5;
    ctx.globalAlpha = Math.max(0, alpha);
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
    ctx.globalAlpha = 0.15;
    drawPixelCircle(x, y, r+2, '#88BBFF');
    ctx.globalAlpha = 1;
}
function drawMountain(x, y, w, h, color) {
    x = Math.floor(x); y = Math.floor(y);
    for (let i = 0; i < h; i++) {
        const ratio = i / h;
        const lw = Math.floor(w * ratio);
        drawPixelRect(x - lw/2, y - h + i, lw, 1, color);
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
        drawPixelRect(x+size+i*3, y-size+i*2, 3, 2, i<2?'#FF4500':'#FF8C00');
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
    const lightOn = Math.sin(gameTime * 5) > 0;
    drawPixelRect(x-12, y+1, 2, 2, lightOn ? '#FF0000' : '#880000');
    drawPixelRect(x+10, y+1, 2, 2, lightOn ? '#00FF00' : '#008800');
}
function drawCardIcon(cx, cy, icon) {
    cx = Math.floor(cx); cy = Math.floor(cy);
    switch(icon) {
        case 'gravity':
            drawPixelCircle(cx, cy-8, 10, '#CCCCDD');
            drawPixelCircle(cx+3, cy-10, 3, '#BBBBC8');
            drawPixelRect(cx-2, cy+6, 4, 12, '#4488FF');
            drawPixelRect(cx-5, cy+14, 10, 3, '#4488FF');
            break;
        case 'distance':
            drawPixelCircle(cx-12, cy, 8, '#2a6aaa');
            drawPixelRect(cx-14, cy-2, 4, 3, '#2a8a3a');
            drawPixelCircle(cx+14, cy, 5, '#CCCCDD');
            ctx.strokeStyle = '#666'; ctx.setLineDash([2,2]);
            ctx.beginPath(); ctx.moveTo(cx-4, cy); ctx.lineTo(cx+9, cy); ctx.stroke();
            ctx.setLineDash([]);
            break;
        case 'temp':
            drawPixelRect(cx-2, cy-15, 4, 22, '#DDDDEE');
            drawPixelCircle(cx, cy+10, 5, '#DDDDEE');
            drawPixelRect(cx-1, cy-8, 2, 16, '#FF4444');
            drawPixelCircle(cx, cy+10, 3, '#FF4444');
            break;
        case 'orbit':
            drawPixelCircle(cx, cy, 6, '#2a6aaa');
            ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(cx, cy, 18, 10, 0.3, 0, Math.PI*2); ctx.stroke();
            drawPixelCircle(cx+15, cy-5, 3, '#CCCCDD');
            break;
        case 'apollo':
            drawPixelRect(cx-3, cy-14, 6, 18, '#E0E0E0');
            drawPixelRect(cx-1, cy-18, 2, 4, '#FF4444');
            drawPixelRect(cx-5, cy+2, 3, 6, '#FF4444');
            drawPixelRect(cx+2, cy+2, 3, 6, '#FF4444');
            drawPixelRect(cx-1, cy-8, 2, 2, '#4488FF');
            break;
        case 'footprint':
            drawPixelRect(cx-4, cy-10, 8, 4, '#999');
            drawPixelRect(cx-3, cy-6, 6, 10, '#888');
            drawPixelRect(cx-5, cy+4, 10, 4, '#999');
            drawPixelRect(cx-2, cy-4, 1, 8, '#666');
            drawPixelRect(cx+1, cy-4, 1, 8, '#666');
            break;
        default:
            drawPixelCircle(cx, cy, 14, '#CCCCDD');
            drawPixelCircle(cx, cy, 12, '#DDDDEE');
            drawPixelCircle(cx-4, cy-3, 4, '#BBBBC8');
            drawPixelCircle(cx+5, cy+2, 3, '#C4C4D0');
            break;
    }
}

// ============================================
// HUD
// ============================================
function drawHUD() {
    if (!currentStage) return;
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, GAME_WIDTH, 44);
    drawText(currentStage.nameKo, 8, 12, '#FFD700', 9);
    drawText(`${Math.floor(distance)}m`, GAME_WIDTH-8, 12, '#FFFFFF', 9, 'right');
    // Progress bar
    const progress = Math.min(distance / currentStage.targetDist, 1);
    drawPixelRect(8, 26, GAME_WIDTH-16, 8, '#1a1a2a');
    drawPixelRect(8, 26, Math.floor((GAME_WIDTH-16)*progress), 8, '#00FF88');
    drawPixelRect(8, 26, Math.floor((GAME_WIDTH-16)*progress), 3, '#88FFBB');
    drawPixelRect(GAME_WIDTH-14, 24, 6, 12, '#FFD700');
    drawText('다음기지', 10, 38, '#888', 7);
    // Lives
    for (let i = 0; i < player.lives; i++) drawHeart(14 + i*20, GAME_HEIGHT-32, true);
    // Booster
    drawText('BOOST', GAME_WIDTH-90, GAME_HEIGHT-40, '#888', 7);
    for (let i = 0; i < player.maxBooster; i++) {
        const filled = i < player.boosterGauge;
        drawPixelRect(GAME_WIDTH-90+i*16, GAME_HEIGHT-30, 12, 14, filled?'#00AAFF':'#1a1a3a');
        if (filled) drawPixelRect(GAME_WIDTH-90+i*16, GAME_HEIGHT-30, 12, 5, '#44CCFF');
    }
    // Mute button
    drawText(Audio.muted ? '🔇' : '🔊', GAME_WIDTH-20, 48, '#888', 12, 'right');
    // Combo display
    if (comboCount > 1 && comboTimer > 0) {
        const cAlpha = Math.min(1, comboTimer / 0.5);
        ctx.globalAlpha = cAlpha;
        drawGlowText(`x${comboCount} COMBO!`, GAME_WIDTH/2, 55, '#FF8800', 14, 'center');
        ctx.globalAlpha = 1;
    }
    // Stage banner
    if (stageBannerTimer > 0) {
        const bannerAlpha = stageBannerTimer > 1.5 ? (2 - stageBannerTimer) * 2 : (stageBannerTimer > 0.3 ? 1 : stageBannerTimer / 0.3);
        ctx.globalAlpha = Math.min(1, bannerAlpha);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, GAME_HEIGHT/2-40, GAME_WIDTH, 80);
        drawGlowText(`STAGE ${currentStage.id}`, GAME_WIDTH/2, GAME_HEIGHT/2-30, '#FFD700', 22, 'center');
        drawText(currentStage.nameKo, GAME_WIDTH/2, GAME_HEIGHT/2, '#FFFFFF', 14, 'center');
        drawText(currentStage.description, GAME_WIDTH/2, GAME_HEIGHT/2+20, '#AAAACC', 8, 'center');
        ctx.globalAlpha = 1;
    }
}

function drawHeart(x, y) {
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

// ============================================
// SCREENS
// ============================================
function drawTitle() {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#020208');
    grad.addColorStop(0.4, '#050518');
    grad.addColorStop(0.8, '#0a0a2a');
    grad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars - 3 layers
    for (const s of bgStars) {
        const sx = s.x, sy = s.y;
        drawStar(sx, sy, s.size, titleAnimTimer * s.speed + s.phase);
    }

    // Shooting stars
    for (const ss of titleShootingStars) {
        ctx.globalAlpha = ss.life / ss.maxLife;
        for (let i = 0; i < ss.len; i++) {
            ctx.globalAlpha = (ss.life / ss.maxLife) * (1 - i / ss.len);
            drawPixelRect(Math.floor(ss.x + i*2), Math.floor(ss.y + i*0.8), 2, 1, '#FFFFFF');
        }
        ctx.globalAlpha = 1;
    }

    // Moon - detailed
    const moonY = 180 + Math.sin(titleAnimTimer * 0.3) * 5;
    // Moon glow
    ctx.globalAlpha = 0.08;
    drawPixelCircle(GAME_WIDTH/2, moonY, 95, '#FFFFFF');
    ctx.globalAlpha = 1;
    drawPixelCircle(GAME_WIDTH/2, moonY, 82, '#B8B8C0');
    drawPixelCircle(GAME_WIDTH/2, moonY, 80, '#C8C8D0');
    drawPixelCircle(GAME_WIDTH/2, moonY, 78, '#D0D0D8');
    // Craters with depth
    const craters = [{x:-20,y:-15,r:12},{x:30,y:10,r:8},{x:-35,y:25,r:6},{x:10,y:-30,r:10},{x:-10,y:15,r:5},{x:25,y:-5,r:4}];
    for (const cr of craters) {
        drawPixelCircle(GAME_WIDTH/2+cr.x, moonY+cr.y, cr.r, '#B0B0B8');
        drawPixelCircle(GAME_WIDTH/2+cr.x, moonY+cr.y, cr.r-1, '#BCBCC4');
        drawPixelCircle(GAME_WIDTH/2+cr.x+1, moonY+cr.y+1, cr.r-2, '#C4C4CC');
    }
    // Light reflection
    ctx.globalAlpha = 0.15;
    drawPixelCircle(GAME_WIDTH/2-25, moonY-25, 30, '#FFFFFF');
    ctx.globalAlpha = 1;

    drawEarth(GAME_WIDTH - 50, 70, 25);

    // Ground
    drawPixelRect(0, GROUND_Y+10, GAME_WIDTH, GAME_HEIGHT-GROUND_Y-10, '#3a3a4a');
    drawPixelRect(0, GROUND_Y+10, GAME_WIDTH, 3, '#5a5a6a');
    for (let i = 0; i < 20; i++) drawPixelRect(i*22+5, GROUND_Y+15, 8, 2, '#2a2a3a');

    // Rover with trail
    drawRover(titleRoverX, GROUND_Y+8, titleAnimTimer*3, 'rover');
    for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.25 - i*0.05;
        drawPixelRect(titleRoverX-20-i*12, GROUND_Y+6+i*1.5, 4, 3, '#8a8a9a');
    }
    ctx.globalAlpha = 1;

    // Title text with glow
    const titleY = 340;
    const titleBounce = Math.sin(titleAnimTimer * 1.5) * 3;
    const shimmer = Math.sin(titleAnimTimer * 2) * 0.3 + 0.7;
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    drawTextOutline('MOON', GAME_WIDTH/2, titleY+titleBounce, '#FFD700', '#8B6914', 48, 'center');
    ctx.shadowColor = `rgba(255,255,255,${shimmer})`;
    ctx.shadowBlur = 15;
    drawTextOutline('RUNNER', GAME_WIDTH/2, titleY+50+titleBounce, '#FFFFFF', '#555', 48, 'center');
    ctx.restore();

    // Typewriter subtitle
    const subText = 'Lunar Gravity Explorer';
    const visChars = Math.min(Math.floor(titleTypewriter), subText.length);
    drawText(subText.substring(0, visChars), GAME_WIDTH/2, titleY+108, '#8888AA', 10, 'center');
    if (visChars < subText.length && Math.sin(titleAnimTimer*8) > 0) {
        const tw = ctx.measureText(subText.substring(0, visChars)).width;
        drawPixelRect(GAME_WIDTH/2 - ctx.measureText(subText).width/2 + tw, titleY+108, 2, 10, '#8888AA');
    }

    // TAP TO START with pulse
    const tapAlpha = Math.sin(titleAnimTimer * 3) * 0.4 + 0.6;
    const tapY = 540 + Math.sin(titleAnimTimer * 2) * 3;
    ctx.globalAlpha = tapAlpha;
    drawTextOutline('TAP TO START', GAME_WIDTH/2, tapY, '#FFFFFF', '#333', 16, 'center');
    ctx.globalAlpha = 1;

    drawText('v2.0 | Made on the Moon', GAME_WIDTH/2, GAME_HEIGHT-20, '#333344', 7, 'center');
}

function drawCharSelect() {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#08081a');
    grad.addColorStop(1, '#151530');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (const s of bgStars) drawStar(s.x, s.y, s.size, gameTime*s.speed+s.phase);

    drawGlowText('캐릭터 선택', GAME_WIDTH/2, 30, '#FFD700', 20, 'center');
    drawText('CHARACTER SELECT', GAME_WIDTH/2, 55, '#8888AA', 8, 'center');
    drawText(`총 누적거리: ${Math.floor(saveData.totalDistance)}m`, GAME_WIDTH/2, 80, '#AAAACC', 9, 'center');

    uiButtons = [];
    const cardW=160, cardH=140, startY=110;
    for (let i = 0; i < CHARACTERS.length; i++) {
        const c = CHARACTERS[i];
        const col = i%2, row = Math.floor(i/2);
        const cx = 30+col*(cardW+20), cy = startY+row*(cardH+15);
        const isUnlocked = saveData.totalDistance >= c.unlockDist;
        const isSelected = saveData.selectedChar === c.id;

        ctx.fillStyle = isSelected ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(cx, cy, cardW, cardH);
        ctx.strokeStyle = isSelected ? '#FFD700' : (isUnlocked ? '#555566' : '#333344');
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(cx, cy, cardW, cardH);

        if (isUnlocked) {
            drawRover(cx+cardW/2, cy+65, gameTime*3, c.type);
            drawText(c.nameKo, cx+cardW/2, cy+90, '#FFF', 10, 'center');
            drawText(c.name, cx+cardW/2, cy+105, '#888899', 7, 'center');
            if (isSelected) drawText('✓ SELECTED', cx+cardW/2, cy+120, '#FFD700', 8, 'center');
            uiButtons.push({ x:cx, y:cy, w:cardW, h:cardH, action:'selectChar', data:c.id });
        } else {
            drawText('🔒', cx+cardW/2, cy+40, '#555566', 24, 'center');
            drawText(c.nameKo, cx+cardW/2, cy+90, '#555566', 10, 'center');
            drawText(`${c.unlockDist}m 필요`, cx+cardW/2, cy+108, '#666677', 8, 'center');
        }
    }
    drawButton(20, GAME_HEIGHT-60, 80, 35, '◀ 뒤로', 'back');
    drawButton(GAME_WIDTH-120, GAME_HEIGHT-60, 100, 35, '스테이지 ▶', 'toStageSelect');

    if (Math.sin(gameTime*2) > -0.3) {
        drawText('캐릭터를 선택하거나 아무 곳을 탭하세요', GAME_WIDTH/2, GAME_HEIGHT-20, '#666677', 8, 'center');
    }
}

function drawStageSelect() {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#06061a');
    grad.addColorStop(1, '#12122a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (const s of bgStars) drawStar(s.x, s.y, s.size, gameTime*s.speed+s.phase);

    // Moon map
    drawPixelCircle(GAME_WIDTH/2, 130, 70, '#C0C0C8');
    drawPixelCircle(GAME_WIDTH/2, 130, 68, '#D0D0D8');

    const stagePos = [{x:GAME_WIDTH/2+10,y:140},{x:GAME_WIDTH/2-30,y:125},{x:GAME_WIDTH/2-10,y:110},{x:GAME_WIDTH/2+20,y:100},{x:GAME_WIDTH/2,y:80}];
    for (let i = 0; i < stagePos.length; i++) {
        const sp = stagePos[i];
        const isUnlocked = STAGES[i].unlocked;
        const isCleared = saveData.clearedStages.includes(STAGES[i].id);
        if (isCleared) drawPixelCircle(sp.x, sp.y, 5, '#00FF88');
        else if (isUnlocked) {
            const pulse = Math.sin(gameTime*3)*0.3+0.7;
            ctx.globalAlpha = pulse;
            drawPixelCircle(sp.x, sp.y, 6, '#FFD700');
            ctx.globalAlpha = 1;
            drawPixelCircle(sp.x, sp.y, 4, '#FFD700');
        } else drawPixelCircle(sp.x, sp.y, 4, '#444455');
        if (i > 0) {
            const prev = stagePos[i-1];
            ctx.strokeStyle = isUnlocked ? '#FFD700' : '#333344';
            ctx.lineWidth = 1; ctx.setLineDash([2,2]);
            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(sp.x, sp.y); ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawGlowText('스테이지 지도', GAME_WIDTH/2, 20, '#FFD700', 18, 'center');
    uiButtons = [];
    const cardStartY = 220;
    for (let i = 0; i < STAGES.length; i++) {
        const stage = STAGES[i], cy = cardStartY+i*72;
        const isCleared = saveData.clearedStages.includes(stage.id);
        // Rank
        const hs = saveData.highScores[i];
        let rank = '-';
        if (hs >= stage.targetDist * 1.5) rank = 'S';
        else if (hs >= stage.targetDist * 1.2) rank = 'A';
        else if (hs >= stage.targetDist) rank = 'B';
        else if (hs > 0) rank = 'C';

        ctx.fillStyle = stage.unlocked ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
        ctx.fillRect(15, cy, GAME_WIDTH-30, 62);
        ctx.strokeStyle = isCleared ? '#00FF88' : (stage.unlocked ? '#555566' : '#222233');
        ctx.lineWidth = 1;
        ctx.strokeRect(15, cy, GAME_WIDTH-30, 62);

        drawTextOutline(`${stage.id}`, 35, cy+8, isCleared?'#00FF88':(stage.unlocked?'#FFD700':'#444455'), '#000', 22, 'center');
        drawText(stage.nameKo, 55, cy+8, stage.unlocked?'#FFF':'#555566', 11);
        drawText(stage.name, 55, cy+24, stage.unlocked?'#8888AA':'#333344', 7);
        drawText(stage.description, 55, cy+38, stage.unlocked?'#777788':'#333344', 7);

        if (stage.unlocked && hs > 0) {
            drawText(`BEST: ${hs}m`, GAME_WIDTH-30, cy+8, '#FFD700', 8, 'right');
            const rankColor = rank==='S'?'#FFD700':rank==='A'?'#00FF88':rank==='B'?'#44AAFF':'#AAAAAA';
            drawText(rank, GAME_WIDTH-30, cy+22, rankColor, 12, 'right');
        }
        if (isCleared) drawText('✓ CLEAR', GAME_WIDTH-30, cy+42, '#00FF88', 9, 'right');
        if (stage.unlocked) {
            for (let d = 0; d < 5; d++) drawPixelRect(GAME_WIDTH-30-(5-d)*8, cy+38, 5, 5, d<stage.id?'#FF6644':'#333344');
            uiButtons.push({ x:15, y:cy, w:GAME_WIDTH-30, h:62, action:'startStage', data:i });
        }
    }
    drawButton(20, GAME_HEIGHT-55, 80, 35, '◀ 뒤로', 'toCharSelect');
}

function drawStageClear() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Rising particles
    for (let i = 0; i < 20; i++) {
        const px = 30+(i*23)%(GAME_WIDTH-60);
        const py = GAME_HEIGHT-((gameTime*30+i*40)%GAME_HEIGHT);
        ctx.globalAlpha = 0.25+Math.sin(gameTime+i)*0.15;
        drawPixelRect(px, py, 2, 2, i%2===0?'#FFD700':'#FFFFFF');
    }
    ctx.globalAlpha = 1;

    drawGlowText('STAGE CLEAR!', GAME_WIDTH/2, 160, '#FFD700', 28, 'center');
    drawTextOutline('스테이지 클리어!', GAME_WIDTH/2, 200, '#FFFFFF', '#333', 16, 'center');
    drawText(`달린 거리: ${Math.floor(distance)}m`, GAME_WIDTH/2, 260, '#AAAACC', 12, 'center');

    if (currentStage) {
        const bi = currentStage.id-1, bc = BADGE_COLORS[bi];
        const bx = GAME_WIDTH/2, by = 350;
        drawPixelCircle(bx, by, 32, bc[0]);
        drawPixelCircle(bx, by, 28, bc[1]);
        drawPixelCircle(bx, by, 25, '#1a1a2a');
        drawTextOutline(`${currentStage.id}`, bx, by-8, bc[0], '#000', 22, 'center');
        drawText('뱃지 획득!', bx, by+42, '#FFD700', 11, 'center');
        drawText(currentStage.nameKo, bx, by+58, '#AAAACC', 9, 'center');
    }
    uiButtons = [];
    drawButton(GAME_WIDTH/2-60, 460, 120, 40, '계속하기', 'toStageSelect');
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    drawGlowText('GAME OVER', GAME_WIDTH/2, 80, '#FF4444', 32, 'center');
    drawText(`달린 거리: ${Math.floor(distance)}m`, GAME_WIDTH/2, 130, '#FFF', 12, 'center');
    if (currentStage) {
        const si = currentStage.id-1;
        if (distance > saveData.highScores[si]) drawGlowText('★ NEW RECORD! ★', GAME_WIDTH/2, 155, '#FFD700', 14, 'center');
    }
    // Pokemon card
    if (gameOverFactIdx < 0) gameOverFactIdx = Math.floor(Math.random()*MOON_FACTS.length);
    const fact = MOON_FACTS[gameOverFactIdx];
    const cardX=40, cardY=195, cardW=GAME_WIDTH-80, cardH=280;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cardX+4, cardY+4, cardW, cardH);
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX+cardW, cardY+cardH);
    cardGrad.addColorStop(0, '#1a1a3a'); cardGrad.addColorStop(0.5, '#1e1e40'); cardGrad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = cardGrad;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = fact.color; ctx.lineWidth = 3;
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.strokeRect(cardX+6, cardY+6, cardW-12, cardH-12);
    ctx.fillStyle = fact.color;
    ctx.fillRect(cardX, cardY, cardW, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(cardX+10, cardY+14, cardW-20, 22);
    drawText(`🌙 ${fact.title}`, GAME_WIDTH/2, cardY+16, fact.color, 12, 'center');
    const iconBgY = cardY+46;
    ctx.fillStyle = 'rgba(0,0,20,0.5)';
    ctx.fillRect(cardX+15, iconBgY, cardW-30, 90);
    drawCardIcon(GAME_WIDTH/2, iconBgY+45, fact.icon);
    ctx.fillStyle = fact.color;
    ctx.fillRect(cardX+20, iconBgY+100, cardW-40, 2);
    wrapText(fact.text, GAME_WIDTH/2, iconBgY+112, cardW-50, 16, '#CCCCDD', 10, 'center');
    ctx.fillStyle = fact.color; ctx.globalAlpha = 0.3;
    ctx.fillRect(cardX+10, cardY+cardH-28, 60, 18);
    ctx.globalAlpha = 1;
    drawText('MOON', cardX+14, cardY+cardH-25, '#FFF', 8);
    drawText(`#${String(gameOverFactIdx+1).padStart(2,'0')}/${MOON_FACTS.length}`, cardX+cardW-55, cardY+cardH-25, '#666688', 8);
    if (Math.sin(gameTime*4)>0.7) drawPixelRect(cardX+2, cardY+2, 3, 3, '#FFF');
    if (Math.sin(gameTime*3+1)>0.7) drawPixelRect(cardX+cardW-5, cardY+cardH-5, 3, 3, '#FFF');

    uiButtons = [];
    drawButton(GAME_WIDTH/2-70, 510, 140, 40, '다시 도전', 'retry');
    drawButton(GAME_WIDTH/2-70, 565, 140, 40, '스테이지 선택', 'toStageSelect');
}

function drawButton(x, y, w, h, text, action) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    drawText(text, x+w/2, y+h/2-6, '#FFF', 11, 'center');
    uiButtons.push({ x, y, w, h, action, data:null });
}

// ============================================
// GAME LOGIC
// ============================================
function initStars() {
    bgStars = [];
    for (let i = 0; i < 150; i++) {
        bgStars.push({
            x: Math.random()*GAME_WIDTH,
            y: Math.random()*(GROUND_Y-50),
            size: Math.random() > 0.9 ? 2 : (Math.random() > 0.6 ? 1.5 : 1),
            speed: 0.3 + Math.random()*2.5,
            phase: Math.random()*Math.PI*2
        });
    }
}

function initGame(stageIdx) {
    currentStage = STAGES[stageIdx];
    distance = 0;
    scrollSpeed = currentStage.speed;
    obstacles = []; energyItems = []; bgObjects = []; particles = [];
    floatingTexts = []; groundTiles = []; impactRings = [];
    gameOverFactIdx = -1;
    comboCount = 0; comboTimer = 0; lastMilestone = 0;
    stageBannerTimer = 2.5;

    player.y = GROUND_Y; player.vy = 0;
    player.isJumping = false;
    player.boosterGauge = currentStage.boosterCount;
    player.maxBooster = currentStage.boosterCount;
    player.lives = 3; player.invincible = 0;
    player.animFrame = 0; player.animTimer = 0;
    player.squashX = 1; player.squashY = 1;
    player.boostTrail = false;

    bgLayers.forEach(l => l.offset = 0);
    for (let i = 0; i < Math.ceil(GAME_WIDTH/20)+2; i++) {
        groundTiles.push({ x:i*20, height:3+Math.random()*5, shade:Math.random()*0.2 });
    }
    initBgObjects();
    gameState = 'playing';
    Audio.playGameBGM();
}

function initBgObjects() {
    if (!currentStage) return;
    for (let i = 0; i < 8; i++) {
        bgObjects.push({ type:'mountain', x:i*80+Math.random()*40, y:GROUND_Y+10, w:30+Math.random()*40, h:20+Math.random()*30, layer:2, color:'#2a2a3a' });
    }
    if (currentStage.events.includes('earth')) bgObjects.push({ type:'earth', x:GAME_WIDTH-60, y:60, size:22, layer:1 });
}

function getMinObstacleGap() {
    if (!currentStage) return 120;
    const airTime = (Math.abs(JUMP_FORCE)/LUNAR_GRAVITY)*2;
    const obsSpeed = scrollSpeed*2;
    return Math.max(100, obsSpeed*airTime*0.6+40);
}

function jump() {
    if (gameState !== 'playing') return;
    if (!player.isJumping) {
        player.vy = JUMP_FORCE;
        player.isJumping = true;
        player.squashX = 1.3; player.squashY = 0.7;
        addDustBurst(player.x, GROUND_Y, 12);
        Audio.playJump();
    } else if (player.boosterGauge > 0) {
        player.vy = JUMP_FORCE * 0.75;
        player.boosterGauge--;
        player.boosterRechargeTimer = 0;
        player.boostTrail = true;
        addBoostEffect(player.x, player.y);
        Audio.playBoost();
    }
}

function addDustBurst(x, y, count) {
    for (let i = 0; i < (count||8); i++) {
        particles.push({
            x:x+(Math.random()-0.5)*20, y:y,
            vx:(Math.random()-0.5)*2, vy:-Math.random()*1.2,
            life:40+Math.random()*20, maxLife:60,
            size:2+Math.random()*3, color:'#8a8a9a', type:'dust'
        });
    }
}

function addBoostEffect(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x:x+(Math.random()-0.5)*10, y:y+10,
            vx:(Math.random()-0.5)*1, vy:Math.random()*2,
            life:25+Math.random()*10, maxLife:35,
            size:2+Math.random()*3, color:'#00AAFF', type:'boost'
        });
    }
}

function addHitEffect(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x:x, y:y,
            vx:(Math.random()-0.5)*4, vy:(Math.random()-0.5)*4,
            life:25+Math.random()*15, maxLife:40,
            size:3+Math.random()*4, color:i%2===0?'#FF4444':'#FF8844', type:'hit'
        });
    }
    screenShake = 12;
    hitFlash = 0.12;
}

function addLandEffect(x, y) {
    addDustBurst(x, y, 14);
    impactRings.push({ x:x, y:y, radius:5, maxRadius:40, alpha:0.5 });
    screenShake = 3;
    Audio.playLand();
}

function addCollectEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (i/12)*Math.PI*2;
        particles.push({
            x:x, y:y,
            vx:Math.cos(angle)*2.5, vy:Math.sin(angle)*2.5,
            life:25, maxLife:25, size:3, color:'#00FFAA', type:'sparkle'
        });
    }
    impactRings.push({ x:x, y:y, radius:5, maxRadius:30, alpha:0.4, color:'#00FFAA' });
    floatingTexts.push({ x:x, y:y-10, text:'+1 BOOST', color:'#00FFAA', life:1.2, maxLife:1.2 });
    Audio.playCollect();
}

function addMilestonePopup(dist) {
    floatingTexts.push({ x:GAME_WIDTH/2, y:GAME_HEIGHT/2-30, text:`🏆 ${dist}m!`, color:'#FFD700', life:2, maxLife:2, size:18 });
    Audio.playMilestone();
}

function updateGame(dt) {
    if (!currentStage) return;
    gameTime += dt;
    const spd = scrollSpeed * (1 + distance*0.00003);
    distance += spd * 0.5;
    if (stageBannerTimer > 0) stageBannerTimer -= dt;
    if (comboTimer > 0) comboTimer -= dt;
    if (hitFlash > 0) hitFlash -= dt;

    // Milestones
    for (const m of MILESTONES) {
        if (distance >= m && lastMilestone < m) { lastMilestone = m; addMilestonePopup(m); }
    }

    if (distance >= currentStage.targetDist) { stageClear(); return; }
    bgLayers.forEach(l => l.offset += spd*l.speed);

    // Squash recovery
    player.squashX += (1-player.squashX)*0.15;
    player.squashY += (1-player.squashY)*0.15;

    // Player physics
    if (player.isJumping) {
        player.vy += LUNAR_GRAVITY;
        player.y += player.vy;
        // Dust trail while rising
        if (player.vy < 0 && Math.random() < 0.3) {
            particles.push({ x:player.x+(Math.random()-0.5)*8, y:player.y+15, vx:(Math.random()-0.5)*0.5, vy:0.5, life:15, maxLife:15, size:1+Math.random(), color:'#6a6a7a', type:'dust' });
        }
        // Boost trail
        if (player.boostTrail) {
            particles.push({ x:player.x+(Math.random()-0.5)*6, y:player.y+15, vx:(Math.random()-0.5)*0.5, vy:1, life:12, maxLife:12, size:2+Math.random()*2, color:Math.random()>0.5?'#00AAFF':'#44CCFF', type:'boost' });
        }
        if (player.y >= GROUND_Y) {
            player.y = GROUND_Y; player.vy = 0;
            player.isJumping = false;
            player.boostTrail = false;
            player.squashX = 1.3; player.squashY = 0.7;
            addLandEffect(player.x, GROUND_Y);
        }
    }

    // Booster recharge
    if (!player.isJumping && player.boosterGauge < player.maxBooster) {
        player.boosterRechargeTimer += dt;
        if (player.boosterRechargeTimer > 3) { player.boosterGauge++; player.boosterRechargeTimer = 0; }
    }
    if (player.invincible > 0) player.invincible -= dt;
    if (!player.isJumping) { player.animTimer += dt*spd*2; player.animFrame = player.animTimer; }

    // Spawn
    if (Math.random() < currentStage.obstacleFreq*spd) spawnObstacle();
    if (Math.random() < currentStage.energyFreq) spawnEnergy();
    spawnBgEvents(spd);

    // Update obstacles + close call detection
    for (let i = obstacles.length-1; i >= 0; i--) {
        obstacles[i].x -= spd*2;
        if (obstacles[i].x < -60) {
            // Check close call
            const ox = obstacles[i].x;
            if (ox > -70 && ox < -30 && !obstacles[i].scored) {
                const S = SPRITE_SCALE;
                const px = player.x-10*S, py = player.y-26*S, pw = 20*S, ph = 30*S;
                const obx = obstacles[i].x-obstacles[i].width/2;
                // Already passed = close call if was near
                if (!player.isJumping || Math.abs(player.y-GROUND_Y) < 30*S) {
                    // regular pass, no combo
                } else {
                    comboCount++; comboTimer = 2;
                    floatingTexts.push({ x:player.x+30, y:player.y-20, text:'CLOSE!', color:'#FF8800', life:0.8, maxLife:0.8 });
                }
                obstacles[i].scored = true;
            }
            if (obstacles[i].x < -80) { obstacles.splice(i, 1); continue; }
        }
        if (player.invincible <= 0 && checkCollision(player, obstacles[i])) {
            hitPlayer(); obstacles.splice(i, 1);
        }
    }

    // Update energy
    for (let i = energyItems.length-1; i >= 0; i--) {
        energyItems[i].x -= spd*2;
        energyItems[i].frame++;
        if (energyItems[i].x < -20) { energyItems.splice(i, 1); continue; }
        if (checkCollisionEnergy(player, energyItems[i])) {
            collectEnergy(energyItems[i]); energyItems.splice(i, 1);
        }
    }

    // Update bg
    for (let i = bgObjects.length-1; i >= 0; i--) {
        const obj = bgObjects[i];
        if (obj.layer !== undefined) obj.x -= spd*bgLayers[obj.layer].speed;
        if (obj.x < -100) { bgObjects.splice(i, 1); continue; }
        if (obj.type==='meteor') { obj.x -= 1; obj.y += 0.7; if (obj.y > GROUND_Y) { addDustBurst(obj.x, GROUND_Y, 6); bgObjects.splice(i, 1); } }
        if (obj.type==='shooting_star') { obj.x -= 3; obj.y += 1; obj.life--; if (obj.life <= 0) bgObjects.splice(i, 1); }
    }

    // Ground tiles
    for (const tile of groundTiles) {
        tile.x -= spd*2;
        if (tile.x < -25) { tile.x = GAME_WIDTH+5; tile.height = 3+Math.random()*5; tile.shade = Math.random()*0.2; }
    }

    // Particles
    for (let i = particles.length-1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.type==='dust') p.vy += 0.015;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Impact rings
    for (let i = impactRings.length-1; i >= 0; i--) {
        const r = impactRings[i];
        r.radius += 2;
        r.alpha -= 0.03;
        if (r.alpha <= 0 || r.radius >= r.maxRadius) impactRings.splice(i, 1);
    }

    // Floating texts
    for (let i = floatingTexts.length-1; i >= 0; i--) {
        floatingTexts[i].y -= 0.8;
        floatingTexts[i].life -= dt;
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    if (screenShake > 0) screenShake *= 0.85;
    if (screenShake < 0.5) screenShake = 0;
}

function spawnObstacle() {
    const types = ['rock','crater','puddle'];
    const type = types[Math.floor(Math.random()*types.length)];
    const minGap = getMinObstacleGap();
    let obs = { x:GAME_WIDTH+30, y:GROUND_Y, type:type, width:20, height:15, scored:false };
    switch(type) {
        case 'rock':
            const sz = 0.9+Math.random()*0.5;
            obs.size = sz; obs.width = 20*sz*SPRITE_SCALE; obs.height = 16*sz*SPRITE_SCALE; break;
        case 'crater':
            obs.width = (30+Math.random()*15)*SPRITE_SCALE; obs.height = 8*SPRITE_SCALE; obs.y = GROUND_Y+2; break;
        case 'puddle':
            obs.width = (30+Math.random()*15)*SPRITE_SCALE; obs.height = 7*SPRITE_SCALE; obs.y = GROUND_Y+2; break;
    }
    if (obstacles.length > 0 && GAME_WIDTH+30-obstacles[obstacles.length-1].x < minGap) return;
    obstacles.push(obs);
}

function spawnEnergy() {
    if (energyItems.length > 3) return;
    energyItems.push({ x:GAME_WIDTH+20, y:GROUND_Y-50-Math.random()*60, frame:0, type:'energy' });
}

function spawnBgEvents(spd) {
    if (!currentStage) return;
    if (Math.random() < 0.002) {
        const evts = currentStage.events;
        const evt = evts[Math.floor(Math.random()*evts.length)];
        switch(evt) {
            case 'shooting_star': bgObjects.push({ type:'shooting_star', x:GAME_WIDTH+20, y:20+Math.random()*100, len:8+Math.random()*12, life:60, layer:undefined }); break;
            case 'meteor': bgObjects.push({ type:'meteor', x:GAME_WIDTH+50, y:-20, size:4+Math.random()*4, layer:undefined }); break;
            case 'rocket': bgObjects.push({ type:'rocket', x:GAME_WIDTH+20, y:50+Math.random()*100, layer:1 }); break;
            case 'spaceship': bgObjects.push({ type:'spaceship', x:GAME_WIDTH+30, y:30+Math.random()*80, layer:1 }); break;
            case 'planets': bgObjects.push({ type:'planet', x:GAME_WIDTH+30, y:30+Math.random()*60, size:8+Math.random()*12, color:['#8B4513','#4169E1','#FF6347','#9370DB'][Math.floor(Math.random()*4)], layer:1 }); break;
        }
    }
    const maxMX = bgObjects.filter(o=>o.type==='mountain').reduce((m,o)=>Math.max(m,o.x),0);
    if (maxMX < GAME_WIDTH+50) bgObjects.push({ type:'mountain', x:GAME_WIDTH+20+Math.random()*40, y:GROUND_Y+10, w:30+Math.random()*40, h:20+Math.random()*30, layer:2, color:'#2a2a3a' });
}

function checkCollision(player, obs) {
    const S = SPRITE_SCALE;
    const px=player.x-10*S, py=player.y-26*S, pw=20*S, ph=30*S;
    const ox=obs.x-obs.width/2, oy=obs.y-obs.height, ow=obs.width, oh=obs.height;
    return px<ox+ow && px+pw>ox && py<oy+oh && py+ph>oy;
}

function checkCollisionEnergy(player, energy) {
    const dx=player.x-energy.x, dy=(player.y-12)-energy.y;
    return Math.sqrt(dx*dx+dy*dy) < 25;
}

function hitPlayer() {
    player.lives--;
    player.invincible = 2;
    addHitEffect(player.x, player.y);
    Audio.playHit();
    comboCount = 0;
    if (player.lives <= 0) gameOver();
}

function collectEnergy(item) {
    if (player.boosterGauge < player.maxBooster) player.boosterGauge++;
    addCollectEffect(item.x, item.y);
}

function stageClear() {
    gameState = 'stageCleared';
    const si = currentStage.id-1;
    if (!saveData.clearedStages.includes(currentStage.id)) saveData.clearedStages.push(currentStage.id);
    if (distance > saveData.highScores[si]) saveData.highScores[si] = Math.floor(distance);
    saveData.totalDistance += Math.floor(distance);
    if (si+1 < STAGES.length) STAGES[si+1].unlocked = true;
    if (!saveData.badges.includes(currentStage.id)) saveData.badges.push(currentStage.id);
    saveSave();
    Audio.playClearJingle();
}

function gameOver() {
    gameState = 'gameOver';
    gameOverFactIdx = Math.floor(Math.random()*MOON_FACTS.length);
    const si = currentStage.id-1;
    if (distance > saveData.highScores[si]) saveData.highScores[si] = Math.floor(distance);
    saveData.totalDistance += Math.floor(distance);
    saveSave();
    Audio.playDeath();
    Audio.playGameOverBGM();
}

// ============================================
// DRAW GAME SCREEN
// ============================================
function drawGame() {
    if (!currentStage) return;
    ctx.save();
    if (screenShake > 0) ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);

    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, currentStage.bgColor);
    grad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y+10);

    // Stars
    for (const s of bgStars) {
        const sx = ((s.x-bgLayers[0].offset*s.speed*0.2)%GAME_WIDTH+GAME_WIDTH)%GAME_WIDTH;
        drawStar(sx, s.y, s.size, gameTime*s.speed+s.phase);
    }

    // BG layer 1
    bgObjects.filter(o=>o.layer===1).forEach(obj => {
        switch(obj.type) {
            case 'earth': drawEarth(obj.x, obj.y, obj.size); break;
            case 'rocket': drawRocket(obj.x, obj.y); break;
            case 'spaceship': drawSpaceship(obj.x, obj.y); break;
            case 'planet': drawPixelCircle(Math.floor(obj.x), Math.floor(obj.y), obj.size, obj.color); break;
        }
    });
    // BG layer 2
    bgObjects.filter(o=>o.layer===2).forEach(obj => { if (obj.type==='mountain') drawMountain(obj.x, obj.y, obj.w, obj.h, obj.color); });
    // BG no layer
    bgObjects.filter(o=>o.layer===undefined).forEach(obj => {
        switch(obj.type) {
            case 'shooting_star': drawShootingStar(obj.x, obj.y, obj.len); break;
            case 'meteor': drawMeteor(obj.x, obj.y, obj.size); break;
        }
    });

    // Ground
    ctx.fillStyle = currentStage.groundColor;
    ctx.fillRect(0, GROUND_Y+5, GAME_WIDTH, GAME_HEIGHT-GROUND_Y);
    drawPixelRect(0, GROUND_Y+5, GAME_WIDTH, 3, currentStage.groundAccent);
    for (const tile of groundTiles) {
        ctx.fillStyle = `rgba(0,0,0,${0.1+tile.shade})`;
        ctx.fillRect(Math.floor(tile.x), GROUND_Y+10, 12, tile.height);
    }
    for (let i = 0; i < 15; i++) {
        const rx = ((i*37+10-bgLayers[3].offset*0.5)%(GAME_WIDTH+40))-20;
        drawPixelRect(Math.floor(rx), GROUND_Y+8+(i%3)*4, 3, 2, '#3a3a4a');
    }

    // Obstacles
    for (const obs of obstacles) {
        switch(obs.type) {
            case 'rock': drawRock(obs.x, obs.y, obs.size); break;
            case 'crater': drawCrater(obs.x, obs.y, obs.width/SPRITE_SCALE); break;
            case 'puddle': drawPuddle(obs.x, obs.y, obs.width/SPRITE_SCALE); break;
        }
    }
    for (const e of energyItems) drawEnergy(e.x, e.y, e.frame);

    // Impact rings
    for (const r of impactRings) {
        ctx.strokeStyle = r.color || '#8a8a9a';
        ctx.globalAlpha = r.alpha;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI*2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Player
    if (player.invincible > 0) {
        if (Math.sin(player.invincible*15) > 0) {
            const ct = CHARACTERS.find(c=>c.id===saveData.selectedChar)?.type||'rover';
            drawRover(player.x, player.y, player.animFrame, ct);
        }
    } else {
        const ct = CHARACTERS.find(c=>c.id===saveData.selectedChar)?.type||'rover';
        drawRover(player.x, player.y, player.animFrame, ct);
    }

    // Jump shadow
    if (player.isJumping) {
        const ss = Math.max(0.2, 1-(GROUND_Y-player.y)/250);
        ctx.globalAlpha = 0.25*ss;
        drawPixelRect(player.x-10*ss, GROUND_Y+6, 20*ss, 3, '#000');
        ctx.globalAlpha = 1;
    }

    // Particles
    for (const p of particles) {
        ctx.globalAlpha = p.life/p.maxLife;
        drawPixelRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size, p.color);
    }
    ctx.globalAlpha = 1;

    // Floating texts
    for (const ft of floatingTexts) {
        ctx.globalAlpha = ft.life/ft.maxLife;
        drawGlowText(ft.text, ft.x, ft.y, ft.color, ft.size||12, 'center');
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Hit flash overlay
    if (hitFlash > 0) {
        ctx.globalAlpha = hitFlash * 3;
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.globalAlpha = 1;
    }

    drawHUD();
}

// ============================================
// INPUT HANDLING
// ============================================
function handleInput(x, y) {
    Audio.init();
    const gx = (x-offsetX)/scale;
    const gy = (y-offsetY)/scale;

    // Mute button check (during gameplay)
    if (gameState === 'playing' && gx > GAME_WIDTH-40 && gy > 44 && gy < 70) {
        Audio.toggleMute(); return;
    }

    switch(gameState) {
        case 'title':
            Audio.playClick();
            setGameState('charSelect');
            Audio.playTitleBGM();
            break;
        case 'charSelect': case 'stageSelect': case 'stageCleared': case 'gameOver':
            let hit = false;
            for (const btn of uiButtons) {
                if (gx>=btn.x && gx<=btn.x+btn.w && gy>=btn.y && gy<=btn.y+btn.h) {
                    Audio.playClick();
                    handleButton(btn); hit = true; break;
                }
            }
            if (!hit) {
                if (gameState==='charSelect') setGameState('stageSelect');
                else if (gameState==='stageCleared') setGameState('stageSelect');
                else if (gameState==='gameOver') setGameState('stageSelect');
            }
            break;
        case 'playing': jump(); break;
    }
}

function handleButton(btn) {
    switch(btn.action) {
        case 'selectChar': saveData.selectedChar = btn.data; saveSave(); setGameState('stageSelect'); break;
        case 'toStageSelect': setGameState('stageSelect'); break;
        case 'toCharSelect': setGameState('charSelect'); break;
        case 'startStage': initGame(btn.data); break;
        case 'retry': if (currentStage) initGame(currentStage.id-1); break;
        case 'back': setGameState('title'); break;
    }
}

// Touch
touchArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(e.touches[0].clientX, e.touches[0].clientY);
}, { passive:false });

// Mouse
touchArea.addEventListener('mousedown', (e) => handleInput(e.clientX, e.clientY));

// Keyboard
window.addEventListener('keydown', function(e) {
    Audio.init();
    const code = e.code;
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(code)) e.preventDefault();

    if (code === 'KeyM') { Audio.toggleMute(); return; }

    switch(gameState) {
        case 'title':
            Audio.playClick();
            setGameState('charSelect');
            Audio.playTitleBGM();
            break;
        case 'charSelect':
            if (code==='Enter'||code==='Space') { Audio.playClick(); setGameState('stageSelect'); }
            else if (code==='ArrowLeft'||code==='ArrowRight') {
                const uc = CHARACTERS.filter(c=>saveData.totalDistance>=c.unlockDist);
                const ci = uc.findIndex(c=>c.id===saveData.selectedChar);
                const ni = code==='ArrowRight'?(ci+1)%uc.length:(ci-1+uc.length)%uc.length;
                saveData.selectedChar = uc[ni].id; saveSave(); Audio.playClick();
            } else if (code==='Escape') setGameState('title');
            break;
        case 'stageSelect':
            if (code==='Escape') setGameState('charSelect');
            else {
                const num = parseInt(e.key);
                if (num>=1&&num<=5&&STAGES[num-1].unlocked) { Audio.playClick(); initGame(num-1); }
                else if (code==='Enter'||code==='Space') {
                    const fi = STAGES.findIndex(s=>s.unlocked&&!saveData.clearedStages.includes(s.id));
                    const idx = fi>=0?fi:0;
                    if (STAGES[idx].unlocked) { Audio.playClick(); initGame(idx); }
                }
            }
            break;
        case 'playing':
            if (code==='Space'||code==='ArrowUp') jump();
            break;
        case 'stageCleared':
            if (code==='Enter'||code==='Space') { Audio.playClick(); setGameState('stageSelect'); }
            break;
        case 'gameOver':
            if (code==='Enter'||code==='Space') { Audio.playClick(); if (currentStage) initGame(currentStage.id-1); }
            else if (code==='Escape') setGameState('stageSelect');
            break;
    }
}, true);

// ============================================
// RESIZE
// ============================================
function resize() {
    const w=window.innerWidth, h=window.innerHeight;
    const sx=w/GAME_WIDTH, sy=h/GAME_HEIGHT;
    scale = Math.min(sx, sy);
    canvas.width = GAME_WIDTH; canvas.height = GAME_HEIGHT;
    canvas.style.width = `${GAME_WIDTH*scale}px`;
    canvas.style.height = `${GAME_HEIGHT*scale}px`;
    offsetX = (w-GAME_WIDTH*scale)/2;
    offsetY = (h-GAME_HEIGHT*scale)/2;
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
    const dt = Math.min((timestamp-lastTime)/1000, 0.05);
    lastTime = timestamp;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Update title shooting stars
    if (gameState === 'title') {
        titleAnimTimer += dt;
        titleRoverX += 0.3;
        if (titleRoverX > GAME_WIDTH+50) titleRoverX = -50;
        titleTypewriter += dt * 4;
        // Spawn shooting stars
        if (Math.random() < 0.008) {
            titleShootingStars.push({ x:Math.random()*GAME_WIDTH*0.5+GAME_WIDTH*0.5, y:Math.random()*100, len:8+Math.random()*10, life:50, maxLife:50 });
        }
        for (let i = titleShootingStars.length-1; i >= 0; i--) {
            titleShootingStars[i].x -= 3;
            titleShootingStars[i].y += 1.2;
            titleShootingStars[i].life--;
            if (titleShootingStars[i].life <= 0) titleShootingStars.splice(i, 1);
        }
    }

    updateTransition(dt);

    switch(gameState) {
        case 'title': drawTitle(); break;
        case 'charSelect': gameTime += dt; drawCharSelect(); break;
        case 'stageSelect': gameTime += dt; drawStageSelect(); break;
        case 'playing': updateGame(dt); drawGame(); break;
        case 'stageCleared': gameTime += dt; drawStageClear(); break;
        case 'gameOver': gameTime += dt; drawGameOver(); break;
    }

    drawTransition();
    requestAnimationFrame(gameLoop);
}

// Initialize
initStars();
touchArea.focus();
touchArea.addEventListener('click', () => touchArea.focus());
requestAnimationFrame(gameLoop);
