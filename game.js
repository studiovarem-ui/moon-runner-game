// ============================================
// MOON RUNNER v3.0 - Timing-Based Gameplay Rebuild
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const touchArea = document.getElementById('touch-area');

// --- CONSTANTS ---
const GAME_WIDTH = 400;
const GAME_HEIGHT = 700;
const GRAVITY = 0.12;
const SHORT_JUMP = -3.5;
const LONG_JUMP = -5.5;
const BOOST_FORCE = -3.0;
const GROUND_Y = 560;
const SPRITE_SCALE = 1.3;
const PRESS_THRESHOLD = 150; // ms for short/long press

// --- DIFFICULTY ---
const DIFFICULTIES = [
    { id:'easy', label:'EASY', labelKo:'쉬움', speedMult:0.8, gapMult:1.3, color:'#44FF44' },
    { id:'normal', label:'NORMAL', labelKo:'보통', speedMult:1.0, gapMult:1.0, color:'#FFFF44' },
    { id:'hard', label:'HARD', labelKo:'어려움', speedMult:1.2, gapMult:0.8, color:'#FF8844' },
    { id:'hell', label:'HELL', labelKo:'지옥', speedMult:1.5, gapMult:0.6, color:'#FF4444' }
];
let selectedDifficulty = 1; // NORMAL

// --- GAME STATE ---
let gameState = 'title';
let scale = 1;
let offsetX = 0;
let offsetY = 0;

// --- STAGES ---
const STAGES = [
    { id:1, name:'Mare Tranquillitatis', nameKo:'고요의 바다', desc:'기초 리듬 학습', speed:2.5, targetDist:600, bgColor:'#1a1a2e', groundColor:'#4a4a5a', groundAccent:'#3a3a4a', patternPool:[0,1,2], events:['stars','earth'], unlocked:true },
    { id:2, name:'Oceanus Procellarum', nameKo:'폭풍의 대양', desc:'크레이터 등장', speed:3.0, targetDist:900, bgColor:'#151528', groundColor:'#555568', groundAccent:'#454558', patternPool:[0,1,2,3,4,5], events:['stars','dust_storm','shooting_star'], unlocked:false },
    { id:3, name:'Mare Imbrium', nameKo:'비의 바다', desc:'공중 장애물 등장!', speed:3.5, targetDist:1200, bgColor:'#121225', groundColor:'#606075', groundAccent:'#505065', patternPool:[0,1,2,3,4,5,6,7,8], events:['stars','meteor','planets'], unlocked:false },
    { id:4, name:'Tycho Crater', nameKo:'티코 크레이터', desc:'레이저 + 복합 패턴', speed:4.0, targetDist:1600, bgColor:'#0e0e20', groundColor:'#6a6a80', groundAccent:'#5a5a70', patternPool:[0,1,2,3,4,5,6,7,8,9,10,11], events:['stars','volcano','shooting_star','rocket'], unlocked:false },
    { id:5, name:'Mare Frigoris', nameKo:'추위의 바다', desc:'최종 도전!', speed:4.5, targetDist:2000, bgColor:'#0a0a1a', groundColor:'#7a7a90', groundAccent:'#6a6a80', patternPool:[0,1,2,3,4,5,6,7,8,9,10,11,12,13], events:['stars','meteor','volcano','spaceship','sun'], unlocked:false }
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

// --- OBSTACLE PATTERNS ---
// Each pattern: array of {type, dx(offset from start), dy(offset from ground), size}
const PATTERNS = [
    // 0: Single small rock
    { name:'single_rock', obs:[{type:'rock',dx:0,dy:0,size:0.8}], coins:[] },
    // 1: Two rocks rhythm
    { name:'double_rock', obs:[{type:'rock',dx:0,dy:0,size:0.8},{type:'rock',dx:90,dy:0,size:0.8}], coins:[{dx:45,dy:-50}] },
    // 2: Three rocks rhythm (tap-tap-tap)
    { name:'triple_rock', obs:[{type:'rock',dx:0,dy:0,size:0.7},{type:'rock',dx:80,dy:0,size:0.7},{type:'rock',dx:160,dy:0,size:0.7}], coins:[{dx:40,dy:-45},{dx:120,dy:-45}] },
    // 3: Big rock (long jump needed)
    { name:'big_rock', obs:[{type:'rock',dx:0,dy:0,size:1.4}], coins:[{dx:0,dy:-80}] },
    // 4: Crater
    { name:'crater', obs:[{type:'crater',dx:0,dy:0,w:40}], coins:[{dx:0,dy:-60}] },
    // 5: Crater + rock combo
    { name:'crater_rock', obs:[{type:'crater',dx:0,dy:0,w:35},{type:'rock',dx:70,dy:0,size:0.8}], coins:[{dx:35,dy:-55}] },
    // 6: Floating meteor (must go under - short jump or stay grounded)
    { name:'float_meteor', obs:[{type:'float_meteor',dx:0,dy:-90,size:1.0}], coins:[{dx:0,dy:-20}] },
    // 7: Low rock + high meteor (must jump at right height)
    { name:'gap_through', obs:[{type:'rock',dx:0,dy:0,size:0.6},{type:'float_meteor',dx:0,dy:-110,size:0.8}], coins:[{dx:0,dy:-55}] },
    // 8: Rock + coin line above (jump for reward)
    { name:'coin_line', obs:[{type:'rock',dx:0,dy:0,size:0.9}], coins:[{dx:-20,dy:-70},{dx:0,dy:-75},{dx:20,dy:-70}] },
    // 9: Laser line (warning + beam)
    { name:'laser', obs:[{type:'laser',dx:0,dy:-40,h:4}], coins:[{dx:-30,dy:-10},{dx:30,dy:-10}] },
    // 10: Double crater (long jump)
    { name:'long_crater', obs:[{type:'crater',dx:0,dy:0,w:60}], coins:[{dx:-15,dy:-70},{dx:15,dy:-70}] },
    // 11: Laser high + rock low
    { name:'laser_rock', obs:[{type:'laser',dx:0,dy:-55,h:4},{type:'rock',dx:50,dy:0,size:0.7}], coins:[{dx:25,dy:-30}] },
    // 12: Triple meteor wave
    { name:'meteor_wave', obs:[{type:'float_meteor',dx:0,dy:-70,size:0.7},{type:'float_meteor',dx:60,dy:-100,size:0.7},{type:'float_meteor',dx:120,dy:-70,size:0.7}], coins:[{dx:30,dy:-40},{dx:90,dy:-40}] },
    // 13: Boss pattern - everything
    { name:'boss', obs:[{type:'rock',dx:0,dy:0,size:1.0},{type:'float_meteor',dx:60,dy:-80,size:0.8},{type:'crater',dx:130,dy:0,w:35},{type:'rock',dx:200,dy:0,size:0.7}], coins:[{dx:30,dy:-55},{dx:95,dy:-20},{dx:165,dy:-60}] }
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
const MILESTONES = [100,200,350,500,700,1000,1500,2000];

// ============================================
// AUDIO MANAGER
// ============================================
const Audio = {
    ctx:null, masterGain:null, bgmGain:null, sfxGain:null, bgmNodes:[], initialized:false, muted:false,
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain(); this.masterGain.gain.value = 0.6; this.masterGain.connect(this.ctx.destination);
            this.bgmGain = this.ctx.createGain(); this.bgmGain.gain.value = 0.3; this.bgmGain.connect(this.masterGain);
            this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.5; this.sfxGain.connect(this.masterGain);
            this.initialized = true;
        } catch(e){}
    },
    toggleMute() { this.muted=!this.muted; if(this.masterGain) this.masterGain.gain.value=this.muted?0:0.6; },
    stopBGM() { this.bgmNodes.forEach(n=>{try{n.stop();}catch(e){}}); this.bgmNodes=[]; },
    playTitleBGM() {
        if(!this.initialized) return; this.stopBGM();
        const c=this.ctx, now=c.currentTime;
        const o1=c.createOscillator(); o1.type='sine'; o1.frequency.value=110;
        const g1=c.createGain(); g1.gain.value=0.15; o1.connect(g1); g1.connect(this.bgmGain); o1.start(now); this.bgmNodes.push(o1);
        const o2=c.createOscillator(); o2.type='sine'; o2.frequency.value=440;
        const g2=c.createGain(); g2.gain.value=0;
        o2.connect(g2); g2.connect(this.bgmGain); o2.start(now); this.bgmNodes.push(o2);
        const lfo=c.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.3;
        const lg=c.createGain(); lg.gain.value=0.06; lfo.connect(lg); lg.connect(g2.gain); lfo.start(now); this.bgmNodes.push(lfo);
        const notes=[261.6,329.6,392,523.3,392,329.6]; const o3=c.createOscillator(); o3.type='triangle';
        const g3=c.createGain(); g3.gain.value=0.04; o3.connect(g3); g3.connect(this.bgmGain); o3.start(now); this.bgmNodes.push(o3);
        let t=now; for(let l=0;l<200;l++) for(const n of notes){o3.frequency.setValueAtTime(n,t);t+=1.2;}
    },
    playGameBGM() {
        if(!this.initialized) return; this.stopBGM();
        const c=this.ctx, now=c.currentTime;
        const bass=c.createOscillator(); bass.type='sawtooth'; bass.frequency.value=55;
        const bG=c.createGain(); bG.gain.value=0.08;
        const bF=c.createBiquadFilter(); bF.type='lowpass'; bF.frequency.value=200;
        bass.connect(bF); bF.connect(bG); bG.connect(this.bgmGain); bass.start(now); this.bgmNodes.push(bass);
        const pulse=c.createOscillator(); pulse.type='square'; pulse.frequency.value=82.4;
        const pG=c.createGain(); pG.gain.value=0; pulse.connect(pG); pG.connect(this.bgmGain); pulse.start(now); this.bgmNodes.push(pulse);
        let t=now; for(let i=0;i<600;i++){pG.gain.setValueAtTime(0.06,t);pG.gain.setValueAtTime(0,t+0.08);t+=0.5;}
        const ten=c.createOscillator(); ten.type='sine'; ten.frequency.value=220;
        const tG=c.createGain(); tG.gain.value=0.03; ten.connect(tG); tG.connect(this.bgmGain); ten.start(now); this.bgmNodes.push(ten);
        const tN=[220,233,220,196,220,247,233,220]; let tt=now;
        for(let l=0;l<100;l++) for(const n of tN){ten.frequency.setValueAtTime(n,tt);tt+=2;}
    },
    playClearJingle() {
        if(!this.initialized) return; this.stopBGM();
        const c=this.ctx, now=c.currentTime;
        [523.3,659.3,784,1047].forEach((f,i)=>{
            const o=c.createOscillator(); o.type='sine'; o.frequency.value=f;
            const g=c.createGain(); g.gain.setValueAtTime(0,now+i*0.2); g.gain.linearRampToValueAtTime(0.15,now+i*0.2+0.05);
            g.gain.linearRampToValueAtTime(0.08,now+i*0.2+0.5); g.gain.linearRampToValueAtTime(0,now+2);
            o.connect(g); g.connect(this.bgmGain); o.start(now+i*0.2); o.stop(now+2.5);
        });
        const pad=c.createOscillator(); pad.type='sine'; pad.frequency.value=261.6;
        const pG=c.createGain(); pG.gain.setValueAtTime(0,now+0.8); pG.gain.linearRampToValueAtTime(0.1,now+1.2);
        pad.connect(pG); pG.connect(this.bgmGain); pad.start(now+0.8); this.bgmNodes.push(pad);
    },
    playGameOverBGM() {
        if(!this.initialized) return; this.stopBGM();
        const c=this.ctx, now=c.currentTime;
        [220,196,174.6,164.8].forEach((f,i)=>{
            const o=c.createOscillator(); o.type='sine'; o.frequency.value=f;
            const g=c.createGain(); g.gain.setValueAtTime(0,now+i*0.6); g.gain.linearRampToValueAtTime(0.1,now+i*0.6+0.1);
            g.gain.linearRampToValueAtTime(0.04,now+i*0.6+0.5); g.gain.linearRampToValueAtTime(0,now+4);
            o.connect(g); g.connect(this.bgmGain); o.start(now+i*0.6); o.stop(now+5);
        });
        const dr=c.createOscillator(); dr.type='sine'; dr.frequency.value=82.4;
        const dG=c.createGain(); dG.gain.value=0.06; dr.connect(dG); dG.connect(this.bgmGain); dr.start(now); this.bgmNodes.push(dr);
    },
    playJump() { if(!this.initialized)return; const c=this.ctx,now=c.currentTime; const o=c.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(200,now); o.frequency.exponentialRampToValueAtTime(800,now+0.15); const g=c.createGain(); g.gain.setValueAtTime(0.15,now); g.gain.linearRampToValueAtTime(0,now+0.2); o.connect(g); g.connect(this.sfxGain); o.start(now); o.stop(now+0.2); },
    playLand() { if(!this.initialized)return; const c=this.ctx,now=c.currentTime; const o=c.createOscillator(); o.type='sine'; o.frequency.value=80; const g=c.createGain(); g.gain.setValueAtTime(0.2,now); g.gain.linearRampToValueAtTime(0,now+0.12); o.connect(g); g.connect(this.sfxGain); o.start(now); o.stop(now+0.15); const buf=c.createBuffer(1,c.sampleRate*0.08,c.sampleRate); const d=buf.getChannelData(0); for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length); const n=c.createBufferSource(); n.buffer=buf; const nG=c.createGain(); nG.gain.value=0.1; const nF=c.createBiquadFilter(); nF.type='lowpass'; nF.frequency.value=300; n.connect(nF); nF.connect(nG); nG.connect(this.sfxGain); n.start(now); },
    playBoost() { if(!this.initialized)return; const c=this.ctx,now=c.currentTime; const buf=c.createBuffer(1,c.sampleRate*0.25,c.sampleRate); const d=buf.getChannelData(0); for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1; const n=c.createBufferSource(); n.buffer=buf; const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1200; f.Q.value=2; const g=c.createGain(); g.gain.setValueAtTime(0.12,now); g.gain.linearRampToValueAtTime(0,now+0.25); n.connect(f); f.connect(g); g.connect(this.sfxGain); n.start(now); },
    playHit() { if(!this.initialized)return; const c=this.ctx,now=c.currentTime; const o=c.createOscillator(); o.type='square'; o.frequency.setValueAtTime(150,now); o.frequency.linearRampToValueAtTime(50,now+0.2); const g=c.createGain(); g.gain.setValueAtTime(0.2,now); g.gain.linearRampToValueAtTime(0,now+0.25); o.connect(g); g.connect(this.sfxGain); o.start(now); o.stop(now+0.25); },
    playCollect() { if(!this.initialized)return; const c=this.ctx,now=c.currentTime; const o=c.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(523,now); o.frequency.setValueAtTime(784,now+0.08); const g=c.createGain(); g.gain.setValueAtTime(0.15,now); g.gain.linearRampToValueAtTime(0,now+0.2); o.connect(g); g.connect(this.sfxGain); o.start(now); o.stop(now+0.25); },
    playClick() { if(!this.initialized)return; const c=this.ctx,now=c.currentTime; const o=c.createOscillator(); o.type='sine'; o.frequency.value=1000; const g=c.createGain(); g.gain.setValueAtTime(0.1,now); g.gain.linearRampToValueAtTime(0,now+0.05); o.connect(g); g.connect(this.sfxGain); o.start(now); o.stop(now+0.06); },
    playDeath() { if(!this.initialized)return; const c=this.ctx,now=c.currentTime; const o=c.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(200,now); o.frequency.exponentialRampToValueAtTime(40,now+0.5); const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=400; const g=c.createGain(); g.gain.setValueAtTime(0.15,now); g.gain.linearRampToValueAtTime(0,now+0.6); o.connect(f); f.connect(g); g.connect(this.sfxGain); o.start(now); o.stop(now+0.6); },
    playMilestone() { if(!this.initialized)return; const c=this.ctx,now=c.currentTime; [784,988,1175].forEach((f,i)=>{const o=c.createOscillator();o.type='sine';o.frequency.value=f;const g=c.createGain();g.gain.setValueAtTime(0,now+i*0.1);g.gain.linearRampToValueAtTime(0.12,now+i*0.1+0.03);g.gain.linearRampToValueAtTime(0,now+i*0.1+0.3);o.connect(g);g.connect(this.sfxGain);o.start(now+i*0.1);o.stop(now+0.5);}); },
    playPerfect() { if(!this.initialized)return; const c=this.ctx,now=c.currentTime; [880,1108,1320].forEach((f,i)=>{const o=c.createOscillator();o.type='sine';o.frequency.value=f;const g=c.createGain();g.gain.setValueAtTime(0,now+i*0.07);g.gain.linearRampToValueAtTime(0.14,now+i*0.07+0.02);g.gain.linearRampToValueAtTime(0,now+i*0.07+0.2);o.connect(g);g.connect(this.sfxGain);o.start(now+i*0.07);o.stop(now+0.4);}); },
    playCombo(count) { if(!this.initialized)return; const c=this.ctx,now=c.currentTime; const freq=440+count*60; const o=c.createOscillator();o.type='sine';o.frequency.value=Math.min(freq,1200); const g=c.createGain();g.gain.setValueAtTime(0.18,now);g.gain.linearRampToValueAtTime(0,now+0.3);o.connect(g);g.connect(this.sfxGain);o.start(now);o.stop(now+0.3); }
};

