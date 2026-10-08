/**
 * Pentotime / Tetris Clock
 * 10x15 İdeal Boyut, Kesintisiz Düşüş Fiziği (Asla Kaybolmayan Bloklar),
 * Sol Alt Sabit Info Butonu, İnteraktif Demo ve 8-Bit Web Audio
 */

// 1. 8-BIT RETRO TETRIS SES MOTORU (WEB AUDIO API)
class RetroAudio {
  constructor() {
    this.ctx = null;
    const saved = localStorage.getItem("tetris_clock_sound");
    this.enabled = saved !== "false";
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    localStorage.setItem("tetris_clock_sound", this.enabled ? "true" : "false");
    if (this.enabled) {
      this.playTick();
    }
    return this.enabled;
  }

  playTick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.035);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  playLock() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.09);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playLineClear() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [493.88, 659.25, 830.61, 987.77];
    const noteDuration = 0.065;
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.value = freq;

      const noteStart = startTime + idx * noteDuration;
      gain.gain.setValueAtTime(0.08, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
  }
}

const audio = new RetroAudio();
document.addEventListener("pointerdown", () => audio.init(), { once: true });

// 2. TEMALAR (THEMES) - YÜKSEK KONTRAST PALETLERİ
const THEMES = {
  classic: {
    id: "classic",
    name: "🎨 CLASSIC",
    bodyClass: "",
    colors: {
      teal: "#18b0bf",
      blue: "#2244b8",
      purple: "#7c45b8",
      red: "#d42a30",
      green: "#3aaa2c",
      orange: "#e07820",
      yellow: "#d4cc18",
      gray: "#888888"
    }
  },
  gameboy: {
    id: "gameboy",
    name: "👾 GAME BOY",
    bodyClass: "theme-gameboy",
    colors: {
      teal: "#143c14",
      blue: "#082808",
      purple: "#224c22",
      red: "#0d330d",
      green: "#1a461a",
      orange: "#123b12",
      yellow: "#2b562b",
      gray: "#627d1a"
    }
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "🌆 CYBERPUNK",
    bodyClass: "theme-cyberpunk",
    colors: {
      teal: "#00f0ff",
      blue: "#0080ff",
      purple: "#b000ff",
      red: "#ff0055",
      green: "#00ff66",
      orange: "#ff7700",
      yellow: "#ffe600",
      gray: "#2c1c4d"
    }
  },
  matrix: {
    id: "matrix",
    name: "📟 MATRIX",
    bodyClass: "theme-matrix",
    colors: {
      teal: "#00ff66",
      blue: "#00cc44",
      purple: "#00aa33",
      red: "#22ff44",
      green: "#00ff00",
      orange: "#33ff55",
      yellow: "#55ff77",
      gray: "#002808"
    }
  }
};

const THEME_KEYS = ["classic", "gameboy", "cyberpunk", "matrix"];

// 3. ŞEKİLLER (PENTOMINOES)
const SHAPES = [
  { name: "L", blocks: [[0,0],[1,0],[2,0],[3,0],[3,1]], rows: 4, cols: 2, colorKey: "teal" },
  { name: "J", blocks: [[0,1],[1,1],[2,1],[3,0],[3,1]], rows: 4, cols: 2, colorKey: "blue" },
  { name: "T", blocks: [[0,0],[0,1],[0,2],[1,1],[1,2]], rows: 2, cols: 3, colorKey: "purple" },
  { name: "LINE", blocks: [[0,0],[0,1],[0,2],[0,3],[0,4]], rows: 1, cols: 5, colorKey: "teal" },
  { name: "U", blocks: [[0,0],[0,2],[1,0],[1,1],[1,2]], rows: 2, cols: 3, colorKey: "red" },
  { name: "S", blocks: [[0,1],[0,2],[1,0],[1,1],[2,0]], rows: 3, cols: 3, colorKey: "green" },
  { name: "P", blocks: [[0,0],[0,1],[1,1],[2,1],[2,2]], rows: 3, cols: 3, colorKey: "orange" },
  { name: "PLUS", blocks: [[0,1],[1,0],[1,1],[1,2],[2,1]], rows: 3, cols: 3, colorKey: "red" },
  { name: "Y", blocks: [[0,1],[1,0],[1,1],[2,1],[3,1]], rows: 4, cols: 2, colorKey: "yellow" }
];

const HOURS_SEQ = [0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2];
const MINS_SEQ = [2, 4, 6, 1, 7, 5, 3, 8, 0, 2, 4, 6, 1];

const GRID_ROWS = 15;
const GRID_COLS = 10;
const PREVIEW_ROWS = 5;
const PREVIEW_COLS = 6;

// 4. TETRIS YERLEŞTİRME VE FİZİK MOTORU
function createEmptyGrid(rows = GRID_ROWS, cols = GRID_COLS) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

function getColHeights(grid, rows = GRID_ROWS, cols = GRID_COLS) {
  const heights = Array(cols).fill(0);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (grid[r][c] !== null) {
        heights[c] = rows - r;
        break;
      }
    }
  }
  return heights;
}

function getDropRow(shape, grid, col, rows = GRID_ROWS, cols = GRID_COLS) {
  let dropRow = rows;
  const heights = getColHeights(grid, rows, cols);
  for (let l = 0; l < shape.cols; l++) {
    const c = col + l;
    if (c < 0 || c >= cols) return null;
    let maxBlockR = -1;
    for (const [br, bc] of shape.blocks) {
      if (bc === l && br > maxBlockR) maxBlockR = br;
    }
    if (maxBlockR === -1) continue;
    const targetRow = rows - heights[c] - 1 - maxBlockR;
    dropRow = Math.min(dropRow, targetRow);
  }
  return dropRow;
}

function findBestCol(shape, grid, rows = GRID_ROWS, cols = GRID_COLS) {
  let bestCol = 0;
  let minMaxHeight = Infinity;
  for (let c = 0; c <= cols - shape.cols; c++) {
    const row = getDropRow(shape, grid, c, rows, cols);
    if (row === null || row < 0) continue;

    const tempGrid = grid.map(r => [...r]);
    for (const [br, bc] of shape.blocks) {
      const r = row + br;
      const cc = c + bc;
      if (r >= 0 && r < rows) {
        tempGrid[r][cc] = "temp";
      }
    }
    const heights = getColHeights(tempGrid, rows, cols);
    let maxH = 0;
    for (let l = 0; l < shape.cols; l++) {
      maxH = Math.max(maxH, heights[c + l]);
    }
    if (maxH < minMaxHeight) {
      minMaxHeight = maxH;
      bestCol = c;
    }
  }
  return bestCol;
}

