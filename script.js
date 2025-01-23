const GAME_CONFIG = {
    GAME_DURATION: 30,        // 游戏时长（秒）
    ITEM_SPAWN_INTERVAL: 300, // 物品生成间隔（毫秒）
    BOMB_SPAWN_INTERVAL: 5000,// 炸弹生成间隔（毫秒）
    ITEM_FALL_SPEED: 3,      // 物品下落速度
    PLAYER_SPEED: 15,        // 玩家移动速度
    SCORE_PER_ITEM: 10,      // 每个物品的分数
    PLAYER_SIZE: 150,        // 玩家大小
    ITEM_SIZE: 50,          // 物品大小
    BOMB_SIZE: 60           // 炸弹大小
};

const imageCache = {};
const audioCache = {};
let currentScore = 0;
let gameTimer;
let itemSpawnInterval;
let bombSpawnInterval;
let canvas, ctx, player, items, bombs;

class Item {
    constructor(type) {
        this.type = type;
        this.x = Math.random() * (canvas.width - GAME_CONFIG.ITEM_SIZE);
        this.y = 0;
        this.speed = GAME_CONFIG.ITEM_FALL_SPEED;
    }
}

class AudioManager {
    constructor() {
        this.bgm = new Audio('music/background_music.mp3');
        this.bgm.loop = true;
        this.itemSounds = [
            new Audio('music/music1.mp3'),
            new Audio('music/music2.mp3'),
            new Audio('music/music3.mp3'),
            new Audio('music/music4.mp3')
        ];
        this.buttonSound = new Audio('music/button.mp3');
        this.bombSound = new Audio('music/bomb.mp3');
    }

    playBGM() {
        this.bgm.play();
    }

    stopBGM() {
        this.bgm.pause();
    }

    playItemSound() {
        const sound = this.itemSounds[Math.floor(Math.random() * this.itemSounds.length)];
        sound.play();
    }

    playButtonSound() {
        this.buttonSound.play();
    }

    playBombSound() {
        this.bombSound.play();
    }
}

const audioManager = new AudioManager();

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            imageCache[src] = img;
            resolve(img);
        };
        img.onerror = () => {
            reject(new Error(`Failed to load image: ${src}`));
        };
    });
}

function loadAudio(src) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(src);
        audio.onloadeddata = () => {
            audioCache[src] = audio;
            resolve(audio);
        };
        audio.onerror = () => {
            reject(new Error(`Failed to load audio: ${src}`));
        };
    });
}

async function preloadResources() {
    const imagePromises = [
        loadImage('image/welcome_background.jpeg'),
        loadImage('image/game_background.jpeg'),
        loadImage('image/user.png'),
        loadImage('image/yuanbao.png'),
        loadImage('image/hongbao.png'),
        loadImage('image/fudai.png'),
        loadImage('image/jintiao.png'),
        loadImage('image/zhuanshi.png'),
        loadImage('image/zhihongbao.png'),
        loadImage('image/dahongbao.png'),
        loadImage('image/bomb.png')
    ];

    const audioPromises = [
        loadAudio('music/background_music.mp3'),
        loadAudio('music/button.mp3'),
        loadAudio('music/music1.mp3'),
        loadAudio('music/music2.mp3'),
        loadAudio('music/music3.mp3'),
        loadAudio('music/music4.mp3'),
        loadAudio('music/bomb.mp3')
    ];

    await Promise.all([...imagePromises, ...audioPromises]);
}

function resetGame() {
    currentScore = 0;
    document.getElementById('score').textContent = currentScore;
    items = [];
    bombs = [];
    player = {
        x: (canvas.width - GAME_CONFIG.PLAYER_SIZE) / 2,
        y: canvas.height - GAME_CONFIG.PLAYER_SIZE
    };
}

function startItemGeneration() {
    itemSpawnInterval = setInterval(() => {
        const itemTypes = ['yuanbao', 'hongbao', 'fudai', 'jintiao', 'zhuanshi', 'zhihongbao', 'dahongbao'];
        const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        items.push(new Item(randomType));
    }, GAME_CONFIG.ITEM_SPAWN_INTERVAL);

    bombSpawnInterval = setInterval(() => {
        bombs.push(new Item('bomb'));
    }, GAME_CONFIG.BOMB_SPAWN_INTERVAL);
}