// ============================================
// TRANSITION SYSTEM
// ============================================
const transition = { active:false, phase:'out', progress:0, duration:0.4, toState:null, flashColor:null, callback:null };
function setGameState(newState) {
    Audio.init();
    if(transition.active) return;
    const cfgMap = { 'title':{d:0.3},'difficultySelect':{d:0.3},'charSelect':{d:0.35},'stageSelect':{d:0.35},'playing':{d:0.4},'stageCleared':{d:0.3,flash:'rgba(255,255,200,0.6)'},'gameOver':{d:0.4,flash:'rgba(255,0,0,0.4)'} };
    const cfg = cfgMap[newState]||{d:0.3};
    transition.active=true; transition.phase='out'; transition.progress=0; transition.duration=cfg.d; transition.toState=newState; transition.flashColor=cfg.flash||null;
    transition.callback=()=>{ gameState=newState; switch(newState){case'title':Audio.playTitleBGM();break;case'playing':Audio.playGameBGM();break;case'stageCleared':Audio.playClearJingle();break;case'gameOver':Audio.playGameOverBGM();break;} };
}
function updateTransition(dt) { if(!transition.active)return; transition.progress+=dt/transition.duration; if(transition.progress>=1){if(transition.phase==='out'){transition.phase='in';transition.progress=0;if(transition.callback)transition.callback();}else{transition.active=false;}} }
function drawTransition() { if(!transition.active)return; let a=transition.phase==='out'?transition.progress:1-transition.progress; if(transition.flashColor&&transition.phase==='out'&&transition.progress<0.3){ctx.fillStyle=transition.flashColor;ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);} ctx.fillStyle=`rgba(0,0,0,${a*0.85})`;ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT); }

// ============================================
// SAVE DATA
// ============================================
let saveData = { totalDistance:0, highScores:[0,0,0,0,0], clearedStages:[], selectedChar:'rover', badges:[], totalCoins:0, difficulty:1 };
function loadSave() { try{const s=localStorage.getItem('moonrunner_save');if(s)saveData=JSON.parse(s);}catch(e){} STAGES[0].unlocked=true; for(let i=1;i<STAGES.length;i++)STAGES[i].unlocked=saveData.clearedStages.includes(STAGES[i-1].id); if(saveData.difficulty!==undefined)selectedDifficulty=saveData.difficulty; }
function saveSave() { saveData.difficulty=selectedDifficulty; try{localStorage.setItem('moonrunner_save',JSON.stringify(saveData));}catch(e){} }
loadSave();

// ============================================
// GAME VARIABLES
// ============================================
let player = { x:80, y:GROUND_Y, vy:0, width:32, height:32, isJumping:false, boosterGauge:3, maxBooster:3, boosterRechargeTimer:0, lives:3, invincible:0, animFrame:0, animTimer:0, squashX:1, squashY:1, boostTrail:false };
let currentStage = null;
let distance = 0;
let score = 0;
let coinsCollected = 0;
let scrollSpeed = 0;
let obstacles = [];
let coins = [];
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
let bgLayers = [{offset:0,speed:0.1},{offset:0,speed:0.3},{offset:0,speed:0.6},{offset:0,speed:1.0}];

// Pattern system
let patternQueue = [];
let patternCooldown = 0;
let restTimer = 0;
let patternsDelivered = 0;

// Input tracking for short/long press
let pressStartTime = 0;
let isPressed = false;
let keyIsDown = false;

// Laser warning
let laserWarnings = [];