function packShapes(count, seq, rows = GRID_ROWS, cols = GRID_COLS) {
  const grid = createEmptyGrid(rows, cols);
  const placements = [];
  for (let i = 0; i < count; i++) {
    const shape = SHAPES[seq[i] % SHAPES.length];
    const bestCol = findBestCol(shape, grid, rows, cols);
    const dropRow = getDropRow(shape, grid, bestCol, rows, cols);
    if (dropRow !== null) {
      placements.push({ shape, row: dropRow, col: bestCol });
      for (const [br, bc] of shape.blocks) {
        const r = dropRow + br;
        const c = bestCol + bc;
        if (r >= 0 && r < rows) {
          grid[r][c] = shape.colorKey;
        }
      }
    }
  }
  return { placements, grid };
}

// 5. DAKİKA DURUMU HESAPLAMA (KESİNTİSİZ TETRİS MANTIĞI)
// Tahtada o anki dakikanın şekli ve blokları yer alır.
// NEXT kutusunda ise DAİMA 1 DAKİKA SONRAKİ durum gösterilir:
// - Normal dakikalarda (örn: 22:42): aynı şeklin bir sonraki bloğu (filledOnBoard + 1)
// - 14:29, 22:44 gibi son dakikalarda: bir sonraki yeni şekil ve içinin 1 bloğu dolu hali!
function getMinuteFlowState(minutes) {
  const shapeIndex = Math.min(Math.floor(minutes / 5), 11);
  const remainder = minutes % 5;
  const filledOnBoard = remainder + 1; // 1, 2, 3, 4, 5
  const isFalling = (remainder === 4 && minutes < 59);

  const currentShapeIdx = MINS_SEQ[shapeIndex % MINS_SEQ.length];
  const nextShapeIdx = MINS_SEQ[(shapeIndex + 1) % MINS_SEQ.length];

  let previewShapeIdx;
  let previewColoredCount;

  if (remainder === 4) {
    // 14:29, 22:44 gibi son dakikalarda: bir dakika sonra yeni şekil başlayacak ve 1 bloğu dolu olacak!
    previewShapeIdx = nextShapeIdx;
    previewColoredCount = 1;
  } else {
    // Normal dakikalarda (örn: 22:42): bir dakika sonra aynı şeklin bir sonraki bloğu dolacak!
    previewShapeIdx = currentShapeIdx;
    previewColoredCount = filledOnBoard + 1;
  }

  return {
    placedCount: shapeIndex + 1,
    activeIndex: shapeIndex,
    activeShapeIdx: currentShapeIdx,
    filledCount: filledOnBoard,
    isFalling,
    incomingShapeIdx: nextShapeIdx, // Düşmekte olan parça bir sonraki parçadır
    previewShapeIdx,
    previewColoredCount
  };
}

// 6. UYGULAMA DURUMU (STATE)
function getSystemTime() {
  const now = new Date();
  const rawHours = now.getHours();
  const isPM = rawHours >= 12;
  return {
    rawHours,
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
    isPM
  };
}

// 6. ÇOK DİLLİ DESTEK (I18N - TR / EN)
const I18N = {
  tr: {
    liveActive: "CANLI",
    livePaused: "DURDU",
    soundOn: "🔊 SES: AÇIK",
    soundOff: "🔇 SES: KAPALI",
    soundTooltip: "Sesi aç veya kapat (S)",
    themeTooltip: "Renk temasını değiştirmek için tıkla (T)",
    crtOn: "📺 CRT: AÇIK",
    crtOff: "📺 CRT: KAPALI",
    crtTooltip: "Tüplü TV / Scanline efektini aç/kapat (C)",
    fullscreenOn: "⛶ TAM EKRAN",
    fullscreenOff: "🗗 ÇIKIŞ",
    fullscreenExit: "🗗 ÇIKIŞ (F)",
    fullscreenTooltip: "Tam ekran moduna geç / çık (F)",
    testDrop: "🚀 DÜŞÜŞÜ TEST ET",
    testDropTooltip: "Yeni şeklin süzülüşünü test etmek için tıkla (Space)",
    testClear: "⚡ TEST CLEAR",
    testClearTooltip: "Saat başı efektini test etmek için tıkla",
    themeNames: {
      classic: "🎨 KLASİK",
      gameboy: "🕹️ GAME BOY",
      cyberpunk: "🌆 CYBERPUNK",
      matrix: "🟢 MATRIX"
    },
    hoursTitle: "SAAT",
    hoursLegend: "1 ŞEKİL = 1 SAAT",
    minutesTitle: "DAKİKA",
    minutesLegend: "1 ŞEKİL = 5 DK • 1 BLOK = 1 DK",
    nextTitle: "SIRADAKİ",
    nextIn: sec => `${sec} sn sonra`,
    droppingNow: "şimdi süzülüyor...",
    statusWaiting: "BEKLİYOR",
    statusFalling: (row, target) => `SÜZÜLÜYOR (${row}/${target})`,
    statusTesting: "TEST EDİLİYOR",
    infoBtn: "NASIL ÇALIŞIR?",
    infoBtnTooltip: "Bu saat nasıl çalışır? Öğrenmek ve denemek için tıkla",
    modalTitle: "⚡ PENTOTIME NASIL ÇALIŞIR?",
    guideHoursTitle: "🏛️ SAAT KUYUSU (HOURS)",
    guideHoursDesc: "Her bir <strong>Tetris şekli 1 Saattir</strong>. 12 saat boyunca tabanda 12 adet 5'li blok üst üste birikir.",
    guideMinsTitle: "⏱️ DAKİKA KUYUSU (MINUTES)",
    guideMinsDesc: "Her <strong>şekil 5 dakikayı</strong> temsil eder. Şeklin içindeki her <strong>tekli blok 1 dakikadır</strong>.",
    guideDropTitle: "🪂 SÜZÜLME (DROP)",
    guideDropDesc: "Yeni 5 dakikalık şekil gelmeden <strong>1 dakika önce</strong> (örn: 7:34) yukarıdan süzülür ve 7:35'te kilitlenir!",
    guideClearTitle: "⚡ SATIR SİLİNME (CLEAR)",
    guideClearDesc: "Saat başlarında dakika tahtası <strong>NES Tetris perde efektiyle</strong> temizlenir ve yeni saate geçilir.",
    demoTitle: "🎮 İNTERAKTİF DENEME ALANI",
    demoHourLabel: "SAAT:",
    demoMinuteLabel: "DAKİKA:"
  },
  en: {
    liveActive: "LIVE",
    livePaused: "PAUSED",
    soundOn: "🔊 SOUND: ON",
    soundOff: "🔇 SOUND: OFF",
    soundTooltip: "Toggle retro sound effects (S)",
    themeTooltip: "Click to cycle color theme (T)",
    crtOn: "📺 CRT: ON",
    crtOff: "📺 CRT: OFF",
    crtTooltip: "Toggle CRT / scanline effect (C)",
    fullscreenOn: "⛶ FULLSCREEN",
    fullscreenOff: "🗗 EXIT FULL",
    fullscreenExit: "🗗 EXIT (F)",
    fullscreenTooltip: "Toggle fullscreen screensaver mode (F)",
    testDrop: "🚀 TEST DROP",
    testDropTooltip: "Test incoming shape glide animation (Space)",
    testClear: "⚡ TEST CLEAR",
    testClearTooltip: "Test top-of-hour clear animation",
    themeNames: {
      classic: "🎨 CLASSIC",
      gameboy: "🕹️ GAME BOY",
      cyberpunk: "🌆 CYBERPUNK",
      matrix: "🟢 MATRIX"
    },
    hoursTitle: "HOURS",
    hoursLegend: "1 SHAPE = 1 HR",
    minutesTitle: "MINUTES",
    minutesLegend: "1 SHAPE = 5 MIN • 1 BLOCK = 1 MIN",
    nextTitle: "NEXT",
    nextIn: sec => `next in ${sec}s`,
    droppingNow: "dropping now...",
    statusWaiting: "WAITING",
    statusFalling: (row, target) => `FALLING (${row}/${target})`,
    statusTesting: "TESTING",
    infoBtn: "HOW IT WORKS",
    infoBtnTooltip: "How does this clock work? Click to learn and try",
    modalTitle: "⚡ HOW PENTOTIME WORKS",
    guideHoursTitle: "🏛️ HOURS WELL",
    guideHoursDesc: "Each <strong>Tetris shape represents 1 Hour</strong>. Up to 12 shapes stack in the well across 12 hours.",
    guideMinsTitle: "⏱️ MINUTES WELL",
    guideMinsDesc: "Each <strong>shape represents 5 minutes</strong>. Each <strong>single block inside is 1 minute</strong>.",
    guideDropTitle: "🪂 FALLING PIECE",
    guideDropDesc: "<strong>1 minute before</strong> a new 5-min mark (e.g. 7:34), the piece glides down and locks at 7:35!",
    guideClearTitle: "⚡ LINE CLEAR",
    guideClearDesc: "At the top of each hour, the minutes well clears with an authentic <strong>NES Tetris curtain animation</strong>.",
    demoTitle: "🎮 INTERACTIVE PLAYGROUND",
    demoHourLabel: "HOUR:",
    demoMinuteLabel: "MINUTE:"
  }
};

