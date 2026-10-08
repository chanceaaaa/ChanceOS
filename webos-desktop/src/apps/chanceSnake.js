import "../styles/chanceGames.css";
import { BaseApp, os, StorageKeys } from "../framework.js";
import { $, bindEvent } from "../shared/domUtils.js";

const GRID = 18;
const CELL = 20;
const TICK_MS = 115;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const KEY_TO_DIRECTION = {
  ArrowUp: "up",
  w: "up",
  ArrowDown: "down",
  s: "down",
  ArrowLeft: "left",
  a: "left",
  ArrowRight: "right",
  d: "right"
};

export class ChanceSnakeApp extends BaseApp {
  constructor(services) {
    super(services);
    this.openWindows = new Set();
    this.timer = null;
  }

  open() {
    const winId = "chance-snake";
    if (this.openWindows.has(winId)) return;

    const win = os.window.create(winId, "Snake", "420px", "520px", { icon: "fas fa-gamepad" });
    win.innerHTML = `
      <div class="cg-root">
        <div class="cg-status">
          <span class="cg-score">Score 0</span>
          <span class="cg-best">Best 0</span>
          <button class="cg-btn cg-restart">Restart</button>
        </div>
        <canvas class="cg-canvas" width="${GRID * CELL}" height="${GRID * CELL}" tabindex="0"></canvas>
        <div class="cg-hint">Arrow keys or WASD to steer. Swipe on touch screens.</div>
      </div>
    `;

    this.openWindows.add(winId);
    this.win = win;

    const canvas = $(".cg-canvas", win);
    const ctx = canvas.getContext("2d");
    const scoreEl = $(".cg-score", win);
    const bestEl = $(".cg-best", win);
    const styles = getComputedStyle(win);
    const colors = {
      bg: styles.getPropertyValue("--bg-primary").trim() || "#111",
      snake: styles.getPropertyValue("--brand").trim() || "#4a9",
      head: styles.getPropertyValue("--brand-glow").trim() || "#7fd",
      food: styles.getPropertyValue("--error").trim() || "#e55"
    };

    let snake;
    let heading;
    let queued;
    let food;
    let score;
    let finished;
    let best = Number(os.storage.get(StorageKeys.chanceSnakeBest)) || 0;
    bestEl.textContent = `Best ${best}`;

    const placeFood = () => {
      let spot;
      do {
        spot = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
      } while (snake.some((part) => part.x === spot.x && part.y === spot.y));
      food = spot;
    };

    const draw = () => {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colors.food;
      ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);
      snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? colors.head : colors.snake;
        ctx.fillRect(part.x * CELL + 1, part.y * CELL + 1, CELL - 2, CELL - 2);
      });
      if (finished) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Game over. Press an arrow key.", canvas.width / 2, canvas.height / 2);
      }
    };

    const reset = () => {
      snake = [
        { x: 9, y: 9 },
        { x: 8, y: 9 },
        { x: 7, y: 9 }
      ];
      heading = DIRECTIONS.right;
      queued = DIRECTIONS.right;
      score = 0;
      finished = false;
      scoreEl.textContent = "Score 0";
      placeFood();
      draw();
    };

    const step = () => {
      if (finished) return;
      heading = queued;
      const head = { x: snake[0].x + heading.x, y: snake[0].y + heading.y };
      const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID;
      const hitSelf = snake.some((part) => part.x === head.x && part.y === head.y);
      if (hitWall || hitSelf) {
        finished = true;
        if (score > best) {
          best = score;
          os.storage.set(StorageKeys.chanceSnakeBest, String(best));
          bestEl.textContent = `Best ${best}`;
        }
        draw();
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 1;
        scoreEl.textContent = `Score ${score}`;
        placeFood();
      } else {
        snake.pop();
      }
      draw();
    };

    const steer = (name) => {
      if (finished) reset();
      const next = DIRECTIONS[name];
      if (next.x !== -heading.x || next.y !== -heading.y) queued = next;
    };

    bindEvent(win, "keydown", (event) => {
      const name = KEY_TO_DIRECTION[event.key];
      if (!name) return;
      event.preventDefault();
      steer(name);
    });

    let startX = 0;
    let startY = 0;
    bindEvent(canvas, "pointerdown", (event) => {
      canvas.focus();
      startX = event.clientX;
      startY = event.clientY;
    });
    bindEvent(canvas, "pointerup", (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) steer(dx > 0 ? "right" : "left");
      else steer(dy > 0 ? "down" : "up");
    });

    bindEvent($(".cg-restart", win), "click", () => {
      reset();
      canvas.focus();
    });

    reset();
    this.timer = setInterval(step, TICK_MS);
    canvas.focus();

    win.addEventListener("remove", () => this.cleanup(winId));
  }

  cleanup(winId) {
    clearInterval(this.timer);
    this.timer = null;
    this.openWindows.delete(winId);
  }

  onClose(winId) {
    this.cleanup(winId);
  }
}