// ============================================
// DRAWING HELPERS
// ============================================
function drawPixelRect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.floor(x),Math.floor(y),w,h);}
function drawPixelCircle(cx,cy,r,color){ctx.fillStyle=color;for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r)ctx.fillRect(Math.floor(cx+x),Math.floor(cy+y),1,1);}
function drawText(text,x,y,color,size,align){ctx.fillStyle=color||'#FFF';ctx.font=`bold ${size||10}px monospace`;ctx.textAlign=align||'left';ctx.textBaseline='top';ctx.fillText(text,Math.floor(x),Math.floor(y));}
function drawTextOutline(text,x,y,color,outColor,size,align){ctx.font=`bold ${size||10}px monospace`;ctx.textAlign=align||'left';ctx.textBaseline='top';ctx.fillStyle=outColor||'#000';for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){if(ox===0&&oy===0)continue;ctx.fillText(text,Math.floor(x+ox),Math.floor(y+oy));}ctx.fillStyle=color||'#FFF';ctx.fillText(text,Math.floor(x),Math.floor(y));}
function drawGlowText(text,x,y,color,size,align){ctx.save();ctx.font=`bold ${size||10}px monospace`;ctx.textAlign=align||'left';ctx.textBaseline='top';ctx.shadowColor=color;ctx.shadowBlur=15;ctx.fillStyle=color;ctx.fillText(text,Math.floor(x),Math.floor(y));ctx.shadowBlur=0;ctx.fillStyle='#FFF';ctx.fillText(text,Math.floor(x),Math.floor(y));ctx.restore();}
function wrapText(text,x,y,maxW,lh,color,size,align){ctx.font=`bold ${size}px monospace`;const lines=text.split('\n');let ly=y;for(const raw of lines){let line='';for(let i=0;i<raw.length;i++){const test=line+raw[i];if(ctx.measureText(test).width>maxW&&line.length>0){drawText(line,x,ly,color,size,align);line=raw[i];ly+=lh;}else line=test;}drawText(line,x,ly,color,size,align);ly+=lh;}}

// ============================================
// SPRITE DRAWING
// ============================================
function drawRover(x,y,frame,type) {
    const f=Math.floor(frame)%8; x=Math.floor(x); y=Math.floor(y);
    const S=SPRITE_SCALE; ctx.save(); ctx.translate(x,y); ctx.scale(S*player.squashX,S*player.squashY);
    if(type==='rover') {
        ctx.globalAlpha=0.2; drawPixelRect(-12,4,24,3,'#000'); ctx.globalAlpha=1;
        drawPixelRect(-13,-16,26,11,'#A0A0B0'); drawPixelRect(-12,-17,24,10,'#C0C0C8'); drawPixelRect(-10,-18,20,4,'#D0D0D8');
        drawPixelRect(-10,-17,18,1,'#E8E8F0');
        drawPixelRect(-8,-14,16,6,'#B0B0C0'); drawPixelRect(-6,-13,12,4,'#909098');
        drawPixelRect(5,-30,2,14,'#707080'); drawPixelCircle(6,-32,4,'#B0B0C0'); drawPixelCircle(6,-32,3,'#C8C8D0'); drawPixelCircle(6,-32,1,'#FFD700');
        const wobble=Math.sin(gameTime*4)*0.5; drawPixelRect(5+wobble,-28,2,2,'#707080');
        drawPixelRect(-16,-22,10,3,'#4169E1'); drawPixelRect(-16,-21,10,1,'#1E90FF');
        for(let i=0;i<5;i++)drawPixelRect(-16+i*2,-22,1,3,'#2a4aA0');
        drawPixelRect(12,-14,6,2,'#808090'); drawPixelRect(16,-16,2,4,'#909098');
        const wb=f%2===0?0:1;
        for(let side=-1;side<=1;side+=2){const wx=side*8;drawPixelCircle(wx,-2+wb,6,'#252535');drawPixelCircle(wx,-2+wb,5,'#353545');drawPixelCircle(wx,-2+wb,3,'#454555');for(let t=0;t<4;t++){const angle=(f*0.5+t*Math.PI/2);const tx=Math.cos(angle)*5;const ty=Math.sin(angle)*5;drawPixelRect(wx+tx-0.5,-2+wb+ty-0.5,2,2,'#555565');}}
        drawPixelRect(10,-17,6,5,'#303040'); drawPixelRect(11,-16,4,3,'#00FF88');
        const glint=Math.sin(gameTime*3)*0.5+0.5; ctx.globalAlpha=glint; drawPixelRect(12,-16,2,1,'#FFF'); ctx.globalAlpha=1;
    } else {
        drawPixelRect(-8,-34,16,16,'#E0E0E8'); drawPixelRect(-7,-33,14,14,'#E8E8F0'); drawPixelRect(-6,-32,12,12,'#F0F0F8');
        drawPixelRect(-5,-30,10,8,'#1a1a3a'); drawPixelRect(-4,-29,8,6,'#2a2a5a');
        const vg=(gameTime*30)%12; ctx.globalAlpha=0.6; drawPixelRect(-5+vg,-29,2,5,'#88BBFF'); ctx.globalAlpha=0.3; drawPixelRect(-4+vg,-28,1,3,'#FFF'); ctx.globalAlpha=1;
        drawPixelRect(-3,-30,3,1,'#FFD700');
        drawPixelRect(-9,-18,18,17,'#E8E8F0'); drawPixelRect(-8,-17,16,15,'#D8D8E8');
        drawPixelRect(-1,-17,2,15,'#C0C0D0'); drawPixelRect(-4,-16,3,3,'#FF4444'); drawPixelRect(1,-16,3,3,'#4444FF');
        drawPixelRect(-3,-12,6,2,'#CCCCDD');
        drawPixelRect(-12,-17,4,14,'#A0A0B0'); drawPixelRect(-13,-15,2,4,'#808890'); drawPixelRect(-13,-10,2,4,'#808890');
        drawPixelRect(-12,-17,1,1,Math.sin(gameTime*5)>0?'#00FF00':'#004400');
        const armSwing=Math.sin(f*Math.PI/4)*2;
        drawPixelRect(-11,-16+armSwing,3,11,'#D8D8E8'); drawPixelRect(-12,-7+armSwing,4,3,'#B0B0C0');
        drawPixelRect(8,-16-armSwing,3,11,'#D8D8E8'); drawPixelRect(8,-7-armSwing,4,3,'#B0B0C0');
        const legL=Math.sin(f*Math.PI/4)*3; const legR=Math.sin(f*Math.PI/4+Math.PI)*3;
        drawPixelRect(-7,-1,6,8+legL,'#C8C8D8'); drawPixelRect(1,-1,6,8+legR,'#C8C8D8');
        drawPixelRect(-8,7+legL,7,3,'#505060'); drawPixelRect(0,7+legR,7,3,'#505060');
        if(!player.isJumping){const bounce=Math.abs(Math.sin(f*Math.PI/4))*1.5;ctx.translate(0,-bounce);}
    }
    ctx.restore();
}

function drawRock(x,y,size) {
    x=Math.floor(x); y=Math.floor(y); const s=(size||1)*SPRITE_SCALE;
    ctx.globalAlpha=0.12; drawPixelCircle(x,y-6*s,14*s,'#FF4444'); ctx.globalAlpha=1;
    drawPixelRect(x-10*s,y+2,20*s,4,'rgba(0,0,0,0.4)');
    drawPixelRect(x-10*s,y-10*s,20*s,12*s,'#5a4a3a'); drawPixelRect(x-9*s,y-12*s,18*s,12*s,'#6a5a4a');
    drawPixelRect(x-8*s,y-11*s,16*s,10*s,'#7a6a5a'); drawPixelRect(x-7*s,y-14*s,14*s,5*s,'#6a5a4a');
    drawPixelRect(x-6*s,y-13*s,12*s,3*s,'#8a7a6a');
    drawPixelRect(x-5*s,y-13*s,8*s,2*s,'#aa9a8a'); drawPixelRect(x-8*s,y-10*s,3*s,4*s,'#9a8a7a');
    drawPixelRect(x+2*s,y-8*s,3*s,2*s,'#88aacc'); drawPixelRect(x-5*s,y-6*s,2*s,2*s,'#ccaa88');
    drawPixelRect(x+1*s,y-9*s,1*s,7*s,'#3a2a1a'); drawPixelRect(x-3*s,y-5*s,5*s,1*s,'#3a2a1a');
}

function drawCrater(x,y,width) {
    x=Math.floor(x); y=Math.floor(y); const w=(width||35)*SPRITE_SCALE;
    drawPixelRect(x-w/2-2,y-5,w+4,2,'#FF6644');
    drawPixelRect(x-w/2,y-4,w,4,'#8a8a9a'); drawPixelRect(x-w/2+2,y-5,w-4,2,'#9a9aaa');
    drawPixelRect(x-w/2-3,y-3,2,2,'#7a7a8a'); drawPixelRect(x+w/2+1,y-4,2,2,'#7a7a8a');
    drawPixelRect(x-w/2+3,y,w-6,9,'#0a0a1a'); drawPixelRect(x-w/2+5,y+2,w-10,6,'#060612'); drawPixelRect(x-w/2+7,y+4,w-14,3,'#030308');
    drawPixelRect(x-w/4,y+1,w/2,1,'#1a1a3a'); drawPixelRect(x-w/2+3,y-5,w-6,1,'#bbbbd0');
}

function drawFloatMeteor(x,y,size) {
    x=Math.floor(x); y=Math.floor(y); const s=(size||1)*SPRITE_SCALE;
    const bob=Math.sin(gameTime*2+x*0.01)*5;
    ctx.globalAlpha=0.15; drawPixelCircle(x,y+bob,12*s,'#FF6600'); ctx.globalAlpha=1;
    drawPixelCircle(x,y+bob,8*s,'#8B4513'); drawPixelCircle(x,y+bob,6*s,'#A0522D'); drawPixelCircle(x,y+bob,3*s,'#CD853F');
    drawPixelRect(x-2*s,y-2*s+bob,2*s,2*s,'#DEB887');
    // Fire trail
    for(let i=0;i<3;i++){ctx.globalAlpha=0.5-i*0.15;drawPixelRect(x+7*s+i*4,y+bob-2+i*2,3,2,i<1?'#FF4500':'#FF8C00');}
    ctx.globalAlpha=1;
}

function drawLaser(x,y,h) {
    x=Math.floor(x); y=Math.floor(y);
    const pulse=Math.sin(gameTime*10)*0.3+0.7;
    // Warning pillars
    drawPixelRect(x-3,GROUND_Y-2,6,4,'#880000'); drawPixelRect(x-2,y-30,4,30-y+GROUND_Y,'#660000');
    // Beam
    ctx.globalAlpha=pulse; drawPixelRect(x-GAME_WIDTH/2,y-2,GAME_WIDTH,h||4,'#FF0000');
    ctx.globalAlpha=pulse*0.5; drawPixelRect(x-GAME_WIDTH/2,y-4,GAME_WIDTH,(h||4)+4,'rgba(255,0,0,0.3)');
    ctx.globalAlpha=1;
    // Glow dots
    for(let i=0;i<8;i++){const gx=x-GAME_WIDTH/2+i*(GAME_WIDTH/8)+Math.sin(gameTime*8+i)*5; drawPixelRect(gx,y-1,2,2,'#FFAAAA');}
}

