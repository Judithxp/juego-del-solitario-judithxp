const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Variables de estado
let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
let food = { x: 5, y: 5 };
let dx = 1, dy = 0;
let score = 0, gameSpeed = 150;
let juegoActivo = false; 

// --- INICIALIZACIÓN ---
document.getElementById("boton-jugar").onclick = () => {
    document.getElementById("pantalla-inicio").style.display = "none";
    document.getElementById("juego-contenedor").style.display = "block";
    iniciarPartida();
};

document.getElementById("btn-reiniciar").onclick = () => iniciarPartida();
document.getElementById("btn-salir").onclick = () => {
    juegoActivo = false;
    document.getElementById("juego-contenedor").style.display = "none";
    document.getElementById("controles-fin").style.display = "none";
    document.getElementById("pantalla-inicio").style.display = "flex";
};

function iniciarPartida() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dx = 1; dy = 0;
    score = 0;
    scoreElement.innerText = score;
    document.getElementById("controles-fin").style.display = "none";
    
    juegoActivo = false; // El juego espera al PLAY
    document.getElementById("btnPausa").innerText = "PLAY";
    
    generateFood();
    clearCanvas();
    drawFood();
    drawSnake();
}

// --- BUCLE PRINCIPAL ---
function main() {
    if (!juegoActivo) return; 

    if (hasGameEnded()) {
        juegoActivo = false;
        document.getElementById("controles-fin").style.display = "block";
        document.getElementById("btnPausa").innerText = "PLAY";
        return;
    }

    clearCanvas();
    drawFood();
    drawSnake();
    moveSnake(); // Movemos aquí directamente

    setTimeout(main, gameSpeed); // Bucle simplificado
}

// --- BOTÓN PLAY/PAUSA ---
function alternarPausa() {
    if (!juegoActivo) {
        juegoActivo = true;
        document.getElementById("btnPausa").innerText = "PAUSA";
        main(); // Lanzamos el bucle
    } else {
        juegoActivo = false;
        document.getElementById("btnPausa").innerText = "PLAY";
    }
}

// --- CONTROLES Y LÓGICA ---
document.addEventListener("keydown", (e) => {
    const k = e.keyCode;
    if (k === 37 && dx !== 1) { dx = -1; dy = 0; }
    if (k === 38 && dy !== 1) { dx = 0; dy = -1; }
    if (k === 39 && dx !== -1) { dx = 1; dy = 0; }
    if (k === 40 && dy !== -1) { dx = 0; dy = 1; }
});

// Controles táctiles
document.getElementById("btnUp").ontouchstart = () => { if (dy !== 1) { dx = 0; dy = -1; } };
document.getElementById("btnDown").ontouchstart = () => { if (dy !== -1) { dx = 0; dy = 1; } };
document.getElementById("btnLeft").ontouchstart = () => { if (dx !== 1) { dx = -1; dy = 0; } };
document.getElementById("btnRight").ontouchstart = () => { if (dx !== 1) { dx = 1; dy = 0; } };

function clearCanvas() { ctx.fillStyle = "#252526"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
function drawSnake() { ctx.fillStyle = "#4ec9b0"; snake.forEach(p => ctx.fillRect(p.x * gridSize, p.y * gridSize, gridSize - 2, gridSize - 2)); }
function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    if (snake[0].x === food.x && snake[0].y === food.y) { score += 10; scoreElement.innerText = score; generateFood(); }
    else snake.pop();
}
function drawFood() { ctx.fillStyle = "#f44747"; ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2); }
function generateFood() {
    let nuevaPosicion;
    let colision;

    // Repetimos hasta encontrar una posición libre
    do {
        nuevaPosicion = { 
            x: Math.floor(Math.random() * tileCount), 
            y: Math.floor(Math.random() * tileCount) 
        };
        
        // Verificamos si la nueva posición coincide con cualquier parte de la serpiente
        colision = snake.some(segmento => segmento.x === nuevaPosicion.x && segmento.y === nuevaPosicion.y);
    } while (colision); // Si hubo colisión, el bucle "do...while" vuelve a empezar

    food = nuevaPosicion;
}
function hasGameEnded() {
    if (snake[0].x < 0 || snake[0].x >= tileCount || snake[0].y < 0 || snake[0].y >= tileCount) return true;
    for (let i = 1; i < snake.length; i++) if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    return false;
}