const savedTheme = localStorage.getItem("tetris_clock_theme") || "classic";
const savedFormat = localStorage.getItem("tetris_clock_format") || "12";
const savedLang = localStorage.getItem("tetris_clock_lang") || "tr";
const savedCrt = localStorage.getItem("tetris_clock_crt");

const state = {
  ...getSystemTime(),
  isLive: true,
  is24Hour: savedFormat === "24",
  currentLang: savedLang === "en" ? "en" : "tr",
  isCrt: savedCrt === "true",
  isFullscreen: false,
  showTimeDigits: true,
  isAnimatingClear: false,
  isTestingDrop: false,
  testDropRow: null,
  previousHour: null,
  previousMinute: null,
  previousFallingRow: null,
  currentTheme: THEMES[savedTheme] ? savedTheme : "classic"
};

function getThemeColor(colorKey) {
  const current = THEMES[state.currentTheme] || THEMES.classic;
  return current.colors[colorKey] || current.colors.teal;
}

function getShapeColor(shape) {
  return getThemeColor(shape.colorKey);
}

// 7. DOM ELEMENTLERİ
const hoursGridEl = document.getElementById("hours-grid");
const minutesGridEl = document.getElementById("minutes-grid");
const nextGridEl = document.getElementById("next-grid");
const timeDigitsEl = document.getElementById("time-digits");
const timeAmpmBadgeEl = document.getElementById("time-ampm-badge");
const timeDisplayEl = document.getElementById("time-display");
const nextCountdownEl = document.getElementById("next-countdown");
const dropStatusBadgeEl = document.getElementById("drop-status-badge");
const format12Btn = document.getElementById("format-12-btn");
const format24Btn = document.getElementById("format-24-btn");
const soundBtn = document.getElementById("sound-btn");
const themeBtn = document.getElementById("theme-btn");
const crtBtn = document.getElementById("crt-btn");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const fullscreenExitBtn = document.getElementById("fullscreen-exit-btn");
const testDropBtn = document.getElementById("test-drop-btn");
const testClearBtn = document.getElementById("test-clear-btn");
const infoBtn = document.getElementById("info-btn");
const toggleTimeBtn = document.getElementById("toggle-time-btn");

// Dil Değiştirici ve Metin Elementleri
const langTrBtn = document.getElementById("lang-tr-btn");
const langEnBtn = document.getElementById("lang-en-btn");
const wellHeaderHoursEl = document.getElementById("well-header-hours");
const wellHeaderMinutesEl = document.getElementById("well-header-minutes");
const legendHoursTitleEl = document.getElementById("legend-hours-title");
const legendHoursDescEl = document.getElementById("legend-hours-desc");
const legendMinsTitleEl = document.getElementById("legend-mins-title");
const legendMinsDescEl = document.getElementById("legend-mins-desc");
const nextTitleEl = document.getElementById("next-title");
const infoBtnTextEl = document.getElementById("info-btn-text");

// Modal Elementleri
const infoModalEl = document.getElementById("info-modal");
const infoCloseBtn = document.getElementById("info-close-btn");
const modalTitleEl = document.getElementById("modal-title");
const guideHoursTitleEl = document.getElementById("guide-hours-title");
const guideHoursDescEl = document.getElementById("guide-hours-desc");
const guideMinsTitleEl = document.getElementById("guide-mins-title");
const guideMinsDescEl = document.getElementById("guide-mins-desc");
const guideDropTitleEl = document.getElementById("guide-drop-title");
const guideDropDescEl = document.getElementById("guide-drop-desc");
const guideClearTitleEl = document.getElementById("guide-clear-title");
const guideClearDescEl = document.getElementById("guide-clear-desc");
const demoTitleEl = document.getElementById("demo-title");
const demoHourLabelEl = document.getElementById("demo-hour-label");
const demoMinLabelEl = document.getElementById("demo-min-label");
const demoHoursGridEl = document.getElementById("demo-hours-grid");
const demoMinutesGridEl = document.getElementById("demo-minutes-grid");
const demoHourSlider = document.getElementById("demo-hour-slider");
const demoMinuteSlider = document.getElementById("demo-minute-slider");
const demoHourValEl = document.getElementById("demo-hour-val");
const demoMinuteValEl = document.getElementById("demo-minute-val");
const demoTimeTextEl = document.getElementById("demo-time-text");