function drawCoin(x,y,frame) {
    x=Math.floor(x); y=Math.floor(y);
    const bob=Math.sin(frame*0.08)*4;
    const glow=Math.sin(frame*0.12)*0.3+0.7;
    const S=SPRITE_SCALE;
    ctx.globalAlpha=glow*0.25; drawPixelCircle(x,y+bob,8*S,'#FFD700'); ctx.globalAlpha=1;
    drawPixelCircle(x,y+bob,5*S,'#DAA520'); drawPixelCircle(x,y+bob,4*S,'#FFD700'); drawPixelCircle(x,y+bob,2*S,'#FFEC8B');
    const shine=(gameTime*40+x)%16; if(shine<4){ctx.globalAlpha=0.8;drawPixelRect(x-1+shine,y-3+bob,2,2,'#FFF');ctx.globalAlpha=1;}
}

function drawEnergy(x,y,frame) {
    x=Math.floor(x); y=Math.floor(y); const bob=Math.sin(frame*0.08)*4; const glow=Math.sin(frame*0.12)*0.3+0.7; const S=SPRITE_SCALE;
    ctx.globalAlpha=glow*0.3; drawPixelCircle(x,y+bob,10*S,'#00FFAA'); ctx.globalAlpha=1;
    drawPixelRect(x-3*S,y-7*S+bob,6*S,14*S,'#00FF88'); drawPixelRect(x-5*S,y-4*S+bob,10*S,8*S,'#00FFAA');
    drawPixelRect(x-2*S,y-5*S+bob,3*S,5*S,'#AAFFDD'); drawPixelRect(x,y-8*S+bob,2,2,'#FFF');
}

// Background sprites
function drawStar(x,y,size,twinkle){const a=0.4+Math.sin(twinkle)*0.5;ctx.globalAlpha=Math.max(0,a);drawPixelRect(x,y,size,size,'#FFF');if(size>1){drawPixelRect(x-1,y+Math.floor(size/2),1,1,'#FFF');drawPixelRect(x+size,y+Math.floor(size/2),1,1,'#FFF');}ctx.globalAlpha=1;}
function drawEarth(x,y,size){x=Math.floor(x);y=Math.floor(y);const r=size||20;drawPixelCircle(x,y,r,'#1a4a8a');drawPixelCircle(x,y,r-1,'#2a6aaa');drawPixelRect(x-r/2,y-r/3,r/2,r/3,'#2a8a3a');drawPixelRect(x+r/4,y-r/4,r/3,r/2,'#3a9a4a');ctx.globalAlpha=0.15;drawPixelCircle(x,y,r+2,'#88BBFF');ctx.globalAlpha=1;}
function drawMountain(x,y,w,h,color){x=Math.floor(x);y=Math.floor(y);for(let i=0;i<h;i++){const ratio=i/h;const lw=Math.floor(w*ratio);drawPixelRect(x-lw/2,y-h+i,lw,1,color);}}
function drawShootingStar(x,y,len){for(let i=0;i<len;i++){ctx.globalAlpha=1-i/len;drawPixelRect(Math.floor(x+i*2),Math.floor(y+i),2,1,'#FFF');}ctx.globalAlpha=1;}
function drawMeteor(x,y,size){x=Math.floor(x);y=Math.floor(y);drawPixelCircle(x,y,size,'#8B4513');drawPixelCircle(x,y,size-2,'#A0522D');for(let i=0;i<5;i++){ctx.globalAlpha=0.7-i*0.12;drawPixelRect(x+size+i*3,y-size+i*2,3,2,i<2?'#FF4500':'#FF8C00');}ctx.globalAlpha=1;}
function drawRocket(x,y){x=Math.floor(x);y=Math.floor(y);drawPixelRect(x-3,y-12,6,16,'#E0E0E0');drawPixelRect(x-2,y-14,4,4,'#D0D0D0');drawPixelRect(x-1,y-16,2,3,'#FF4444');drawPixelRect(x-1,y-8,2,2,'#4488FF');drawPixelRect(x-5,y,3,6,'#FF4444');drawPixelRect(x+2,y,3,6,'#FF4444');const fl=Math.random()>0.5?1:0;drawPixelRect(x-2,y+4,4,4+fl,'#FF8800');drawPixelRect(x-1,y+6,2,4+fl,'#FFCC00');}
function drawSpaceship(x,y){x=Math.floor(x);y=Math.floor(y);drawPixelRect(x-10,y-2,20,4,'#808090');drawPixelRect(x-14,y,28,3,'#909098');drawPixelRect(x-6,y-6,12,5,'#A0A0B0');drawPixelRect(x-4,y-9,8,4,'#88BBFF');const lo=Math.sin(gameTime*5)>0;drawPixelRect(x-12,y+1,2,2,lo?'#FF0000':'#880000');drawPixelRect(x+10,y+1,2,2,lo?'#00FF00':'#008800');}
function drawHeart(x,y,filled){const c=filled?'#FF4444':'#441111';drawPixelCircle(x-3,y-2,4,c);drawPixelCircle(x+3,y-2,4,c);drawPixelRect(x-6,y-1,12,6,c);ctx.beginPath();ctx.moveTo(x-7,y+2);ctx.lineTo(x,y+8);ctx.lineTo(x+7,y+2);ctx.fillStyle=c;ctx.fill();}

function drawCardIcon(cx,cy,icon){
    cx=Math.floor(cx);cy=Math.floor(cy);
    switch(icon){
        case 'gravity': drawPixelCircle(cx,cy-8,10,'#CCCCDD');drawPixelRect(cx-2,cy+6,4,12,'#4488FF');drawPixelRect(cx-5,cy+14,10,3,'#4488FF');break;
        case 'distance': drawPixelCircle(cx-12,cy,8,'#2a6aaa');drawPixelCircle(cx+14,cy,5,'#CCCCDD');ctx.strokeStyle='#666';ctx.setLineDash([2,2]);ctx.beginPath();ctx.moveTo(cx-4,cy);ctx.lineTo(cx+9,cy);ctx.stroke();ctx.setLineDash([]);break;
        case 'temp': drawPixelRect(cx-2,cy-15,4,22,'#DDDDEE');drawPixelCircle(cx,cy+10,5,'#DDDDEE');drawPixelRect(cx-1,cy-8,2,16,'#FF4444');drawPixelCircle(cx,cy+10,3,'#FF4444');break;
        case 'apollo': drawPixelRect(cx-3,cy-14,6,18,'#E0E0E0');drawPixelRect(cx-1,cy-18,2,4,'#FF4444');drawPixelRect(cx-5,cy+2,3,6,'#FF4444');drawPixelRect(cx+2,cy+2,3,6,'#FF4444');break;
        case 'footprint': drawPixelRect(cx-4,cy-10,8,4,'#999');drawPixelRect(cx-3,cy-6,6,10,'#888');drawPixelRect(cx-5,cy+4,10,4,'#999');break;
        default: drawPixelCircle(cx,cy,14,'#CCCCDD');drawPixelCircle(cx,cy,12,'#DDDDEE');drawPixelCircle(cx-4,cy-3,4,'#BBBBC8');break;
    }
}

// ============================================
// PARTICLE EFFECTS
// ============================================
function addDustBurst(x,y,count){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-0.5)*2,vy:-Math.random()*1.5,life:20+Math.random()*10,maxLife:30,size:2+Math.random()*2,color:'#8a8a9a',type:'dust'});}
function addLandEffect(x,y){Audio.playLand();addDustBurst(x,y,5);impactRings.push({x,y:y+3,radius:3,maxRadius:25,alpha:0.5,color:'#8a8a9a'});}
function addHitEffect(x,y){screenShake=8;hitFlash=0.3;for(let i=0;i<12;i++)particles.push({x,y,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4,life:15+Math.random()*10,maxLife:25,size:2+Math.random()*3,color:Math.random()>0.5?'#FF4444':'#FF8844',type:'hit'});impactRings.push({x,y,radius:3,maxRadius:40,alpha:0.8,color:'#FF4444'});}
function addCollectEffect(x,y){Audio.playCollect();for(let i=0;i<6;i++)particles.push({x,y,vx:(Math.random()-0.5)*2,vy:-Math.random()*2,life:15,maxLife:15,size:2,color:'#FFD700',type:'collect'});floatingTexts.push({x,y:y-10,text:'+10',color:'#FFD700',life:0.6,maxLife:0.6,size:10});}
function addPerfectEffect(x,y){Audio.playPerfect();for(let i=0;i<8;i++)particles.push({x:x+Math.random()*20-10,y:y+Math.random()*10-5,vx:(Math.random()-0.5)*3,vy:-Math.random()*2,life:20,maxLife:20,size:3,color:['#FF0','#0FF','#F0F','#FFF'][i%4],type:'perfect'});floatingTexts.push({x,y:y-20,text:'PERFECT!',color:'#FFD700',life:1.0,maxLife:1.0,size:14});}

// ============================================
// INIT FUNCTIONS
// ============================================
function initStars(){bgStars=[];for(let i=0;i<60;i++)bgStars.push({x:Math.random()*GAME_WIDTH,y:Math.random()*GROUND_Y,size:Math.random()>0.7?2:1,speed:0.5+Math.random()*2,phase:Math.random()*Math.PI*2});}
function initGroundTiles(){groundTiles=[];for(let i=0;i<25;i++)groundTiles.push({x:i*(GAME_WIDTH/25)*1.2,height:3+Math.random()*5,shade:Math.random()*0.2});}

function initGame(stageIdx) {
    currentStage = STAGES[stageIdx];
    distance = 0; score = 0; coinsCollected = 0;
    player = { x:80, y:GROUND_Y, vy:0, width:32, height:32, isJumping:false, boosterGauge:3, maxBooster:3, boosterRechargeTimer:0, lives:3, invincible:0, animFrame:0, animTimer:0, squashX:1, squashY:1, boostTrail:false };
    obstacles = []; coins = []; bgObjects = []; particles = []; floatingTexts = []; impactRings = []; laserWarnings = [];
    screenShake = 0; hitFlash = 0; comboCount = 0; comboTimer = 0; lastMilestone = 0; stageBannerTimer = 3;
    patternQueue = []; patternCooldown = 0; restTimer = 0; patternsDelivered = 0;
    scrollSpeed = currentStage.speed * DIFFICULTIES[selectedDifficulty].speedMult;
    initGroundTiles();
    // Add initial earth for stage 1-2
    if(stageIdx<2) bgObjects.push({type:'earth',x:GAME_WIDTH-60,y:60,size:18,layer:1});
    setGameState('playing');
}

