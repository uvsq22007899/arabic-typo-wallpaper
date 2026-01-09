let arabicText = "";

let latinInputElt;
let tintPickerElt;
let sizeSliderElt;
let downloadBtnElt;

let bgImage = null;
let tintCss = "hsl(220, 65%, 40%)";

// Taille texte (multiplicateur basé sur min(width,height))
let sizeMul = 0.12;

// Position texte
let textX = null;
let textY = null;

// Drag
let isDragging = false;
let dragOffX = 0;
let dragOffY = 0;

// Hover cursor + UI
let isHoveringText = false;

// Hint (texte d’aide)
let showHint = true;
let hintStartMs = 0;

// Micro-anim d’apparition
let introAnimStartMs = 0;
const INTRO_ANIM_MS = 650;
const INTRO_BOUNCE_PX = 10;
let didFirstDrag = false;

// Export HD (même format écran)
const EXPORT_SCALE = 2;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2);

  textAlign(CENTER, CENTER);
  textFont("sans-serif");

  // Position par défaut (un peu plus bas)
  textX = width / 2;
  textY = height * 0.38;

  // Fond
  loadImage(
    "assets/fond.png",
    img => (bgImage = img),
    err => console.warn("Fond non chargé :", err)
  );

  // UI
  latinInputElt = select("#latinInput");
  tintPickerElt = select("#tintPicker");
  sizeSliderElt = select("#sizeSlider");
  downloadBtnElt = select("#downloadBtn");

  // Prénom
  latinInputElt.input(() => {
    const value = latinInputElt.value().toLowerCase();
    arabicText = latinToArabic(value);
    clampTextInsideCanvas();
  });

  // Teinte (hue only)
  tintPickerElt.input(() => {
    const hex = tintPickerElt.value();
    const hsl = hexToHSL(hex);

    const fixedS = 65;
    const fixedL = 40;

    tintCss = `hsl(${Math.round(hsl.h)}, ${fixedS}%, ${fixedL}%)`;
  });

  // Slider taille : 6..20 => 0.06..0.20
  if (sizeSliderElt) {
    sizeMul = Number(sizeSliderElt.value()) / 100;
    sizeSliderElt.input(() => {
      sizeMul = Number(sizeSliderElt.value()) / 100;
      clampTextInsideCanvas();
    });
  }

  // Download
  downloadBtnElt.mousePressed(saveWallpaperHD);

  // UX timers
  hintStartMs = millis();
  introAnimStartMs = millis();
}

function draw() {
  // 1) Fond cover
  if (bgImage) {
    drawCover(this, bgImage, 0, 0, width, height);
  } else {
    background(0);
  }

  // 2) Teinte hue
  drawingContext.save();
  drawingContext.globalCompositeOperation = "hue";
  drawingContext.fillStyle = tintCss;
  drawingContext.fillRect(0, 0, width, height);
  drawingContext.restore();

  // 3) Texte info
  fill(255);
  textSize(18);

  // 4) Texte arabe (draggable)
  const toDisplay = arabicText || "اكتب اسمك";
  const pxSize = min(width, height) * sizeMul;

  // Hover bounds + cursor
  const b = getTextBounds(toDisplay, textX, textY, pxSize);
  isHoveringText =
    mouseX >= b.x && mouseX <= b.x + b.w &&
    mouseY >= b.y && mouseY <= b.y + b.h;

  if (isDragging) cursor("grabbing");
  else if (isHoveringText) cursor("pointer");
  else cursor("default");

  // Outline + icône move (hover/drag)
  if (isHoveringText || isDragging) {
    noFill();
    stroke(255, 255, 255, isDragging ? 110 : 70);
    strokeWeight(2);

    const pad = 14;
    rect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, 14);

    noStroke();
    fill(255, 255, 255, isDragging ? 180 : 120);
    textSize(14);
    text("↕︎↔︎", b.x + b.w + 18, b.y - 10);
  }

  // Micro-bounce au début (si pas encore drag)
  let animY = 0;
  if (!didFirstDrag) {
    const t = (millis() - introAnimStartMs) / INTRO_ANIM_MS;
    if (t < 1) animY = -Math.sin(t * Math.PI) * INTRO_BOUNCE_PX;
  }

  // Dessin texte + glow
  drawingContext.save();
  drawingContext.direction = "rtl";
  drawingContext.shadowColor = "rgba(255, 230, 230, 0.7)";
  drawingContext.shadowBlur = 25;

  fill(255, 230, 230);
  textSize(pxSize);
  text(toDisplay, textX, textY + animY);

  drawingContext.restore();

  // Hint (disparaît après 3s ou au 1er drag)
  if (showHint && !didFirstDrag) {
    const elapsed = millis() - hintStartMs;
    if (elapsed > 3000) showHint = false;

    const alpha = elapsed < 2500 ? 180 : map(elapsed, 2500, 3000, 180, 0);

    noStroke();
    fill(0, 0, 0, alpha * 0.45);
    rect(width / 2 - 190, height * 0.62 - 22, 380, 44, 999);

    fill(255, 255, 255, alpha);
    textSize(14);
    text("Clique & glisse le prénom pour le déplacer", width / 2, height * 0.62);
  }
}

