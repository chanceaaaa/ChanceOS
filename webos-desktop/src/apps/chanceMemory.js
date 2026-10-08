import "../styles/chanceGames.css";
import { BaseApp, os, StorageKeys } from "../framework.js";
import { $, bindEvent, createElement } from "../shared/domUtils.js";

const SYMBOLS = ["🍎", "🚀", "🎲", "🐙", "🔥", "🎧", "🌙", "🧩"];
const FLIP_BACK_MS = 750;

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class ChanceMemoryApp extends BaseApp {
  constructor(services) {
    super(services);
    this.openWindows = new Set();
    this.flipTimer = null;
  }

  open() {
    const winId = "chance-memory";
    if (this.openWindows.has(winId)) return;

    const win = os.window.create(winId, "Memory Match", "400px", "520px", { icon: "fas fa-clone" });
    win.innerHTML = `
      <div class="cg-root">
        <div class="cg-status">
          <span class="cg-moves">Moves 0</span>
          <span class="cg-best">Best -</span>
          <button class="cg-btn cg-restart">New game</button>
        </div>
        <div class="cg-board"></div>
        <div class="cg-hint">Flip two cards. Match all eight pairs in as few moves as you can.</div>
      </div>
    `;

    this.openWindows.add(winId);
    this.win = win;

    const board = $(".cg-board", win);
    const movesEl = $(".cg-moves", win);
    const bestEl = $(".cg-best", win);
    let best = Number(os.storage.get(StorageKeys.chanceMemoryBest)) || 0;
    let moves = 0;
    let matched = 0;
    let first = null;
    let locked = false;

    const showBest = () => {
      bestEl.textContent = best ? `Best ${best}` : "Best -";
    };

    const finish = () => {
      if (!best || moves < best) {
        best = moves;
        os.storage.set(StorageKeys.chanceMemoryBest, String(best));
        showBest();
      }
      os.dialog.alert("You win", `Matched every pair in ${moves} moves.`);
    };

    const flip = (card) => {
      if (locked || card.classList.contains("cg-open") || card.classList.contains("cg-done")) return;
      card.classList.add("cg-open");
      card.textContent = card.dataset.symbol;
      if (!first) {
        first = card;
        return;
      }
      moves += 1;
      movesEl.textContent = `Moves ${moves}`;
      if (first.dataset.symbol === card.dataset.symbol) {
        [first, card].forEach((item) => {
          item.classList.remove("cg-open");
          item.classList.add("cg-done");
        });
        first = null;
        matched += 1;
        if (matched === SYMBOLS.length) finish();
        return;
      }
      locked = true;
      const pair = [first, card];
      first = null;
      this.flipTimer = setTimeout(() => {
        pair.forEach((item) => {
          item.classList.remove("cg-open");
          item.textContent = "";
        });
        locked = false;
      }, FLIP_BACK_MS);
    };

    const start = () => {
      clearTimeout(this.flipTimer);
      board.innerHTML = "";
      moves = 0;
      matched = 0;
      first = null;
      locked = false;
      movesEl.textContent = "Moves 0";
      showBest();
      shuffle([...SYMBOLS, ...SYMBOLS]).forEach((symbol) => {
        const card = createElement("button", {
          className: "cg-card",
          attributes: { "aria-label": "Hidden card" }
        });
        card.dataset.symbol = symbol;
        bindEvent(card, "click", () => flip(card));
        board.appendChild(card);
      });
    };

    bindEvent($(".cg-restart", win), "click", start);
    start();

    win.addEventListener("remove", () => this.cleanup(winId));
  }

  cleanup(winId) {
    clearTimeout(this.flipTimer);
    this.openWindows.delete(winId);
  }

  onClose(winId) {
    this.cleanup(winId);
  }
}