// ============================================
// PATTERN SPAWNER
// ============================================
function spawnNextPattern() {
    if(!currentStage) return;
    const pool = currentStage.patternPool;
    const idx = pool[Math.floor(Math.random()*pool.length)];
    const pat = PATTERNS[idx];
    if(!pat) return;
    const gapMult = DIFFICULTIES[selectedDifficulty].gapMult;
    const baseX = GAME_WIDTH + 40;
    
    // Spawn obstacles from pattern
    for(const o of pat.obs) {
        const obs = { x:baseX+o.dx*gapMult, type:o.type, scored:false };
        if(o.type==='rock') { obs.y=GROUND_Y; obs.size=o.size; obs.width=20*o.size*SPRITE_SCALE; obs.height=16*o.size*SPRITE_SCALE; }
        else if(o.type==='crater') { obs.y=GROUND_Y+2; obs.width=(o.w||35)*SPRITE_SCALE; obs.height=8*SPRITE_SCALE; obs.craterW=o.w||35; }
        else if(o.type==='float_meteor') { obs.y=GROUND_Y+o.dy; obs.size=o.size; obs.width=16*o.size*SPRITE_SCALE; obs.height=16*o.size*SPRITE_SCALE; }
        else if(o.type==='laser') { obs.y=GROUND_Y+o.dy; obs.width=GAME_WIDTH; obs.height=o.h||4; obs.laserTimer=1.5; obs.active=false; }
        obstacles.push(obs);
    }
    // Spawn coins from pattern
    for(const c of (pat.coins||[])) {
        coins.push({ x:baseX+c.dx*gapMult, y:GROUND_Y+c.dy, frame:0 });
    }
    patternsDelivered++;
}

// ============================================
// JUMP MECHANICS
// ============================================
function startPress() {
    pressStartTime = Date.now();
    isPressed = true;
    if(gameState==='playing') {
        if(!player.isJumping) {
            // Will determine jump height on release
        } else if(player.boosterGauge > 0) {
            // Boost while airborne
            player.vy = BOOST_FORCE;
            player.boosterGauge--;
            player.boostTrail = true;
            Audio.playBoost();
            addDustBurst(player.x, player.y+10, 3);
        }
    }
}

function endPress() {
    if(!isPressed) return;
    const duration = Date.now() - pressStartTime;
    isPressed = false;
    if(gameState==='playing' && !player.isJumping) {
        // Determine jump force based on press duration
        const force = duration < PRESS_THRESHOLD ? SHORT_JUMP : LONG_JUMP;
        player.vy = force;
        player.isJumping = true;
        player.squashX = 0.7; player.squashY = 1.3;
        Audio.playJump();
        addDustBurst(player.x, GROUND_Y, 4);
    }
}

// ============================================
// HUD
// ============================================
function drawHUD() {
    if(!currentStage) return;
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,GAME_WIDTH,48);
    drawText(currentStage.nameKo,8,6,'#FFD700',9);
    const diff=DIFFICULTIES[selectedDifficulty];
    drawText(diff.label,8,18,diff.color,7);
    drawText(`${Math.floor(distance)}m`,GAME_WIDTH-8,6,'#FFF',9,'right');
    drawText(`${score}pts`,GAME_WIDTH-8,18,'#AAFFAA',8,'right');
    // Progress bar
    const progress=Math.min(distance/currentStage.targetDist,1);
    drawPixelRect(8,32,GAME_WIDTH-16,8,'#1a1a2a');
    drawPixelRect(8,32,Math.floor((GAME_WIDTH-16)*progress),8,'#00FF88');
    drawPixelRect(8,32,Math.floor((GAME_WIDTH-16)*progress),3,'#88FFBB');
    drawPixelRect(GAME_WIDTH-14,30,6,12,'#FFD700');
    // Lives
    for(let i=0;i<player.lives;i++) drawHeart(14+i*20,GAME_HEIGHT-32,true);
    // Booster
    drawText('BOOST',GAME_WIDTH-80,GAME_HEIGHT-40,'#888',7);
    for(let i=0;i<player.maxBooster;i++){const f=i<player.boosterGauge;drawPixelRect(GAME_WIDTH-80+i*22,GAME_HEIGHT-30,18,14,f?'#00AAFF':'#1a1a3a');if(f)drawPixelRect(GAME_WIDTH-80+i*22,GAME_HEIGHT-30,18,5,'#44CCFF');}
    // Coins
    drawText(`🪙${coinsCollected}`,GAME_WIDTH/2,GAME_HEIGHT-35,'#FFD700',9,'center');
    // Mute
    drawText(Audio.muted?'🔇':'🔊',GAME_WIDTH-20,52,'#888',12,'right');
    // Combo
    if(comboCount>1&&comboTimer>0){const ca=Math.min(1,comboTimer/0.5);ctx.globalAlpha=ca;drawGlowText(`x${comboCount} COMBO!`,GAME_WIDTH/2,60,'#FF8800',16,'center');ctx.globalAlpha=1;}
    // Stage banner
    if(stageBannerTimer>0){const ba=Math.min(1,stageBannerTimer);ctx.globalAlpha=ba;ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,GAME_HEIGHT/2-50,GAME_WIDTH,100);drawGlowText(`STAGE ${currentStage.id}`,GAME_WIDTH/2,GAME_HEIGHT/2-40,BADGE_COLORS[currentStage.id-1][0],20,'center');drawText(currentStage.nameKo,GAME_WIDTH/2,GAME_HEIGHT/2-10,'#FFF',14,'center');drawText(currentStage.desc,GAME_WIDTH/2,GAME_HEIGHT/2+15,'#AAA',10,'center');
    // Jump hint on stage 1
    if(currentStage.id===1&&stageBannerTimer>1.5){drawText('짧게 탭 = 낮은 점프  |  길게 누름 = 높은 점프',GAME_WIDTH/2,GAME_HEIGHT/2+35,'#88FF88',8,'center');}
    ctx.globalAlpha=1;}
}

// ============================================
// TITLE SCREEN
// ============================================
function drawTitle() {
    const grad=ctx.createLinearGradient(0,0,0,GAME_HEIGHT); grad.addColorStop(0,'#0a0a1a'); grad.addColorStop(1,'#1a1a3a');
    ctx.fillStyle=grad; ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    // Stars
    for(const s of bgStars) drawStar(s.x,s.y,s.size,titleAnimTimer*s.speed+s.phase);
    // Shooting stars
    for(const ss of titleShootingStars){ctx.globalAlpha=ss.life/ss.maxLife;drawShootingStar(ss.x,ss.y,ss.len);ctx.globalAlpha=1;}
    // Moon
    drawPixelCircle(GAME_WIDTH-60,100,40,'#CCCCDD'); drawPixelCircle(GAME_WIDTH-60,100,38,'#DDDDEE');
    drawPixelCircle(GAME_WIDTH-68,92,8,'#BBBBC8'); drawPixelCircle(GAME_WIDTH-48,105,5,'#C4C4D0'); drawPixelCircle(GAME_WIDTH-72,110,4,'#BBBBC8');
    // Ground
    ctx.fillStyle='#3a3a4a'; ctx.fillRect(0,GAME_HEIGHT-120,GAME_WIDTH,120);
    drawPixelRect(0,GAME_HEIGHT-120,GAME_WIDTH,3,'#5a5a6a');
    for(let i=0;i<12;i++){drawMountain(30+i*35,GAME_HEIGHT-110,15+Math.random()*10,10+Math.random()*15,'#2a2a3a');}
    // Rover animation
    drawRover(titleRoverX,GAME_HEIGHT-115,titleAnimTimer*3,'rover');
    // Title
    const glowPulse=Math.sin(titleAnimTimer*2)*0.3+0.7;
    drawGlowText('MOON',GAME_WIDTH/2,200,`rgba(255,215,0,${glowPulse})`,36,'center');
    drawGlowText('RUNNER',GAME_WIDTH/2,245,'#88BBFF',36,'center');
    // Version
    drawText('v3.0',GAME_WIDTH/2+80,260,'#555',8,'center');
    // Subtitle typewriter
    const sub='달 위를 달려라! 타이밍이 생명!';
    const shown=sub.substring(0,Math.min(Math.floor(titleTypewriter),sub.length));
    drawText(shown,GAME_WIDTH/2,310,'#8899AA',10,'center');
    // Tap to start
    const blink=Math.sin(titleAnimTimer*3)>0;
    if(blink) drawText('TAP TO START',GAME_WIDTH/2,400,'#FFFFFF',14,'center');
    drawText('🎮 Space / Tap',GAME_WIDTH/2,430,'#666',9,'center');
}

// ============================================
// DIFFICULTY SELECT
// ============================================
function drawDifficultySelect() {
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    for(const s of bgStars) drawStar(s.x,s.y,s.size,gameTime*s.speed+s.phase);
    drawGlowText('난이도 선택',GAME_WIDTH/2,60,'#FFD700',20,'center');
    drawText('DIFFICULTY',GAME_WIDTH/2,90,'#888',10,'center');
    uiButtons=[];
    DIFFICULTIES.forEach((d,i)=>{
        const y=150+i*100;
        const selected=i===selectedDifficulty;
        const bw=250, bh=70, bx=(GAME_WIDTH-bw)/2;
        if(selected){ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(bx-5,y-5,bw+10,bh+10);}
        ctx.fillStyle=selected?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.04)';
        ctx.fillRect(bx,y,bw,bh);
        ctx.strokeStyle=d.color; ctx.lineWidth=selected?2:1; ctx.strokeRect(bx,y,bw,bh);
        drawText(d.label,GAME_WIDTH/2,y+10,d.color,18,'center');
        drawText(d.labelKo,GAME_WIDTH/2,y+35,'#AAA',11,'center');
        const info=d.id==='easy'?'느린 속도, 넓은 간격':d.id==='normal'?'기본 설정':d.id==='hard'?'빠른 속도, 좁은 간격':'극한 속도, 최소 간격';
        drawText(info,GAME_WIDTH/2,y+50,'#666',8,'center');
        uiButtons.push({x:bx,y,w:bw,h:bh,action:'selectDifficulty',data:i});
    });
    drawText('← → 선택  |  Enter 확인',GAME_WIDTH/2,GAME_HEIGHT-40,'#555',9,'center');
}

// ============================================
// CHARACTER SELECT
// ============================================
function drawCharSelect() {
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    for(const s of bgStars) drawStar(s.x,s.y,s.size,gameTime*s.speed+s.phase);
    drawGlowText('캐릭터 선택',GAME_WIDTH/2,40,'#FFD700',18,'center');
    const unlocked=CHARACTERS.filter(c=>saveData.totalDistance>=c.unlockDist);
    uiButtons=[];
    const cols=2, cardW=150, cardH=180, gap=20, startX=(GAME_WIDTH-cols*cardW-(cols-1)*gap)/2;
    unlocked.forEach((ch,i)=>{
        const col=i%cols, row=Math.floor(i/cols);
        const cx=startX+col*(cardW+gap), cy=90+row*(cardH+gap);
        const sel=ch.id===saveData.selectedChar;
        ctx.fillStyle=sel?'rgba(100,200,255,0.15)':'rgba(255,255,255,0.05)';
        ctx.fillRect(cx,cy,cardW,cardH);
        ctx.strokeStyle=sel?'#44AAFF':'#333'; ctx.lineWidth=sel?2:1; ctx.strokeRect(cx,cy,cardW,cardH);
        drawRover(cx+cardW/2,cy+90,gameTime*2,ch.type);
        drawText(ch.nameKo,cx+cardW/2,cy+130,'#FFF',10,'center');
        drawText(ch.name,cx+cardW/2,cy+145,'#888',8,'center');
        if(sel){drawText('✓ 선택됨',cx+cardW/2,cy+160,'#44AAFF',8,'center');}
        uiButtons.push({x:cx,y:cy,w:cardW,h:cardH,action:'selectChar',data:ch.id});
    });
    const locked=CHARACTERS.filter(c=>saveData.totalDistance<c.unlockDist);
    if(locked.length>0){drawText(`🔒 ${locked[0].unlockDist}m 달성시 해금`,GAME_WIDTH/2,GAME_HEIGHT-60,'#555',9,'center');}
    drawText('탭하여 선택 → 스테이지 선택',GAME_WIDTH/2,GAME_HEIGHT-35,'#555',9,'center');
}

