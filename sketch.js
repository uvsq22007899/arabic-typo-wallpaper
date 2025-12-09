let arabicText = "";
let infoText = "Écris ton prénom :";

let latinInputElt;
let tintPickerElt;
let downloadBtnElt;

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style("z-index", "1");

  textAlign(CENTER, CENTER);
  textFont("sans-serif");

  // Récup les éléments HTML
  latinInputElt = select("#latinInput");
  tintPickerElt = select("#tintPicker");
  downloadBtnElt = select("#downloadBtn");

  // Quand on tape le prénom → convertir arabe
  latinInputElt.input(() => {
    const value = latinInputElt.value().toLowerCase();
    arabicText = latinToArabic(value);
  });

  // Quand on modifie la couleur → HUE uniquement
  tintPickerElt.input(() => {
    const overlay = select("#tintOverlay");

    const hex = tintPickerElt.value();
    const hsl = hexToHSL(hex);

    // seulement la teinte, et on fixe S & L
    const fixedS = 65; // saturation %
    const fixedL = 40; // luminosité %

    const cssColor = `hsl(${Math.round(hsl.h)}, ${fixedS}%, ${fixedL}%)`;

    overlay.style("background", cssColor);
  });

  // Bouton télécharger
  downloadBtnElt.mousePressed(saveWallpaper);
}

function draw() {
  clear(); // important : laisse voir le fond SVG

  fill(255);
  textSize(18);
  text(infoText, width / 2, 30);

  const toDisplay = arabicText || "اكتب اسمك";

  drawingContext.save();
  drawingContext.shadowColor = "rgba(255, 230, 230, 0.7)";
  drawingContext.shadowBlur = 25;

  fill(255, 230, 230);
  textSize(min(width, height) * 0.12);
  text(toDisplay, width / 2, height * 0.28);

  drawingContext.restore();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/* --------------------------------------------------
   Conversion LATIN → ARABE
-------------------------------------------------- */
function latinToArabic(str) {
  const combos = {
    "kh": "خ",
    "ch": "ش",
    "sh": "ش",
    "gh": "غ",
    "th": "ث",
    "dh": "ذ",
    "ou": "و",
    "oo": "و",
    "aa": "ا"
  };

  const map = {
    "a": "ا", "b": "ب", "c": "س", "d": "د", "e": "ي",
    "f": "ف", "g": "ج", "h": "ه", "i": "ي", "j": "ج",
    "k": "ك", "l": "ل", "m": "م", "n": "ن", "o": "و",
    "p": "ب", "q": "ق", "r": "ر", "s": "س", "t": "ت",
    "u": "و", "v": "ف", "w": "و", "x": "كس", "y": "ي",
    "z": "ز", " ": " "
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

    result += map[str[i]] || str[i];
    i++;
  }

  return result;
}

/* --------------------------------------------------
   Convertir HEX → HSL
   (pour garder uniquement la teinte)
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
      case r:
        h = (g - b) / d + (g < b ? 6 : 1);
        break;
      case g:
        h = (b - r) / d + 3;
        break;
      case b:
        h = (r - g) / d + 5;
        break;
    }
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
}

/* --------------------------------------------------
   Sauvegarder le canvas
-------------------------------------------------- */
function saveWallpaper() {
  saveCanvas("fond-arabe", "png");
}