const hourCells = [];
const minuteCells = [];
const nextCells = [];
const demoHourCells = [];
const demoMinuteCells = [];

// DİL AYARI FONKSİYONU
function setLanguage(lang) {
  state.currentLang = lang === "en" ? "en" : "tr";
  localStorage.setItem("tetris_clock_lang", state.currentLang);

  if (state.currentLang === "en") {
    langEnBtn.classList.add("active");
    langTrBtn.classList.remove("active");
  } else {
    langTrBtn.classList.add("active");
    langEnBtn.classList.remove("active");
  }

  const t = I18N[state.currentLang] || I18N.tr;

  // Butonlar & İpuçları
  soundBtn.title = t.soundTooltip;
  themeBtn.title = t.themeTooltip;
  crtBtn.title = t.crtTooltip;
  crtBtn.textContent = state.isCrt ? t.crtOn : t.crtOff;
  fullscreenBtn.title = t.fullscreenTooltip;
  fullscreenBtn.textContent = state.isFullscreen ? t.fullscreenOff : t.fullscreenOn;
  if (fullscreenExitBtn) {
    fullscreenExitBtn.textContent = t.fullscreenExit || (state.currentLang === "en" ? "🗗 EXIT (F)" : "🗗 ÇIKIŞ (F)");
  }
  testDropBtn.title = t.testDropTooltip;
  testDropBtn.textContent = t.testDrop;
  testClearBtn.title = t.testClearTooltip;
  testClearBtn.textContent = t.testClear;
  themeBtn.textContent = t.themeNames[state.currentTheme] || THEMES[state.currentTheme].name;

  // Başlıklar & Bilgi Yazıları
  wellHeaderHoursEl.textContent = t.hoursTitle;
  wellHeaderMinutesEl.textContent = t.minutesTitle;
  legendHoursTitleEl.textContent = t.hoursTitle;
  legendHoursDescEl.textContent = t.hoursLegend;
  legendMinsTitleEl.textContent = t.minutesTitle;
  legendMinsDescEl.textContent = t.minutesLegend;

  // Sıradaki Parça Kutusu
  nextTitleEl.textContent = t.nextTitle;

  // Sol Alt Sabit Buton
  infoBtnTextEl.textContent = t.infoBtn;
  infoBtn.title = t.infoBtnTooltip;

  // Info Modal Kartları
  modalTitleEl.textContent = t.modalTitle;
  guideHoursTitleEl.textContent = t.guideHoursTitle;
  guideHoursDescEl.innerHTML = t.guideHoursDesc;
  guideMinsTitleEl.textContent = t.guideMinsTitle;
  guideMinsDescEl.innerHTML = t.guideMinsDesc;
  guideDropTitleEl.textContent = t.guideDropTitle;
  guideDropDescEl.innerHTML = t.guideDropDesc;
  guideClearTitleEl.textContent = t.guideClearTitle;
  guideClearDescEl.innerHTML = t.guideClearDesc;

  // Demo Başlıkları
  demoTitleEl.textContent = t.demoTitle;
  demoHourLabelEl.textContent = t.demoHourLabel;
  demoMinLabelEl.textContent = t.demoMinuteLabel;

  updateUI();
}

// 8. GRID ELEMANLARINI OLUŞTURMA
function initializeGrids() {
  hoursGridEl.innerHTML = "";
  minutesGridEl.innerHTML = "";
  nextGridEl.innerHTML = "";
  demoHoursGridEl.innerHTML = "";
  demoMinutesGridEl.innerHTML = "";

  hourCells.length = 0;
  minuteCells.length = 0;
  nextCells.length = 0;
  demoHourCells.length = 0;
  demoMinuteCells.length = 0;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cellH = document.createElement("div");
      cellH.className = "cell";
      hoursGridEl.appendChild(cellH);
      hourCells.push(cellH);

      const cellM = document.createElement("div");
      cellM.className = "cell";
      minutesGridEl.appendChild(cellM);
      minuteCells.push(cellM);

      const dCellH = document.createElement("div");
      dCellH.className = "demo-cell";
      demoHoursGridEl.appendChild(dCellH);
      demoHourCells.push(dCellH);

      const dCellM = document.createElement("div");
      dCellM.className = "demo-cell";
      demoMinutesGridEl.appendChild(dCellM);
      demoMinuteCells.push(dCellM);
    }
  }

  for (let r = 0; r < PREVIEW_ROWS; r++) {
    for (let c = 0; c < PREVIEW_COLS; c++) {
      const cellN = document.createElement("div");
      cellN.className = "next-cell";
      nextGridEl.appendChild(cellN);
      nextCells.push(cellN);
    }
  }
}

// 9. GRID BOYAMA VE DÜŞÜŞ MEKANİĞİ
function renderHoursGrid(shapesCount) {
  hourCells.forEach(cell => {
    cell.className = "cell";
    cell.style.backgroundColor = "";
  });

  if (shapesCount <= 0) return;

  const { placements } = packShapes(shapesCount, HOURS_SEQ, GRID_ROWS, GRID_COLS);
  placements.forEach(p => {
    const color = getShapeColor(p.shape);
    p.shape.blocks.forEach(([br, bc]) => {
      const r = p.row + br;
      const c = p.col + bc;
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        const cell = hourCells[r * GRID_COLS + c];
        cell.className = "cell filled";
        cell.style.backgroundColor = color;
      }
    });
  });
}