// ============================================
// STAGE SELECT
// ============================================
function drawStageSelect() {
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    for(const s of bgStars) drawStar(s.x,s.y,s.size,gameTime*s.speed+s.phase);
    drawGlowText('스테이지 선택',GAME_WIDTH/2,30,'#FFD700',18,'center');
    uiButtons=[];
    STAGES.forEach((st,i)=>{
        const y=70+i*115, bw=350, bx=(GAME_WIDTH-bw)/2, bh=100;
        const cleared=saveData.clearedStages.includes(st.id);
        const locked=!st.unlocked;
        ctx.fillStyle=locked?'rgba(50,50,50,0.3)':cleared?'rgba(0,255,100,0.08)':'rgba(255,255,255,0.06)';
        ctx.fillRect(bx,y,bw,bh);
        ctx.strokeStyle=locked?'#333':cleared?'#44AA44':BADGE_COLORS[i][0]; ctx.lineWidth=1; ctx.strokeRect(bx,y,bw,bh);
        drawText(`STAGE ${st.id}`,bx+10,y+8,locked?'#444':BADGE_COLORS[i][0],12);
        drawText(st.nameKo,bx+10,y+25,locked?'#444':'#FFF',11);
        drawText(st.name,bx+10,y+40,locked?'#333':'#888',8);
        drawText(st.desc,bx+10,y+55,locked?'#333':'#AAA',8);
        if(!locked){
            drawText(`목표: ${st.targetDist}m`,bx+10,y+72,'#888',8);
            drawText(`최고: ${saveData.highScores[i]}m`,bx+bw-10,y+72,'#AAFFAA',8,'right');
            if(cleared) drawText('✅ 클리어',bx+bw-10,y+8,'#44AA44',10,'right');
        } else { drawText('🔒 이전 스테이지 클리어 필요',bx+10,y+72,'#555',8); }
        if(!locked) uiButtons.push({x:bx,y,w:bw,h:bh,action:'startStage',data:i});
    });
    uiButtons.push({x:10,y:GAME_HEIGHT-45,w:80,h:30,action:'toCharSelect'});
    drawText('← 캐릭터',50,GAME_HEIGHT-38,'#888',9,'center');
}

// ============================================
// GAME UPDATE
// ============================================
function updateGame(dt) {
    if(!currentStage) return;
    gameTime += dt;
    const spd = scrollSpeed;
    
    // Distance & score
    distance += spd * dt * 10;
    score += Math.floor(spd * dt * 5);
    
    // Check milestones
    for(const m of MILESTONES){if(distance>=m&&lastMilestone<m){lastMilestone=m;Audio.playMilestone();floatingTexts.push({x:GAME_WIDTH/2,y:GAME_HEIGHT/2-50,text:`${m}m!`,color:'#FFD700',life:1.5,maxLife:1.5,size:18});}}
    
    // Stage clear
    if(distance>=currentStage.targetDist){stageClear();return;}
    
    // Banner timer
    if(stageBannerTimer>0) stageBannerTimer-=dt;
    
    // Squash recovery
    player.squashX += (1-player.squashX)*0.15;
    player.squashY += (1-player.squashY)*0.15;
    
    // Player physics
    if(player.isJumping) {
        player.vy += GRAVITY;
        player.y += player.vy;
        if(player.boostTrail) particles.push({x:player.x+(Math.random()-0.5)*6,y:player.y+15,vx:(Math.random()-0.5)*0.5,vy:1,life:12,maxLife:12,size:2+Math.random()*2,color:Math.random()>0.5?'#00AAFF':'#44CCFF',type:'boost'});
        if(player.y>=GROUND_Y){player.y=GROUND_Y;player.vy=0;player.isJumping=false;player.boostTrail=false;player.squashX=1.3;player.squashY=0.7;addLandEffect(player.x,GROUND_Y);}
    }
    
    // Booster recharge
    if(!player.isJumping&&player.boosterGauge<player.maxBooster){player.boosterRechargeTimer+=dt;if(player.boosterRechargeTimer>4){player.boosterGauge++;player.boosterRechargeTimer=0;}}
    if(player.invincible>0) player.invincible-=dt;
    if(hitFlash>0) hitFlash-=dt;
    if(!player.isJumping){player.animTimer+=dt*spd*2;player.animFrame=player.animTimer;}
    
    // Combo timer
    if(comboTimer>0){comboTimer-=dt;if(comboTimer<=0)comboCount=0;}
    
    // Pattern spawning system
    patternCooldown -= dt * spd;
    if(restTimer > 0) {
        restTimer -= dt;
    } else if(patternCooldown <= 0) {
        spawnNextPattern();
        // Rest period after every 3-4 patterns, gets shorter as stage progresses
        const patternsBeforeRest = 3 + Math.floor(Math.random()*2);
        if(patternsDelivered % patternsBeforeRest === 0) {
            restTimer = Math.max(0.5, 2.0 - currentStage.id * 0.2);
        }
        // Gap between patterns
        const baseGap = 1.2 * DIFFICULTIES[selectedDifficulty].gapMult;
        patternCooldown = baseGap - currentStage.id * 0.1;
    }
    
    // Update obstacles
    for(let i=obstacles.length-1;i>=0;i--){
        const obs=obstacles[i];
        if(obs.type==='laser'){
            // Laser: counts down then activates
            if(obs.laserTimer>0){obs.laserTimer-=dt;if(obs.laserTimer<=0)obs.active=true;}
            if(obs.active){obs.x-=spd*2;} // move laser emitter
        } else {
            obs.x-=spd*2;
        }
        
        // Remove off-screen
        if(obs.x<-80){
            // Perfect dodge check - if player was jumping and close
            if(!obs.scored&&obs.type!=='laser'){
                const S=SPRITE_SCALE;
                const py=player.y;
                const vertDist=GROUND_Y-py;
                if(player.isJumping&&vertDist>10*S){
                    // Was airborne when passing = dodged!
                    const closeness=Math.max(0,30-Math.abs(py-(obs.y-obs.height)));
                    if(closeness>15){
                        comboCount++;comboTimer=3;
                        addPerfectEffect(player.x,player.y);
                        const bonus=50*Math.min(comboCount,10);
                        score+=bonus;
                        if(comboCount>1)Audio.playCombo(comboCount);
                    } else if(closeness>0){
                        comboCount++;comboTimer=2;
                        floatingTexts.push({x:player.x+30,y:player.y-20,text:'CLOSE!',color:'#FF8800',life:0.8,maxLife:0.8,size:11});
                        score+=20;
                    }
                }
                obs.scored=true;
            }
            obstacles.splice(i,1); continue;
        }
        
        // Collision
        if(player.invincible<=0&&checkCollision(player,obs)){hitPlayer();obstacles.splice(i,1);}
    }
    
    // Update coins
    for(let i=coins.length-1;i>=0;i--){
        coins[i].x-=spd*2;
        coins[i].frame++;
        if(coins[i].x<-20){coins.splice(i,1);continue;}
        if(checkCoinCollision(player,coins[i])){
            coinsCollected++;score+=10;
            addCollectEffect(coins[i].x,coins[i].y);
            coins.splice(i,1);
        }
    }
    
    // Update bg objects
    for(let i=bgObjects.length-1;i>=0;i--){
        const obj=bgObjects[i];
        if(obj.layer!==undefined) obj.x-=spd*bgLayers[obj.layer].speed;
        if(obj.x<-100){bgObjects.splice(i,1);continue;}
        if(obj.type==='meteor'){obj.x-=1;obj.y+=0.7;if(obj.y>GROUND_Y){addDustBurst(obj.x,GROUND_Y,6);bgObjects.splice(i,1);}}
        if(obj.type==='shooting_star'){obj.x-=3;obj.y+=1;obj.life--;if(obj.life<=0)bgObjects.splice(i,1);}
    }
    spawnBgEvents(spd);
    
    // Ground tiles
    for(const tile of groundTiles){tile.x-=spd*2;if(tile.x<-25){tile.x=GAME_WIDTH+5;tile.height=3+Math.random()*5;tile.shade=Math.random()*0.2;}}
    
    // BG layers offset
    for(const l of bgLayers) l.offset+=spd*l.speed;
    
    // Particles
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.life--;if(p.type==='dust')p.vy+=0.015;if(p.life<=0)particles.splice(i,1);}
    
    // Impact rings
    for(let i=impactRings.length-1;i>=0;i--){const r=impactRings[i];r.radius+=2;r.alpha-=0.03;if(r.alpha<=0||r.radius>=r.maxRadius)impactRings.splice(i,1);}
    
    // Floating texts
    for(let i=floatingTexts.length-1;i>=0;i--){floatingTexts[i].y-=0.8;floatingTexts[i].life-=dt;if(floatingTexts[i].life<=0)floatingTexts.splice(i,1);}
    
    if(screenShake>0)screenShake*=0.85; if(screenShake<0.5)screenShake=0;
}

function spawnBgEvents(spd) {
    if(!currentStage) return;
    if(Math.random()<0.002){
        const evts=currentStage.events;const evt=evts[Math.floor(Math.random()*evts.length)];
        switch(evt){
            case 'shooting_star': bgObjects.push({type:'shooting_star',x:GAME_WIDTH+20,y:20+Math.random()*100,len:8+Math.random()*12,life:60,layer:undefined});break;
            case 'meteor': bgObjects.push({type:'meteor',x:GAME_WIDTH+50,y:-20,size:4+Math.random()*4,layer:undefined});break;
            case 'rocket': bgObjects.push({type:'rocket',x:GAME_WIDTH+20,y:50+Math.random()*100,layer:1});break;
            case 'spaceship': bgObjects.push({type:'spaceship',x:GAME_WIDTH+30,y:30+Math.random()*80,layer:1});break;
        }
    }
    const maxMX=bgObjects.filter(o=>o.type==='mountain').reduce((m,o)=>Math.max(m,o.x),0);
    if(maxMX<GAME_WIDTH+50) bgObjects.push({type:'mountain',x:GAME_WIDTH+20+Math.random()*40,y:GROUND_Y+10,w:30+Math.random()*40,h:20+Math.random()*30,layer:2,color:'#2a2a3a'});
}