/* ---------------------------
   Drag & Drop + limites
--------------------------- */
function mousePressed() {
  const toDisplay = arabicText || "اكتب اسمك";
  const pxSize = min(width, height) * sizeMul;
  const b = getTextBounds(toDisplay, textX, textY, pxSize);

  if (
    mouseX >= b.x && mouseX <= b.x + b.w &&
    mouseY >= b.y && mouseY <= b.y + b.h
  ) {
    isDragging = true;
    dragOffX = mouseX - textX;
    dragOffY = mouseY - textY;
    showHint = false;
  }
}

function mouseDragged() {
  if (!isDragging) return;

  didFirstDrag = true;

  textX = mouseX - dragOffX;
  textY = mouseY - dragOffY;

  clampTextInsideCanvas();
}

function mouseReleased() {
  isDragging = false;
}

function mouseOut() {
  cursor("default");
}

function windowResized() {
  const rx = textX / width;
  const ry = textY / height;

  resizeCanvas(windowWidth, windowHeight);

  textX = rx * width;
  textY = ry * height;

  clampTextInsideCanvas();
}

/* ---------------------------
   Clamp dans les bords
--------------------------- */
function clampTextInsideCanvas() {
  const toDisplay = arabicText || "اكتب اسمk";
  const pxSize = min(width, height) * sizeMul;

  const margin = 24;
  const b = getTextBounds(toDisplay, textX, textY, pxSize);

  const halfW = b.w / 2;
  const halfH = b.h / 2;

  textX = constrain(textX, margin + halfW, width - margin - halfW);
  textY = constrain(textY, margin + halfH, height - margin - halfH);
}

/* ---------------------------
   Bounds texte (approx)
--------------------------- */
function getTextBounds(str, cx, cy, pxSize) {
  push();
  textSize(pxSize);
  const w = textWidth(str);
  const a = textAscent();
  const d = textDescent();
  pop();

  return {
    x: cx - w / 2,
    y: cy - (a + d) / 2,
    w: w,
    h: (a + d)
  };
}

/* ---------------------------
   Fond cover (CSS cover)
--------------------------- */
function drawCover(g, img, x, y, w, h) {
  const iw = img.width;
  const ih = img.height;

  const scale = Math.max(w / iw, h / ih);
  const nw = iw * scale;
  const nh = ih * scale;

  const nx = x + (w - nw) / 2;
  const ny = y + (h - nh) / 2;

  g.image(img, nx, ny, nw, nh);
}

/* ---------------------------
   Export HD : même format écran
--------------------------- */
function saveWallpaperHD() {
  if (!bgImage) {
    console.warn("Fond pas encore chargé");
    return;
  }

  const W = Math.round(width * EXPORT_SCALE);
  const H = Math.round(height * EXPORT_SCALE);

  const pg = createGraphics(W, H);
  pg.pixelDensity(1);

  const rx = textX / width;
  const ry = textY / height;
  const exportX = rx * W;
  const exportY = ry * H;

  // Fond cover
  drawCover(pg, bgImage, 0, 0, W, H);

  // Teinte hue
  pg.drawingContext.save();
  pg.drawingContext.globalCompositeOperation = "hue";
  pg.drawingContext.fillStyle = tintCss;
  pg.drawingContext.fillRect(0, 0, W, H);
  pg.drawingContext.restore();

  // Texte info
  pg.textAlign(CENTER, CENTER);
  pg.textFont("sans-serif");
  pg.fill(255);
  pg.textSize(18 * EXPORT_SCALE);
  pg.text(infoText, W / 2, 30 * EXPORT_SCALE);

  // Texte arabe
  const toDisplay = arabicText || "اكتب اسمك";
  const pxSize = Math.min(W, H) * sizeMul;

  pg.drawingContext.save();
  pg.drawingContext.direction = "rtl";
  pg.drawingContext.shadowColor = "rgba(255, 230, 230, 0.7)";
  pg.drawingContext.shadowBlur = 25 * EXPORT_SCALE;

  pg.fill(255, 230, 230);
  pg.textSize(pxSize);
  pg.text(toDisplay, exportX, exportY);

  pg.drawingContext.restore();

  pg.save("fond-arabe.png");
  pg.remove();
}

/* --------------------------------------------------
   Conversion LATIN → ARABE
-------------------------------------------------- */
function latinToArabic(str) {
  const combos = {
    kh: "خ", ch: "ش", sh: "ش", gh: "غ",
    th: "ث", dh: "ذ", ou: "و", oo: "و", aa: "ا"
  };

  const map = {
    a: "ا", b: "ب", c: "ك", d: "د", e: "ي",
    f: "ف", g: "ج", h: "ه", i: "ي", j: "ج",
    k: "ك", l: "ل", m: "م", n: "ن", o: "و",
    p: "ب", q: "ق", r: "ر", s: "س", t: "ت",
    u: "و", v: "ف", w: "و", x: "كس", y: "ي",
    z: "ز", " ": " "
  };

  let result = "";
  let i = 0;

  while (i < str.length) {
    if (i + 1 < str.length) {
      const two = str[i] + str[i + 1];
      if (combos[two]) {
        result += combos[two];
        i += 2;
        continue;
      }
    }
    result += map[str[i]] || "";
    i++;
  }

  return result;
}

/* --------------------------------------------------
   HEX → HSL (teinte)
-------------------------------------------------- */
function hexToHSL(hex) {
  hex = hex.replace("#", "");

  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  let l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
}