function renderMinutesGrid(minutes, seconds) {
  if (state.isAnimatingClear) return;

  minuteCells.forEach(cell => {
    cell.className = "cell";
    cell.style.backgroundColor = "";
  });

  const flow = getMinuteFlowState(minutes);
  const { placements, grid } = packShapes(flow.placedCount, MINS_SEQ, GRID_ROWS, GRID_COLS);
  const grayColor = getThemeColor("gray");

  // 1. Tahtaya oturmuş şekilleri boya
  placements.forEach((p, idx) => {
    const isCurrentlyFilling = (idx === flow.activeIndex);
    const activeColor = getShapeColor(p.shape);

    p.shape.blocks.forEach(([br, bc], blockIdx) => {
      const r = p.row + br;
      const c = p.col + bc;
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        const cell = minuteCells[r * GRID_COLS + c];
        cell.className = "cell filled";
        // Aktif şekil doluyorsa dolu blokları renkli, kalanları gri yap
        // Önceki tamamlanmış şekiller ise tamamen renkli
        const isColored = !isCurrentlyFilling || blockIdx < flow.filledCount;
        cell.style.backgroundColor = isColored ? activeColor : grayColor;
      }
    });
  });

  // 2. DÜŞÜŞ MEKANİĞİ (SADECE 4, 9, 14, 19 GİBİ SON DAKİKALARDA VEYA TESTTE)
  const shouldAnimateDrop = (flow.isFalling && state.isLive) || state.isTestingDrop;

  if (shouldAnimateDrop) {
    const incomingShape = SHAPES[flow.incomingShapeIdx];
    const targetCol = findBestCol(incomingShape, grid, GRID_ROWS, GRID_COLS);
    const targetRow = getDropRow(incomingShape, grid, targetCol, GRID_ROWS, GRID_COLS);

    if (targetRow !== null && incomingShape) {
      // 2.a) Hedef iniş yeri (Ghost Outline)
      incomingShape.blocks.forEach(([br, bc]) => {
        const gr = targetRow + br;
        const gc = targetCol + bc;
        if (gr >= 0 && gr < GRID_ROWS && gc >= 0 && gc < GRID_COLS) {
          const cell = minuteCells[gr * GRID_COLS + gc];
          if (!cell.classList.contains("filled")) {
            cell.classList.add("ghost");
          }
        }
      });

      // 2.b) Şu anki düşüş satırı
      let fallingRow = 0;
      if (state.isTestingDrop) {
        fallingRow = state.testDropRow;
      } else {
        const progress = Math.min(seconds / 59, 1);
        fallingRow = Math.min(targetRow, Math.floor(progress * targetRow));
      }

      if (state.previousFallingRow !== null && fallingRow !== state.previousFallingRow) {
        audio.playTick();
      }
      state.previousFallingRow = fallingRow;

      // 2.c) Düşen parçayı çiz (Kullanıcı isteği: parça renksiz/boş blok olarak iner, yerine kilitlenince ilk karesi dolar)
      incomingShape.blocks.forEach(([br, bc]) => {
        const fr = fallingRow + br;
        const fc = targetCol + bc;
        if (fr >= 0 && fr < GRID_ROWS && fc >= 0 && fc < GRID_COLS) {
          const cell = minuteCells[fr * GRID_COLS + fc];
          cell.className = "cell filled falling uncolored-falling";
          cell.style.backgroundColor = grayColor;
        }
      });

      const t = I18N[state.currentLang] || I18N.tr;
      dropStatusBadgeEl.textContent = t.statusFalling(fallingRow, targetRow);
      dropStatusBadgeEl.className = "status-badge falling-active";
      return;
    }
  }

  const t = I18N[state.currentLang] || I18N.tr;
  state.previousFallingRow = null;
  dropStatusBadgeEl.textContent = t.statusWaiting;
  dropStatusBadgeEl.className = "status-badge";
}

function renderNextPreview(minutes, seconds) {
  nextCells.forEach(cell => {
    cell.className = "next-cell";
    cell.style.backgroundColor = "transparent";
    cell.style.border = "none";
    cell.style.opacity = "0";
  });

  const flow = getMinuteFlowState(minutes);
  const targetShape = SHAPES[flow.previewShapeIdx];

  if (!targetShape || !targetShape.blocks) return;

  const rowCoords = targetShape.blocks.map(b => b[0]);
  const colCoords = targetShape.blocks.map(b => b[1]);
  const minR = Math.min(...rowCoords);
  const minC = Math.min(...colCoords);
  const shapeH = Math.max(...rowCoords) - minR + 1;
  const shapeW = Math.max(...colCoords) - minC + 1;

  const offsetR = Math.floor((PREVIEW_ROWS - shapeH) / 2);
  const offsetC = Math.floor((PREVIEW_COLS - shapeW) / 2);

  const shapeColor = getShapeColor(targetShape);
  const activeColoredCount = flow.previewColoredCount;

  for (let r = 0; r < PREVIEW_ROWS; r++) {
    for (let c = 0; c < PREVIEW_COLS; c++) {
      const blockIdx = targetShape.blocks.findIndex(
        ([br, bc]) => br - minR + offsetR === r && bc - minC + offsetC === c
      );
      const isPart = blockIdx !== -1;
      const isFilled = isPart && blockIdx < activeColoredCount;
      const cell = nextCells[r * PREVIEW_COLS + c];

      if (isPart) {
        cell.className = isFilled ? "next-cell has-block" : "next-cell";
        cell.style.opacity = "1";
        cell.style.border = "1px solid var(--theme-grid-border)";
        cell.style.backgroundColor = isFilled ? shapeColor : "var(--theme-cell-border)";
      }
    }
  }

  const t = I18N[state.currentLang] || I18N.tr;
  const remainingSec = 60 - seconds;
  const secToShow = remainingSec === 60 ? 0 : remainingSec;
  nextCountdownEl.textContent = flow.isFalling ? t.droppingNow : t.nextIn(secToShow);
  nextTitleEl.textContent = t.nextTitle;
}

// 10. DÜŞÜŞ TESTİ ANİMASYONU (🚀 TEST DROP)
function runDropAnimationTest() {
  if (state.isTestingDrop || state.isAnimatingClear) return;
  state.isTestingDrop = true;

  state.minutes = 34;
  const flow = getMinuteFlowState(34);
  const { grid } = packShapes(flow.placedCount, MINS_SEQ, GRID_ROWS, GRID_COLS);

  const incomingShape = SHAPES[flow.incomingShapeIdx];
  const targetCol = findBestCol(incomingShape, grid, GRID_ROWS, GRID_COLS);
  const targetRow = getDropRow(incomingShape, grid, targetCol, GRID_ROWS, GRID_COLS);

  let currentRow = 0;
  state.testDropRow = 0;
  updateUI();

  const dropInterval = setInterval(() => {
    currentRow++;
    state.testDropRow = currentRow;
    audio.playTick();
    updateUI();

    if (currentRow >= targetRow) {
      clearInterval(dropInterval);
      audio.playLock();

      setTimeout(() => {
        state.isTestingDrop = false;
        state.testDropRow = null;
        state.minutes = 35; // 35'e geçtiğinde parça ASLA kaybolmaz, tahtada kalır!
        updateUI();
      }, 800);
    }
  }, 180);
}