function checkCollision(player,obs) {
    const S=SPRITE_SCALE;
    const px=player.x-10*S, py=player.y-26*S, pw=20*S, ph=30*S;
    if(obs.type==='laser') {
        if(!obs.active) return false;
        return py<obs.y+obs.height&&py+ph>obs.y;
    }
    const ox=obs.x-obs.width/2, oy=obs.y-obs.height, ow=obs.width, oh=obs.height;
    return px<ox+ow&&px+pw>ox&&py<oy+oh&&py+ph>oy;
}

function checkCoinCollision(player,coin) {
    const dx=player.x-coin.x, dy=(player.y-12)-coin.y;
    return Math.sqrt(dx*dx+dy*dy)<25;
}

function hitPlayer() {
    player.lives--; player.invincible=2; addHitEffect(player.x,player.y); Audio.playHit(); comboCount=0; comboTimer=0;
    if(player.lives<=0) doGameOver();
}

function stageClear() {
    const si=currentStage.id-1;
    if(!saveData.clearedStages.includes(currentStage.id))saveData.clearedStages.push(currentStage.id);
    if(score>saveData.highScores[si])saveData.highScores[si]=score;
    saveData.totalDistance+=Math.floor(distance);
    saveData.totalCoins=(saveData.totalCoins||0)+coinsCollected;
    if(si+1<STAGES.length)STAGES[si+1].unlocked=true;
    if(!saveData.badges.includes(currentStage.id))saveData.badges.push(currentStage.id);
    saveSave();
    setGameState('stageCleared');
}

function doGameOver() {
    gameOverFactIdx=Math.floor(Math.random()*MOON_FACTS.length);
    const si=currentStage.id-1;
    if(score>saveData.highScores[si])saveData.highScores[si]=score;
    saveData.totalDistance+=Math.floor(distance);
    saveData.totalCoins=(saveData.totalCoins||0)+coinsCollected;
    saveSave(); Audio.playDeath();
    setGameState('gameOver');
}

// ============================================
// DRAW GAME
// ============================================
function drawGame() {
    if(!currentStage) return;
    ctx.save();
    if(screenShake>0) ctx.translate((Math.random()-0.5)*screenShake,(Math.random()-0.5)*screenShake);
    
    // Sky
    const grad=ctx.createLinearGradient(0,0,0,GROUND_Y); grad.addColorStop(0,currentStage.bgColor); grad.addColorStop(1,'#1a1a3a');
    ctx.fillStyle=grad; ctx.fillRect(0,0,GAME_WIDTH,GROUND_Y+10);
    
    // Stars
    for(const s of bgStars){const sx=((s.x-bgLayers[0].offset*s.speed*0.2)%GAME_WIDTH+GAME_WIDTH)%GAME_WIDTH;drawStar(sx,s.y,s.size,gameTime*s.speed+s.phase);}
    
    // BG layers
    bgObjects.filter(o=>o.layer===1).forEach(obj=>{switch(obj.type){case'earth':drawEarth(obj.x,obj.y,obj.size);break;case'rocket':drawRocket(obj.x,obj.y);break;case'spaceship':drawSpaceship(obj.x,obj.y);break;}});
    bgObjects.filter(o=>o.layer===2).forEach(obj=>{if(obj.type==='mountain')drawMountain(obj.x,obj.y,obj.w,obj.h,obj.color);});
    bgObjects.filter(o=>o.layer===undefined).forEach(obj=>{switch(obj.type){case'shooting_star':drawShootingStar(obj.x,obj.y,obj.len);break;case'meteor':drawMeteor(obj.x,obj.y,obj.size);break;}});
    
    // Ground
    ctx.fillStyle=currentStage.groundColor; ctx.fillRect(0,GROUND_Y+5,GAME_WIDTH,GAME_HEIGHT-GROUND_Y);
    drawPixelRect(0,GROUND_Y+5,GAME_WIDTH,3,currentStage.groundAccent);
    for(const tile of groundTiles){ctx.fillStyle=`rgba(0,0,0,${0.1+tile.shade})`;ctx.fillRect(Math.floor(tile.x),GROUND_Y+10,12,tile.height);}
    for(let i=0;i<15;i++){const rx=((i*37+10-bgLayers[3].offset*0.5)%(GAME_WIDTH+40))-20;drawPixelRect(Math.floor(rx),GROUND_Y+8+(i%3)*4,3,2,'#3a3a4a');}
    
    // Obstacles
    for(const obs of obstacles){
        switch(obs.type){
            case 'rock': drawRock(obs.x,obs.y,obs.size); break;
            case 'crater': drawCrater(obs.x,obs.y,obs.craterW||35); break;
            case 'float_meteor': drawFloatMeteor(obs.x,obs.y,obs.size); break;
            case 'laser':
                if(obs.active) drawLaser(obs.x,obs.y,obs.height);
                else {
                    // Warning flash
                    const warn=Math.sin(gameTime*15)>0;
                    if(warn){ctx.globalAlpha=0.4;drawPixelRect(0,obs.y-2,GAME_WIDTH,obs.height+4,'#FF0000');ctx.globalAlpha=1;}
                    drawText('⚠ LASER ⚠',GAME_WIDTH/2,obs.y-20,'#FF4444',10,'center');
                }
                break;
        }
    }
    
    // Coins
    for(const c of coins) drawCoin(c.x,c.y,c.frame);
    
    // Impact rings
    for(const r of impactRings){ctx.strokeStyle=r.color||'#8a8a9a';ctx.globalAlpha=r.alpha;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.radius,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
    
    // Player
    if(player.invincible>0){if(Math.sin(player.invincible*15)>0){const ct=CHARACTERS.find(c=>c.id===saveData.selectedChar)?.type||'rover';drawRover(player.x,player.y,player.animFrame,ct);}}
    else{const ct=CHARACTERS.find(c=>c.id===saveData.selectedChar)?.type||'rover';drawRover(player.x,player.y,player.animFrame,ct);}
    
    // Jump shadow
    if(player.isJumping){const ss=Math.max(0.2,1-(GROUND_Y-player.y)/250);ctx.globalAlpha=0.25*ss;drawPixelRect(player.x-10*ss,GROUND_Y+6,20*ss,3,'#000');ctx.globalAlpha=1;}
    
    // Particles
    for(const p of particles){ctx.globalAlpha=p.life/p.maxLife;drawPixelRect(Math.floor(p.x),Math.floor(p.y),p.size,p.size,p.color);}
    ctx.globalAlpha=1;
    
    // Floating texts
    for(const ft of floatingTexts){ctx.globalAlpha=ft.life/ft.maxLife;drawGlowText(ft.text,ft.x,ft.y,ft.color,ft.size||12,'center');ctx.globalAlpha=1;}
    
    ctx.restore();
    
    // Hit flash
    if(hitFlash>0){ctx.globalAlpha=hitFlash*3;ctx.fillStyle='rgba(255,0,0,0.3)';ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);ctx.globalAlpha=1;}
    
    drawHUD();
}

// ============================================
// STAGE CLEAR SCREEN
// ============================================
function drawStageClear() {
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    for(const s of bgStars) drawStar(s.x,s.y,s.size,gameTime*s.speed+s.phase);
    
    // Rank calculation
    const parScore = currentStage.targetDist * 8;
    const ratio = score / parScore;
    const rank = ratio>=0.9?'S':ratio>=0.7?'A':ratio>=0.5?'B':'C';
    const rankColor = rank==='S'?'#FFD700':rank==='A'?'#44AAFF':rank==='B'?'#44FF44':'#AAAAAA';
    
    drawGlowText('STAGE CLEAR!',GAME_WIDTH/2,60,'#FFD700',24,'center');
    drawText(currentStage.nameKo,GAME_WIDTH/2,100,'#AAA',12,'center');
    
    // Rank card
    ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(60,140,GAME_WIDTH-120,280);
    ctx.strokeStyle=rankColor; ctx.lineWidth=2; ctx.strokeRect(60,140,GAME_WIDTH-120,280);
    
    // Holographic shimmer
    const shimmer=(gameTime*50)%360; ctx.save();
    const sg=ctx.createLinearGradient(60,140,GAME_WIDTH-60,420);
    sg.addColorStop(0,'rgba(255,255,255,0)'); sg.addColorStop(((shimmer%360)/360),'rgba(255,255,255,0.06)'); sg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sg; ctx.fillRect(60,140,GAME_WIDTH-120,280); ctx.restore();
    
    drawGlowText(rank,GAME_WIDTH/2,165,rankColor,48,'center');
    drawText(`거리: ${Math.floor(distance)}m`,GAME_WIDTH/2,240,'#FFF',12,'center');
    drawText(`점수: ${score}pts`,GAME_WIDTH/2,265,'#AAFFAA',12,'center');
    drawText(`코인: ${coinsCollected}`,GAME_WIDTH/2,290,'#FFD700',12,'center');
    drawText(`콤보 최대: x${comboCount}`,GAME_WIDTH/2,315,'#FF8800',10,'center');
    drawText(`난이도: ${DIFFICULTIES[selectedDifficulty].labelKo}`,GAME_WIDTH/2,340,'#AAA',10,'center');
    
    // Buttons
    uiButtons = [];
    const btnY = 460;
    ctx.fillStyle='rgba(0,255,100,0.15)'; ctx.fillRect(50,btnY,140,45);
    ctx.strokeStyle='#44AA44'; ctx.strokeRect(50,btnY,140,45);
    drawText('다음 스테이지',120,btnY+15,'#44FF44',10,'center');
    uiButtons.push({x:50,y:btnY,w:140,h:45,action:'nextStage'});
    
    ctx.fillStyle='rgba(100,100,255,0.15)'; ctx.fillRect(210,btnY,140,45);
    ctx.strokeStyle='#4444AA'; ctx.strokeRect(210,btnY,140,45);
    drawText('스테이지 선택',280,btnY+15,'#8888FF',10,'center');
    uiButtons.push({x:210,y:btnY,w:140,h:45,action:'toStageSelect'});
}