function updateItems() {
    items = items.filter(item => {
        item.y += item.speed;
        if (item.y > canvas.height) return false;
        return true;
    });

    bombs = bombs.filter(bomb => {
        bomb.y += bomb.speed;
        if (bomb.y > canvas.height) return false;
        return true;
    });
}

function checkCollisions() {
    items.forEach(item => {
        if (collides(player, item)) {
            currentScore += GAME_CONFIG.SCORE_PER_ITEM;
            document.getElementById('score').textContent = currentScore;
            audioManager.playItemSound();
            items = items.filter(i => i !== item);
        }
    });

    bombs.forEach(bomb => {
        if (collides(player, bomb)) {
            endGame();
            audioManager.playBombSound();
        }
    });
}

function collides(rect1, rect2) {
    return (
        rect1.x < rect2.x + GAME_CONFIG.ITEM_SIZE &&
        rect1.x + GAME_CONFIG.PLAYER_SIZE > rect2.x &&
        rect1.y < rect2.y + GAME_CONFIG.ITEM_SIZE &&
        rect1.y + GAME_CONFIG.PLAYER_SIZE > rect2.y
    );
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    items.forEach(item => {
        ctx.drawImage(imageCache[`image/${item.type}.png`], item.x, item.y, GAME_CONFIG.ITEM_SIZE, GAME_CONFIG.ITEM_SIZE);
    });

    bombs.forEach(bomb => {
        ctx.drawImage(imageCache['image/bomb.png'], bomb.x, bomb.y, GAME_CONFIG.BOMB_SIZE, GAME_CONFIG.BOMB_SIZE);
    });

    ctx.drawImage(imageCache['image/user.png'], player.x, player.y, GAME_CONFIG.PLAYER_SIZE, GAME_CONFIG.PLAYER_SIZE);
}

function gameLoop() {
    updateItems();
    checkCollisions();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    resetGame();
    gameTimer = setInterval(() => {
        let timeLeft = document.getElementById('timer').textContent;
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    startItemGeneration();
    audioManager.playBGM();
    gameLoop();
}

function endGame() {
    clearInterval(gameTimer);
    clearInterval(itemSpawnInterval);
    clearInterval(bombSpawnInterval);
    audioManager.stopBGM();

    document.getElementById('final-score').textContent = currentScore;
    document.querySelector('.game-page').style.display = 'none';
    document.querySelector('.result-modal').style.display = 'flex';
}

function setupControls() {
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === 37) { // 左键
            player.x = Math.max(0, player.x - GAME_CONFIG.PLAYER_SPEED);
        } else if (e.keyCode === 39) { // 右键
            player.x = Math.min(canvas.width - GAME_CONFIG.PLAYER_SIZE, player.x + GAME_CONFIG.PLAYER_SPEED);
        }
    });

    document.addEventListener('touchstart', (e) => {
        player.touchStartX = e.touches[0].clientX;
    });

    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchMoveX = e.touches[0].clientX;
        const deltaX = touchMoveX - player.touchStartX;
        player.x = Math.max(0, Math.min(canvas.width - GAME_CONFIG.PLAYER_SIZE, player.x + deltaX));
        player.touchStartX = touchMoveX;
    });

    document.querySelector('.start-button').addEventListener('click', () => {
        document.querySelector('.welcome-page').style.display = 'none';
        document.querySelector('.game-page').style.display = 'flex';
        startGame();
    });

    document.querySelector('.replay-button').addEventListener('click', () => {
        document.querySelector('.result-modal').style.display = 'none';
        document.querySelector('.game-page').style.display = 'flex';
        startGame();
    });
}

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupControls();
    preloadResources().then(() => {
        console.log('All resources loaded successfully.');
    }).catch(error => {
        console.error('Failed to load resources:', error);
    });
}

window.onload = init;