// 11. ORİJİNAL NES TETRIS SATIR TEMİZLEME MEKANİĞİ
function triggerHourClearAnimation(callback) {
  if (state.isAnimatingClear) return;
  state.isAnimatingClear = true;

  audio.playLineClear();

  const activeCells = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = minuteCells[r * GRID_COLS + c];
      if (cell.classList.contains("filled")) {
        activeCells.push({ r, c, cell, color: cell.style.backgroundColor });
      }
    }
  }

  if (activeCells.length === 0) {
    state.isAnimatingClear = false;
    if (callback) callback();
    return;
  }

  let flashStep = 0;
  const strobeInterval = setInterval(() => {
    flashStep++;
    const isWhite = flashStep % 2 === 1;

    activeCells.forEach(({ cell, color }) => {
      cell.style.backgroundColor = isWhite ? "#ffffff" : color;
      if (isWhite) {
        cell.style.boxShadow = "none";
      } else {
        cell.style.boxShadow = "";
      }
    });

    if (flashStep >= 6) {
      clearInterval(strobeInterval);

      const colPairs = [
        [4, 5],
        [3, 6],
        [2, 7],
        [1, 8],
        [0, 9]
      ];

      colPairs.forEach((pair, stepIdx) => {
        setTimeout(() => {
          activeCells.forEach(({ c, cell }) => {
            if (pair.includes(c)) {
              cell.className = "cell";
              cell.style.backgroundColor = "";
              cell.style.boxShadow = "";
            }
          });

          if (stepIdx === colPairs.length - 1) {
            setTimeout(() => {
              state.isAnimatingClear = false;
              if (callback) callback();
              renderMinutesGrid(state.minutes, state.seconds);
              updateHoursDisplay();
            }, 80);
          }
        }, stepIdx * 50);
      });
    }
  }, 60);
}

// 12. TEMA YÖNETİMİ
function applyTheme(themeKey) {
  state.currentTheme = themeKey;
  localStorage.setItem("tetris_clock_theme", themeKey);

  document.body.classList.remove("theme-gameboy", "theme-cyberpunk", "theme-matrix");
  const themeObj = THEMES[themeKey];
  if (themeObj && themeObj.bodyClass) {
    document.body.classList.add(themeObj.bodyClass);
  }

  const t = I18N[state.currentLang] || I18N.tr;
  themeBtn.textContent = t.themeNames[themeKey] || (themeObj ? themeObj.name : "🎨 CLASSIC");
  updateUI();
  renderDemoGrid(parseInt(demoHourSlider.value), parseInt(demoMinuteSlider.value));
}

function cycleTheme() {
  const currentIdx = THEME_KEYS.indexOf(state.currentTheme);
  const nextIdx = (currentIdx + 1) % THEME_KEYS.length;
  applyTheme(THEME_KEYS[nextIdx]);
}

// 12.b CRT VE TAM EKRAN (FULLSCREEN) YÖNETİMİ
function applyCrt(enabled) {
  state.isCrt = !!enabled;
  localStorage.setItem("tetris_clock_crt", state.isCrt ? "true" : "false");
  document.body.classList.toggle("crt-mode", state.isCrt);
  crtBtn.classList.toggle("active", state.isCrt);
  const t = I18N[state.currentLang] || I18N.tr;
  crtBtn.textContent = state.isCrt ? t.crtOn : t.crtOff;
}

function toggleCrt() {
  applyCrt(!state.isCrt);
}

function isCurrentlyFullscreen() {
  const nativeFs = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
  return nativeFs || (state && state.isFullscreen);
}

function applyFullscreenState(active) {
  state.isFullscreen = !!active;
  document.body.classList.toggle("fullscreen-active", state.isFullscreen);
  fullscreenBtn.classList.toggle("active", state.isFullscreen);
  const t = I18N[state.currentLang] || I18N.tr;
  fullscreenBtn.textContent = state.isFullscreen ? t.fullscreenOff : t.fullscreenOn;
  fullscreenBtn.title = t.fullscreenTooltip;
  if (fullscreenExitBtn) {
    fullscreenExitBtn.textContent = t.fullscreenExit || (state.currentLang === "en" ? "🗗 EXIT (F)" : "🗗 ÇIKIŞ (F)");
  }

  if (state.isFullscreen) {
    window.scrollTo(0, 0);
  }
}

function updateFullscreenButtonState() {
  const nativeFs = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );

  if (!nativeFs && !state.isAppFullscreenFallback) {
    applyFullscreenState(false);
  } else if (nativeFs) {
    applyFullscreenState(true);
  }
}
function toggleFullscreen() {
  const currentlyOn = state.isFullscreen;

  if (!currentlyOn) {
    const docEl = document.documentElement;

    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().then(() => {
        state.isAppFullscreenFallback = false;
      }).catch(() => {
        state.isAppFullscreenFallback = true;
      });
    } else if (docEl.webkitRequestFullscreen) {
      try {
        docEl.webkitRequestFullscreen();
        state.isAppFullscreenFallback = false;
      } catch (err) {
        state.isAppFullscreenFallback = true;
      }
    } else {
      state.isAppFullscreenFallback = true;
    }

    applyFullscreenState(true);
  } else {
    state.isAppFullscreenFallback = false;
    applyFullscreenState(false);

    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      try {
        document.webkitExitFullscreen();
      } catch (err) {}
    }
  }
}

// 13. SAAT DÜZENİ HESAPLAMA
function getEffectiveHourData() {
  const isPM = state.rawHours >= 12;
  const h12 = state.rawHours % 12 || 12;

  let gridShapes;
  if (state.is24Hour) {
    if (state.rawHours === 0) gridShapes = 0;
    else if (state.rawHours <= 12) gridShapes = state.rawHours;
    else gridShapes = state.rawHours % 12;
  } else {
    gridShapes = h12;
  }

  return { isPM, h12, gridShapes };
}

function updateHoursDisplay() {
  const { gridShapes } = getEffectiveHourData();
  renderHoursGrid(gridShapes);
}

// 14. EKRAN GÜNCELLEME (RENDER)
function updateUI() {
  const { isPM, h12, gridShapes } = getEffectiveHourData();
  state.isPM = isPM;

  const mPad = String(state.minutes).padStart(2, "0");

  if (state.is24Hour) {
    const hPad = String(state.rawHours).padStart(2, "0");
    timeDigitsEl.textContent = `${hPad}:${mPad}`;
    timeAmpmBadgeEl.textContent = "24H";

    format12Btn.classList.remove("active");
    format24Btn.classList.add("active");
  } else {
    const hPad = String(h12).padStart(2, "0");
    timeDigitsEl.textContent = `${hPad}:${mPad}`;
    timeAmpmBadgeEl.textContent = isPM ? "PM" : "AM";

    format12Btn.classList.add("active");
    format24Btn.classList.remove("active");
  }

  const t = I18N[state.currentLang] || I18N.tr;
  soundBtn.textContent = audio.enabled ? t.soundOn : t.soundOff;
  soundBtn.classList.toggle("muted", !audio.enabled);

  document.body.classList.toggle("pm", isPM);

  renderHoursGrid(gridShapes);
  renderMinutesGrid(state.minutes, state.seconds);
  renderNextPreview(state.minutes, state.seconds);
}