// ============================================
// GAME OVER SCREEN (Pokemon Card Style)
// ============================================
function drawGameOver() {
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    for(const s of bgStars) drawStar(s.x,s.y,s.size,gameTime*s.speed+s.phase);
    
    const fact = MOON_FACTS[gameOverFactIdx] || MOON_FACTS[0];
    
    // Card frame
    const cx=30, cy=50, cw=GAME_WIDTH-60, ch=420;
    // Card bg with gradient
    const cg=ctx.createLinearGradient(cx,cy,cx+cw,cy+ch);
    cg.addColorStop(0,'#1a1a2e'); cg.addColorStop(0.5,fact.color+'33'); cg.addColorStop(1,'#1a1a2e');
    ctx.fillStyle=cg; ctx.fillRect(cx,cy,cw,ch);
    // Border
    ctx.strokeStyle=fact.color; ctx.lineWidth=2; ctx.strokeRect(cx,cy,cw,ch);
    // Inner border
    ctx.strokeStyle=fact.color+'66'; ctx.lineWidth=1; ctx.strokeRect(cx+5,cy+5,cw-10,ch-10);
    
    // Holographic shimmer
    const sh=(gameTime*30)%(cw+100)-50;
    ctx.save(); ctx.globalAlpha=0.1;
    ctx.fillStyle='#FFF'; ctx.fillRect(cx+sh,cy,30,ch);
    ctx.globalAlpha=1; ctx.restore();
    
    // Card title
    drawText('GAME OVER',GAME_WIDTH/2,cy+15,'#FF4444',16,'center');
    
    // Score section
    drawText(`${Math.floor(distance)}m | ${score}pts | 🪙${coinsCollected}`,GAME_WIDTH/2,cy+40,'#FFF',9,'center');
    
    // Divider
    ctx.strokeStyle=fact.color+'88'; ctx.beginPath(); ctx.moveTo(cx+20,cy+60); ctx.lineTo(cx+cw-20,cy+60); ctx.stroke();
    
    // Moon fact icon
    drawCardIcon(GAME_WIDTH/2,cy+120,fact.icon);
    
    // Fact title
    drawGlowText(fact.title,GAME_WIDTH/2,cy+170,fact.color,16,'center');
    
    // Fact text
    wrapText(fact.text,GAME_WIDTH/2,cy+200,cw-40,18,'#CCCCDD',10,'center');
    
    // Stats
    drawText(`난이도: ${DIFFICULTIES[selectedDifficulty].labelKo}`,GAME_WIDTH/2,cy+300,'#888',9,'center');
    drawText(`최고기록: ${saveData.highScores[currentStage.id-1]}pts`,GAME_WIDTH/2,cy+320,'#AAFFAA',9,'center');
    
    // Bottom card decoration
    ctx.strokeStyle=fact.color+'44'; ctx.beginPath(); ctx.moveTo(cx+20,cy+ch-60); ctx.lineTo(cx+cw-20,cy+ch-60); ctx.stroke();
    drawText('🌙 Moon Runner',GAME_WIDTH/2,cy+ch-50,'#555',8,'center');
    drawText(`#${String(gameOverFactIdx+1).padStart(3,'0')}`,GAME_WIDTH/2,cy+ch-35,fact.color+'88',8,'center');
    
    // Buttons
    uiButtons = [];
    const btnY = cy + ch + 20;
    ctx.fillStyle='rgba(255,100,100,0.15)'; ctx.fillRect(50,btnY,140,45);
    ctx.strokeStyle='#AA4444'; ctx.strokeRect(50,btnY,140,45);
    drawText('다시하기',120,btnY+15,'#FF6666',11,'center');
    uiButtons.push({x:50,y:btnY,w:140,h:45,action:'retry'});
    
    ctx.fillStyle='rgba(100,100,255,0.15)'; ctx.fillRect(210,btnY,140,45);
    ctx.strokeStyle='#4444AA'; ctx.strokeRect(210,btnY,140,45);
    drawText('메뉴',280,btnY+15,'#8888FF',11,'center');
    uiButtons.push({x:210,y:btnY,w:140,h:45,action:'toStageSelect'});
}

// ============================================
// INPUT HANDLING
// ============================================
function handleInputDown(x,y) {
    Audio.init();
    const gx=(x-offsetX)/scale;
    const gy=(y-offsetY)/scale;
    
    // Mute button
    if(gameState==='playing'&&gx>GAME_WIDTH-40&&gy>48&&gy<70){Audio.toggleMute();return;}
    
    switch(gameState) {
        case 'title': Audio.playClick(); setGameState('difficultySelect'); break;
        case 'difficultySelect': case 'charSelect': case 'stageSelect': case 'stageCleared': case 'gameOver':
            let hit=false;
            for(const btn of uiButtons){
                if(gx>=btn.x&&gx<=btn.x+btn.w&&gy>=btn.y&&gy<=btn.y+btn.h){Audio.playClick();handleButton(btn);hit=true;break;}
            }
            if(!hit){
                if(gameState==='charSelect') setGameState('stageSelect');
                else if(gameState==='stageCleared') setGameState('stageSelect');
            }
            break;
        case 'playing': startPress(); break;
    }
}

function handleInputUp() {
    if(gameState==='playing') endPress();
}

function handleButton(btn) {
    switch(btn.action) {
        case 'selectDifficulty': selectedDifficulty=btn.data; saveSave(); setGameState('charSelect'); break;
        case 'selectChar': saveData.selectedChar=btn.data; saveSave(); setGameState('stageSelect'); break;
        case 'toStageSelect': setGameState('stageSelect'); break;
        case 'toCharSelect': setGameState('charSelect'); break;
        case 'startStage': initGame(btn.data); break;
        case 'retry': if(currentStage) initGame(currentStage.id-1); break;
        case 'nextStage':
            const next=currentStage.id;
            if(next<STAGES.length&&STAGES[next].unlocked) initGame(next);
            else setGameState('stageSelect');
            break;
        case 'back': setGameState('title'); break;
    }
}

// Touch
touchArea.addEventListener('touchstart',(e)=>{e.preventDefault();handleInputDown(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
touchArea.addEventListener('touchend',(e)=>{e.preventDefault();handleInputUp();},{passive:false});

// Mouse
touchArea.addEventListener('mousedown',(e)=>handleInputDown(e.clientX,e.clientY));
touchArea.addEventListener('mouseup',()=>handleInputUp());

// Keyboard
window.addEventListener('keydown',function(e) {
    Audio.init();
    const code=e.code;
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(code)) e.preventDefault();
    if(code==='KeyM'){Audio.toggleMute();return;}
    
    switch(gameState) {
        case 'title': Audio.playClick(); setGameState('difficultySelect'); break;
        case 'difficultySelect':
            if(code==='ArrowUp'||code==='ArrowLeft'){selectedDifficulty=Math.max(0,selectedDifficulty-1);Audio.playClick();}
            else if(code==='ArrowDown'||code==='ArrowRight'){selectedDifficulty=Math.min(3,selectedDifficulty+1);Audio.playClick();}
            else if(code==='Enter'||code==='Space'){Audio.playClick();saveSave();setGameState('charSelect');}
            else if(code==='Escape')setGameState('title');
            break;
        case 'charSelect':
            if(code==='Enter'||code==='Space'){Audio.playClick();setGameState('stageSelect');}
            else if(code==='ArrowLeft'||code==='ArrowRight'){
                const uc=CHARACTERS.filter(c=>saveData.totalDistance>=c.unlockDist);
                const ci=uc.findIndex(c=>c.id===saveData.selectedChar);
                const ni=code==='ArrowRight'?(ci+1)%uc.length:(ci-1+uc.length)%uc.length;
                saveData.selectedChar=uc[ni].id;saveSave();Audio.playClick();
            } else if(code==='Escape') setGameState('difficultySelect');
            break;
        case 'stageSelect':
            if(code==='Escape') setGameState('charSelect');
            else {
                const num=parseInt(e.key);
                if(num>=1&&num<=5&&STAGES[num-1].unlocked){Audio.playClick();initGame(num-1);}
                else if(code==='Enter'||code==='Space'){
                    const fi=STAGES.findIndex(s=>s.unlocked&&!saveData.clearedStages.includes(s.id));
                    const idx=fi>=0?fi:0;
                    if(STAGES[idx].unlocked){Audio.playClick();initGame(idx);}
                }
            }
            break;
        case 'playing':
            if((code==='Space'||code==='ArrowUp')&&!keyIsDown){keyIsDown=true;startPress();}
            break;
        case 'stageCleared':
            if(code==='Enter'||code==='Space'){Audio.playClick();setGameState('stageSelect');}
            break;
        case 'gameOver':
            if(code==='Enter'||code==='Space'){Audio.playClick();if(currentStage)initGame(currentStage.id-1);}
            else if(code==='Escape') setGameState('stageSelect');
            break;
    }
},true);

window.addEventListener('keyup',function(e){
    if(e.code==='Space'||e.code==='ArrowUp'){keyIsDown=false;endPress();}
},true);

// ============================================
// RESIZE
// ============================================
function resize() {
    const w=window.innerWidth, h=window.innerHeight;
    const sx=w/GAME_WIDTH, sy=h/GAME_HEIGHT;
    scale=Math.min(sx,sy);
    canvas.width=GAME_WIDTH; canvas.height=GAME_HEIGHT;
    canvas.style.width=`${GAME_WIDTH*scale}px`;
    canvas.style.height=`${GAME_HEIGHT*scale}px`;
    offsetX=(w-GAME_WIDTH*scale)/2;
    offsetY=(h-GAME_HEIGHT*scale)/2;
    canvas.style.marginLeft=`${offsetX}px`;
    canvas.style.marginTop=`${offsetY}px`;
    ctx.imageSmoothingEnabled=false;
}
window.addEventListener('resize',resize);
resize();

// ============================================
// MAIN LOOP
// ============================================
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp-lastTime)/1000, 0.05);
    lastTime = timestamp;
    ctx.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    
    // Title animation
    if(gameState==='title'){
        titleAnimTimer+=dt;titleRoverX+=0.3;if(titleRoverX>GAME_WIDTH+50)titleRoverX=-50;
        titleTypewriter+=dt*4;
        if(Math.random()<0.008)titleShootingStars.push({x:Math.random()*GAME_WIDTH*0.5+GAME_WIDTH*0.5,y:Math.random()*100,len:8+Math.random()*10,life:50,maxLife:50});
        for(let i=titleShootingStars.length-1;i>=0;i--){titleShootingStars[i].x-=3;titleShootingStars[i].y+=1.2;titleShootingStars[i].life--;if(titleShootingStars[i].life<=0)titleShootingStars.splice(i,1);}
    }
    
    updateTransition(dt);
    
    switch(gameState) {
        case 'title': drawTitle(); break;
        case 'difficultySelect': gameTime+=dt; drawDifficultySelect(); break;
        case 'charSelect': gameTime+=dt; drawCharSelect(); break;
        case 'stageSelect': gameTime+=dt; drawStageSelect(); break;
        case 'playing': updateGame(dt); drawGame(); break;
        case 'stageCleared': gameTime+=dt; drawStageClear(); break;
        case 'gameOver': gameTime+=dt; drawGameOver(); break;
    }
    
    drawTransition();
    requestAnimationFrame(gameLoop);
}

// Initialize
initStars();
touchArea.focus();
touchArea.addEventListener('click',()=>touchArea.focus());
requestAnimationFrame(gameLoop);
