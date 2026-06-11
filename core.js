const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');
const MB = document.getElementById("bird-type");
const colorPicker = document.getElementById('colorPicker');
const msg = document.getElementById('msg');
const blobLayer = document.querySelector('.blob-layer');
const pages = document.querySelectorAll('.page');
const birdCounter = document.getElementById("bird-count");
const birdColorCountInput = document.getElementById('bird-color-count');
const birdColorsContainer = document.getElementById('bird-colors-container');
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

blobLayer.style.display = "none"; // ========================= temp fix

const osTarget = '../../Web-OS/index.html?login=true';
const defaultBirdColors = ['#b4befe', '#cba6f7', '#cdd6f4'];
const maxM = 7;

let width, height;
let birds = [];
let birdCount = 75;
let birdColors = [...defaultBirdColors];

// mode stuff
let mb = 2;
let M = [0, 0, 0];
let m = 0;
let useTime = true;
let frameCount = -1; // set to -1 to turn off chaos mode

// Input stuff
let currentPageId = 'home-page';
let mouseX = -1000; // default is off screen
let mouseY = -1000;
let isMouseDown = false;



function updateBgImg(url) {
    if (!url) {
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "#1e1e2e"; // pick your fallback color
        return;
    }
    document.body.style.backgroundImage = `url("${url}")`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
}



function hexToRGBA(hex, alpha = 0.35) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// flying behavior
const birdStates = [
    (x, y, X, Y) => ({ dx: 30, dy: 20 * Math.sin(X) }),                                      // m = 1: Sine wave
    (x, y, X, Y) => ({ dx: Math.cos(Y * 0.02) * 2, dy: Math.sin(X * 0.02) * 2 }),            // m = 2: Gentle wave
    (x, y, X, Y) => ({ dx: (Math.sin(Y * 0.01) * 3) + (Math.sin(y * 0.03) * 1), dy: (Math.sin(X * 0.01) * 3) + (Math.cos(x * 0.05) * 2) }), // m = 3: Complex wave
    (x, y, X, Y) => ({ dx: Math.cos(Y) * 8, dy: Math.sin(X) * 8 }),                          // m = 4: Circle
    (x, y, X, Y) => ({ dx: 8, dy: Math.tan(X * 0.01) * 4 }),                                 // m = 5: Erratic
    (x, y, X, Y) => ({ dx: Math.cos(Y) * 8, dy: Math.sin(X) * 8 }),                          // m = 6: Circle (duplicate)
    (x, y) => {                                                                              // m = 7: Mouse Pull
        let pull = isMouseDown ? 0.05 : 0.01;
        return { dx: -(x - mouseX) * pull, dy: -(y - mouseY) * pull };
    },
    (x, y) => {                                                                              // m = 8: Mouse Repel
        let dx = x - mouseX;
        let dy = y - mouseY;
        let distance = Math.sqrt(dx**2 + dy**2);
        let repelRadius = isMouseDown ? 350 : 150;

        if (distance < repelRadius && distance > 0) {
            return { dx: (dx / distance) * 12, dy: (dy / distance) * 12 };
        }
        return { dx: 2, dy: Math.sin(x * 0.02) * 2 };
    }
];

function getBirdOffsets(x, y, cm) {
    m = mb + (M[cm] || 0);
    const X = useTime ? Date.now() * 0.0015 : x;
    const Y = useTime ? Date.now() * 0.0015 : y;
    const stateIndex = ((m - 1) % maxM + maxM) % maxM;
    return birdStates[stateIndex](x, y, X, Y);
}

class Bird {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;

        this.vx = (Math.random() * 1.5) + 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.Vx = this.vx;
        this.Vy = this.vy;

        this.cm = Math.floor(Math.random() * birdColors.length);
        this.color = birdColors[this.cm];

        this.size = Math.random() * 1.5 + 1;
        this.wingSpeed = (Math.random() * 0.01) + 0.005;
        this.wingOffset = Math.random() * Math.PI * 2;
    }

    update() {
        const offsets = getBirdOffsets(this.x, this.y, this.cm);
        
        this.Vx = this.vx + offsets.dx;
        this.Vy = this.vy + offsets.dy;
        this.x += this.Vx;
        this.y += this.Vy;

        // Screen wrapping
        if (this.x < -50) this.x = width + 50;
        if (this.x > width + 50) this.x = -50;
        if (this.y < -50) this.y = height + 50;
        if (this.y > height + 50) this.y = -50;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        const angle = Math.atan2(this.Vy, this.Vx);
        ctx.rotate(angle);

        const flap = Math.sin(Date.now() * this.wingSpeed + this.wingOffset) * 12;
        
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth   = this.size;
        ctx.lineCap     = "round";
        ctx.lineJoin    = "round";

        ctx.moveTo(-10, flap);  // left wing
        ctx.lineTo(0, 0);       // center
        ctx.lineTo(-10, -flap); // right wing

        ctx.stroke();
        ctx.restore();
    }

    updateColor() {
        this.color = birdColors[Math.floor(Math.random() * birdColors.length)];
    }
}

