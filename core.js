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
const clockElement = document.getElementById('clock-display');
const expHeader = document.getElementById('explorer-header');
const expBody = document.getElementById('explorer-body');

blobLayer.style.display = "none"; // ========================= temp fix

const osTarget = 'file:///c%3A/Users/RoboReid/Desktop/coding/.vscode/Stardust-NASA-apps/Web-OS/index.html?login=true';
const defaultBirdColors = ['#b4befe', '#cba6f7', '#cdd6f4'];
const maxM = 7;

let explorerPath = { theme: null, category: null };
let width, height;
let birds = [];
let birdCount = 75;
let birdColors = [...defaultBirdColors];
let CT = "Light"

// Initialize favorites from localStorage (saves across reloads)
let favorites = JSON.parse(localStorage.getItem('bgFavorites')) || [];

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

function saveFavorites() {
    localStorage.setItem('bgFavorites', JSON.stringify(favorites));
}

function handleFavorite(theme, category, imgName) {
    const existsIndex = favorites.findIndex(f => f.theme === theme && f.category === category && f.imgName === imgName);
    
    if (existsIndex > -1) {
        favorites.splice(existsIndex, 1); // toggle
    } else {
        favorites.push({ theme, category, imgName });
    }
    
    saveFavorites();
    
    if (explorerPath.theme === 'Favorites') {
        renderWallpaperExplorer();
    }
}

function renderWallpaperExplorer() {
    expBody.innerHTML = '';
    expHeader.innerHTML = '';

    // nav header / breadcrumbs
    let breadcrumbText = `<span style="opacity: 0.6;">Root</span>`;
    
    if (explorerPath.theme) {
        const backBtn = document.createElement('button');
        backBtn.className = 'explorer-back-btn pointer';
        backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Back';
        backBtn.onclick = handleExplorerBack;
        expHeader.appendChild(backBtn);

        breadcrumbText += ` / <span>${explorerPath.theme}</span>`;
    }
    if (explorerPath.category) {
        breadcrumbText += ` / <span>${explorerPath.category}</span>`;
    }
    
    const breadcrumbSpan = document.createElement('span');
    breadcrumbSpan.innerHTML = breadcrumbText;
    expHeader.appendChild(breadcrumbSpan);

    // render nodes
    if (!explorerPath.theme) {
        createExplorerNode("none", 'fa-image', () => {
            const fullUrl = "none";
            updateBgImg("");
        });
        createExplorerNode('Favorites', 'fa-star', () => {
            explorerPath.theme = 'Favorites';
            renderWallpaperExplorer();
        });

        // Main folders
        Object.keys(imageTree).forEach(themeName => {
            createExplorerNode(themeName, 'fa-folder', () => {
                explorerPath.theme = themeName;
                renderWallpaperExplorer();
            });
        });
    } else if (explorerPath.theme === 'Favorites') {
        if (favorites.length === 0) {
            expBody.innerHTML = '<span style="color: var(--text); opacity: 0.7; padding: 10px;">No favorites yet. Double-click an image to add it!</span>';
        } else {
            favorites.forEach(fav => {
                createExplorerNode(fav.imgName, 'fa-image', () => {
                    const fullUrl = `CozyPixels-main/${fav.theme}/${fav.category}/${fav.imgName}`;
                    updateBgImg(encodeURI(fullUrl));
                }, () => handleFavorite(fav.theme, fav.category, fav.imgName));
            });
        }
    } else if (!explorerPath.category) {
        // sub-folders
        Object.keys(imageTree[explorerPath.theme]).forEach(categoryName => {
            createExplorerNode(categoryName, 'fa-folder', () => {
                explorerPath.category = categoryName;
                renderWallpaperExplorer();
            });
        });
    } else {
        // show imgs
        const images = imageTree[explorerPath.theme][explorerPath.category];
        images.forEach(imgName => {
            // Added the double-click callback to the image nodes
            createExplorerNode(imgName, 'fa-image', () => {
                // url
                const fullUrl = `CozyPixels-main/${explorerPath.theme}/${explorerPath.category}/${imgName}`;
                updateBgImg(encodeURI(fullUrl));
            }, () => handleFavorite(explorerPath.theme, explorerPath.category, imgName));
        });
    }
}

// double click checker for favorites
function createExplorerNode(name, iconClass, clickCallback, dblClickCallback = null) {
    const item = document.createElement('button');
    item.className = 'explorer-item pointer';
    item.style.border = 'none';
    item.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${name.length < 20 ? name : "?"}</span>
    `;
    item.onclick = clickCallback;
    
    if (dblClickCallback) {
        item.ondblclick = dblClickCallback;
    }
    
    expBody.appendChild(item);
}

function handleExplorerBack() {
    if (explorerPath.category) {
        explorerPath.category = null;
    } else if (explorerPath.theme) {
        explorerPath.theme = null;
    }
    renderWallpaperExplorer();
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

function updateClock() {
    if (!clockElement) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString(); // HH:MM:SS
    clockElement.textContent = timeString;
}

// Run the update every 1000ms (1 second)
setInterval(updateClock, 1000);

// Initialize it once so it doesn't wait 1s to show up
updateClock();

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
    },

    toggleCT: () => {
        if (CT == "Light") {
            document.querySelectorAll('.CT').forEach((item) => {item.style.color = "var(--surface2)"});
            document.getElementById('CT-btn').textContent = "Light"
            CT = "Dark"
        } else {
            document.querySelectorAll('.CT').forEach((item) => {item.style.color = "var(--text)"});
            document.getElementById('CT-btn').textContent = "Dark"
            CT = "Light"
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
    birdCounter.addEventListener('input' , () => {
        let diff = (parseInt(birdCounter.value, 10) || 0) - birdCount
        if (diff > 0) {
            for (let j = 0; j < diff; j++) {
                birdCount += 1;
                birds.push(new Bird());
                birdCounter.value = String(birdCount);
            };
        } else if (diff < 0) {
            diff = Math.abs(diff)
            for (let j = 0; j < diff; j++) {
                if (birds.length > 0) {
                    birds.pop();
                    birdCount = Math.max(0, birdCount - 1);
                    birdCounter.value = String(birdCount);
                }
            };
        }
    })
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
    
    // START THE EXPLORER WORKFLOW
    renderWallpaperExplorer(); 

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