// 15. İNTERAKTİF DEMO MODAL IZGARA BOYAMA (SANDBOX)
function renderDemoGrid(hours, minutes, fallingState = null) {
  demoHourCells.forEach(cell => {
    cell.className = "demo-cell";
    cell.style.backgroundColor = "";
  });
  demoMinuteCells.forEach(cell => {
    cell.className = "demo-cell";
    cell.style.backgroundColor = "";
  });

  const hShapes = hours % 12 || 12;
  const { placements: hPlacements } = packShapes(hShapes, HOURS_SEQ, GRID_ROWS, GRID_COLS);
  hPlacements.forEach(p => {
    const color = getShapeColor(p.shape);
    p.shape.blocks.forEach(([br, bc]) => {
      const r = p.row + br;
      const c = p.col + bc;
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        const cell = demoHourCells[r * GRID_COLS + c];
        cell.className = "demo-cell filled";
        cell.style.backgroundColor = color;
      }
    });
  });

  const flow = getMinuteFlowState(minutes);
  const { placements: mPlacements } = packShapes(flow.placedCount, MINS_SEQ, GRID_ROWS, GRID_COLS);
  const grayColor = getThemeColor("gray");

  mPlacements.forEach((p, idx) => {
    const isCurrentlyFilling = (idx === flow.activeIndex);
    const activeColor = getShapeColor(p.shape);

    p.shape.blocks.forEach(([br, bc], blockIdx) => {
      const r = p.row + br;
      const c = p.col + bc;
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        const cell = demoMinuteCells[r * GRID_COLS + c];
        cell.className = "demo-cell filled";
        const isColored = !isCurrentlyFilling || blockIdx < flow.filledCount;
        cell.style.backgroundColor = isColored ? activeColor : grayColor;
      }
    });
  });

  const hStr = String(hours).padStart(2, "0");
  const mStr = String(minutes).padStart(2, "0");
  demoTimeTextEl.textContent = `${hStr}:${mStr} PM`;
  demoHourValEl.textContent = hours;
  demoMinuteValEl.textContent = minutes;

  // Eğer düşüş animasyonu verildiyse parçayı ve ghost outline'ı demo tahtasına çiz
  if (fallingState && fallingState.incomingShape) {
    const { incomingShape, targetCol, targetRow, fallingRow } = fallingState;

    // Hedef iniş yeri (Ghost outline)
    incomingShape.blocks.forEach(([br, bc]) => {
      const gr = targetRow + br;
      const gc = targetCol + bc;
      if (gr >= 0 && gr < GRID_ROWS && gc >= 0 && gc < GRID_COLS) {
        const cell = demoMinuteCells[gr * GRID_COLS + gc];
        if (!cell.classList.contains("filled")) {
          cell.classList.add("ghost");
        }
      }
    });

    // Düşen parça (Renksiz/boş blok olarak iner, yerine oturunca ilk karesi dolar)
    incomingShape.blocks.forEach(([br, bc]) => {
      const fr = fallingRow + br;
      const fc = targetCol + bc;
      if (fr >= 0 && fr < GRID_ROWS && fc >= 0 && fc < GRID_COLS) {
        const cell = demoMinuteCells[fr * GRID_COLS + fc];
        cell.className = "demo-cell filled uncolored-falling";
        cell.style.backgroundColor = grayColor;
      }
    });
  }
}

// 15.b İNTERAKTİF DEMO ANİMASYONLARI (MODAL İÇİNDEN TEST ETME)
let isDemoAnimating = false;

function runDemoDropAnimation() {
  if (isDemoAnimating) return;
  isDemoAnimating = true;

  const hours = parseInt(demoHourSlider.value) || 7;
  demoMinuteSlider.value = 34;
  demoMinuteValEl.textContent = "34";

  const flow = getMinuteFlowState(34);
  const { grid } = packShapes(flow.placedCount, MINS_SEQ, GRID_ROWS, GRID_COLS);
  const incomingShape = SHAPES[flow.incomingShapeIdx];
  const targetCol = findBestCol(incomingShape, grid, GRID_ROWS, GRID_COLS);
  const targetRow = getDropRow(incomingShape, grid, targetCol, GRID_ROWS, GRID_COLS);

  let fallingRow = 0;
  renderDemoGrid(hours, 34, { incomingShape, targetCol, targetRow, fallingRow });
  audio.playTick();

  const dropInterval = setInterval(() => {
    fallingRow++;
    audio.playTick();
    renderDemoGrid(hours, 34, { incomingShape, targetCol, targetRow, fallingRow });

    if (fallingRow >= targetRow) {
      clearInterval(dropInterval);
      audio.playLock();

      setTimeout(() => {
        demoMinuteSlider.value = 35;
        demoMinuteValEl.textContent = "35";
        renderDemoGrid(hours, 35);
        isDemoAnimating = false;
      }, 700);
    }
  }, 180);
}

function runDemoClearAnimation() {
  if (isDemoAnimating) return;
  isDemoAnimating = true;

  const hours = parseInt(demoHourSlider.value) || 7;
  demoMinuteSlider.value = 59;
  demoMinuteValEl.textContent = "59";
  renderDemoGrid(hours, 59);

  audio.playLineClear();

  const activeCells = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = demoMinuteCells[r * GRID_COLS + c];
      if (cell.classList.contains("filled")) {
        activeCells.push({ r, c, cell, color: cell.style.backgroundColor });
      }
    }
  }

  let flashStep = 0;
  const strobeInterval = setInterval(() => {
    flashStep++;
    const isWhite = flashStep % 2 === 1;

    activeCells.forEach(({ cell, color }) => {
      cell.style.backgroundColor = isWhite ? "#ffffff" : color;
    });

    if (flashStep >= 6) {
      clearInterval(strobeInterval);

      const colPairs = [
        [4, 5],
        [3, 6],
        [2, 7],
        [1, 8],
        [0, 9]
      ];

      colPairs.forEach((pair, stepIdx) => {
        setTimeout(() => {
          activeCells.forEach(({ c, cell }) => {
            if (pair.includes(c)) {
              cell.className = "demo-cell";
              cell.style.backgroundColor = "";
            }
          });

          if (stepIdx === colPairs.length - 1) {
            setTimeout(() => {
              const nextHour = (hours % 12) + 1;
              demoHourSlider.value = nextHour;
              demoHourValEl.textContent = nextHour;
              demoMinuteSlider.value = 0;
              demoMinuteValEl.textContent = "0";
              renderDemoGrid(nextHour, 0);
              isDemoAnimating = false;
            }, 100);
          }
        }, stepIdx * 50);
      });
    }
  }, 60);
}