// a lot of fuctions

function showPage(pageId) {
    hideLogin();
    
    const targetPage = document.getElementById(pageId);
    const isClosing = targetPage && targetPage.classList.contains('active') && !msg.classList.contains('hidden');

    if (isClosing) {
        msg.classList.add('hidden');
        updateSidebar(null);
    } else {
        msg.classList.remove('hidden');
        pages.forEach(page => {
            if (page.id === pageId) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        currentPageId = pageId;
        updateSidebar(pageId);
    }
}

function resize() {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

function updateSidebar(activePageId) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.target === activePageId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function showLogin() {
    loginError.textContent = '';
    loginOverlay.classList.add('active');
    loginOverlay.setAttribute('aria-hidden', 'false');
    loginPassword.value = '';
    loginPassword.focus();
}

function hideLogin() {
    loginOverlay.classList.remove('active');
    loginOverlay.setAttribute('aria-hidden', 'true');
    loginError.textContent = '';
    loginForm.reset();
}

function updateBirdColors() {
    birdColorCountInput.value = String(birdColors.length);
    birdColorsContainer.querySelectorAll('input[type="color"]').forEach(input => input.remove());

    birdColors.forEach((birdColor, index) => {
        const input = document.createElement('input');
        input.className = 'copy pointer';
        input.type = 'color';
        input.value = birdColor;
        input.dataset.index = String(index);
        input.addEventListener('input', (event) => {
            birdColors[index] = event.target.value;
            birds.forEach(bird => bird.updateColor());
        });
        birdColorsContainer.appendChild(input);
    });

    birds.forEach(bird => bird.updateColor());
}

function setBirdColorCount(nextCount) {
    const targetCount = Math.max(1, Number(nextCount) || 1);
    while (birdColors.length < targetCount) {
        birdColors.push(defaultBirdColors[birdColors.length % defaultBirdColors.length]);
    }
    birdColors.length = targetCount;
    updateBirdColors();
}

const actions = {
    copyColor: async () => await navigator.clipboard.writeText("#a6e3a1"),
    nextBirdType: () => { mb = (mb % maxM) + 1; MB.textContent = mb; },
    randomBirdType: () => { mb = Math.ceil(Math.random() * maxM); MB.textContent = mb; },
    addBird: () => {
        birdCount += 1;
        birds.push(new Bird());
        birdCounter.value = String(birdCount);
    },
    removeBird: () => {
        if (birds.length > 0) {
            birds.pop();
            birdCount = Math.max(0, birdCount - 1);
            birdCounter.value = String(birdCount);
        }
    },
    HideMsg: () => {
        // Tied to the backtick key
        msg.classList.toggle('hidden');
        hideLogin();
        if(msg.classList.contains('hidden')) updateSidebar(null);
    },
    ShowSettings: () => showPage('settings-page'),
    ShowHome: () => showPage('home-page'),
    addBirdColor: () => setBirdColorCount(Math.min(birdColors.length + 1, 8)),
    removeBirdColor: () => setBirdColorCount(Math.max(birdColors.length - 1, 0)),
    
    // New Sidebar Login Action
    toggleLogin: () => {
        if (loginOverlay.classList.contains('active')) {
            hideLogin();
        } else {
            msg.classList.add('hidden'); // Hide main UI when logging in
            updateSidebar(null);
            showLogin();
        }
    }
};

// input maneger
function setupEventListeners() {
        window.addEventListener('keydown', (event) => { 
        if (event.key === "`") showPage(currentPageId);
    });
    
    // sidebar buttons
    document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            showPage(btn.dataset.target);
        });
    });
    
    // evrything else
    document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action]'); 
        if (target && actions[target.dataset.action]) {
            actions[target.dataset.action]();
        }
    });
}

// animation loop
function init() {
    resize();
    setupEventListeners();
    
    // spawn initial birdies
    for (let i = 0; i < birdCount; i++) {
        birds.push(new Bird());
    }
    birdCounter.value = String(birdCount);
    updateBirdColors();

    window.setTimeout(() => {
        if (msg.classList.contains('hidden')) loginArmed = true;
    }, 0);

    requestAnimationFrame(animateBirds);
}

function animateBirds() {
    ctx.clearRect(0, 0, width, height);

    birds.forEach(bird => {
        bird.update();
        bird.draw(); 
    });

    if (frameCount > 0) frameCount += 1;
    if (frameCount % 120 === 0) {
        m = (m % maxM) + 1;
    }

    requestAnimationFrame(animateBirds);
}

init();