// 16. DÜZENLİ SAYAÇ (TICK)
function tick() {
  const sys = getSystemTime();
  state.seconds = sys.seconds;

  if (state.isLive && !state.isTestingDrop) {
    if (state.previousHour !== null && sys.rawHours !== state.previousHour) {
      triggerHourClearAnimation(() => {
        state.rawHours = sys.rawHours;
        state.minutes = sys.minutes;
        state.previousHour = sys.rawHours;
        state.previousMinute = sys.minutes;
        updateUI();
      });
      return;
    }

    if (state.previousMinute !== null && sys.minutes !== state.previousMinute) {
      if (sys.minutes % 5 === 0 && sys.minutes > 0) {
        audio.playLock();
      } else {
        audio.playTick();
      }
    }

    state.rawHours = sys.rawHours;
    state.minutes = sys.minutes;
    state.previousHour = sys.rawHours;
    state.previousMinute = sys.minutes;
  }

  updateUI();
}

// 17. OLAY DİNLEYİCİLERİ (EVENT LISTENERS)
format12Btn.addEventListener("click", () => {
  state.is24Hour = false;
  localStorage.setItem("tetris_clock_format", "12");
  audio.playTick();
  updateUI();
});

format24Btn.addEventListener("click", () => {
  state.is24Hour = true;
  localStorage.setItem("tetris_clock_format", "24");
  audio.playTick();
  updateUI();
});

langTrBtn.addEventListener("click", () => {
  audio.playTick();
  setLanguage("tr");
});

langEnBtn.addEventListener("click", () => {
  audio.playTick();
  setLanguage("en");
});

soundBtn.addEventListener("click", () => {
  const isEnabled = audio.toggle();
  const t = I18N[state.currentLang] || I18N.tr;
  soundBtn.textContent = isEnabled ? t.soundOn : t.soundOff;
  soundBtn.classList.toggle("muted", !isEnabled);
});

themeBtn.addEventListener("click", () => {
  audio.playTick();
  cycleTheme();
});

crtBtn.addEventListener("click", () => {
  audio.playTick();
  toggleCrt();
});

fullscreenBtn.addEventListener("click", () => {
  audio.playTick();
  toggleFullscreen();
});

if (fullscreenExitBtn) {
  fullscreenExitBtn.addEventListener("click", () => {
    audio.playTick();
    toggleFullscreen();
  });
}

// Tam ekranda fare hareketi veya dokunulduğunda çıkış butonunu kısa süreliğine göster
let mouseTimer = null;
function handleFullscreenMouseMove() {
  if (!state.isFullscreen) return;
  document.body.classList.add("mouse-active");
  clearTimeout(mouseTimer);
  mouseTimer = setTimeout(() => {
    document.body.classList.remove("mouse-active");
  }, 2500);
}
document.addEventListener("mousemove", handleFullscreenMouseMove);
document.addEventListener("touchstart", handleFullscreenMouseMove, { passive: true });
document.addEventListener("pointerdown", handleFullscreenMouseMove, { passive: true });

document.addEventListener("fullscreenchange", updateFullscreenButtonState);
document.addEventListener("webkitfullscreenchange", updateFullscreenButtonState);

// Klavyeden Hızlı Kısayol Tuşları: F=Fullscreen, C=CRT, T=Theme, S=Sound, Space=Test Drop
document.addEventListener("keydown", e => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

  const key = e.key.toLowerCase();
  if (key === "f") {
    e.preventDefault();
    audio.playTick();
    toggleFullscreen();
  } else if (key === "c") {
    e.preventDefault();
    audio.playTick();
    toggleCrt();
  } else if (key === "t") {
    e.preventDefault();
    audio.playTick();
    cycleTheme();
  } else if (key === "s") {
    e.preventDefault();
    const isEnabled = audio.toggle();
    const t = I18N[state.currentLang] || I18N.tr;
    soundBtn.textContent = isEnabled ? t.soundOn : t.soundOff;
    soundBtn.classList.toggle("muted", !isEnabled);
  } else if (key === " " || key === "spacebar") {
    e.preventDefault();
    if (infoModalEl.classList.contains("open")) {
      runDemoDropAnimation();
    } else {
      runDropAnimationTest();
    }
  }
});

testDropBtn.addEventListener("click", () => {
  if (infoModalEl.classList.contains("open")) {
    runDemoDropAnimation();
  } else {
    runDropAnimationTest();
  }
});

testClearBtn.addEventListener("click", () => {
  if (infoModalEl.classList.contains("open")) {
    runDemoClearAnimation();
  } else {
    state.minutes = 59;
    renderMinutesGrid(59, 0);
    setTimeout(() => {
      triggerHourClearAnimation(() => {
        state.minutes = 0;
        state.rawHours = (state.rawHours + 1) % 24;
        updateUI();
      });
    }, 200);
  }
});

toggleTimeBtn.addEventListener("click", () => {
  state.showTimeDigits = !state.showTimeDigits;
  audio.playTick();
  timeDisplayEl.classList.toggle("hidden", !state.showTimeDigits);
});

// Sol alt köşedeki info butonu
infoBtn.addEventListener("click", () => {
  audio.playTick();
  infoModalEl.classList.add("open");
  renderDemoGrid(parseInt(demoHourSlider.value), parseInt(demoMinuteSlider.value));
});

infoCloseBtn.addEventListener("click", () => {
  audio.playTick();
  infoModalEl.classList.remove("open");
});

infoModalEl.addEventListener("click", e => {
  if (e.target === infoModalEl) {
    infoModalEl.classList.remove("open");
  }
});

demoHourSlider.addEventListener("input", e => {
  audio.playTick();
  renderDemoGrid(parseInt(e.target.value), parseInt(demoMinuteSlider.value));
});

demoMinuteSlider.addEventListener("input", e => {
  audio.playTick();
  renderDemoGrid(parseInt(demoHourSlider.value), parseInt(e.target.value));
});

// BAŞLAT
initializeGrids();
applyTheme(state.currentTheme);
applyCrt(state.isCrt);
updateFullscreenButtonState();
setLanguage(state.currentLang);
state.previousHour = state.rawHours;
state.previousMinute = state.minutes;
updateUI();
setInterval(tick, 1000);
