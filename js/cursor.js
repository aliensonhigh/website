document.addEventListener("DOMContentLoaded", () => {

const cursor = document.getElementById("cursor");
if (!cursor) return;

/* ===== cursor position ===== */

let cx = 0;
let cy = 0;

/* restore saved position if it exists */
const savedX = sessionStorage.getItem("cursorX");
const savedY = sessionStorage.getItem("cursorY");

if (savedX && savedY) {

  cx = parseFloat(savedX);
  cy = parseFloat(savedY);

} else {

  /* start beside the website name in GUI */
  const header = document.querySelector("#gui h3");

  if (header) {
    const rect = header.getBoundingClientRect();
    cx = rect.left + 110;
    cy = rect.top + 2;
  } else {
    cx = window.innerWidth / 2;
    cy = window.innerHeight / 2;
  }

}

const speed = 2;
const scrollMargin = 40;   // distance from screen edge
const scrollSpeed = 8;     // scroll strength
const edgeSlowZone = 120;   // distance from screen edge where slowdown begins
const edgeSlowFactor = 0.35; // minimum speed multiplier near edge

cursor.style.left = cx + "px";
cursor.style.top = cy + "px";

/* movement state */
const keys = {};
let lastDX = 0;
let lastDY = 0;

/* ===== movement loop ===== */

function updateCursor(){

  let dx = 0;
  let dy = 0;

  if(keys["w"] || keys["ArrowUp"]) dy -= speed;
  if(keys["s"] || keys["ArrowDown"]) dy += speed;
  if(keys["a"] || keys["ArrowLeft"]) dx -= speed;
  if(keys["d"] || keys["ArrowRight"]) dx += speed;

  if(dx !== 0 || dy !== 0){

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    /* edge slowdown */

    let slowX = 1;
    let slowY = 1;

    if(cx < edgeSlowZone){
      slowX = Math.max(edgeSlowFactor, cx / edgeSlowZone);
    }

    if(cx > vw - edgeSlowZone){
      slowX = Math.max(edgeSlowFactor, (vw - cx) / edgeSlowZone);
    }

    if(cy < edgeSlowZone){
      slowY = Math.max(edgeSlowFactor, cy / edgeSlowZone);
    }

    if(cy > vh - edgeSlowZone){
      slowY = Math.max(edgeSlowFactor, (vh - cy) / edgeSlowZone);
    }

    /* apply movement */

    cx += dx * slowX;
    cy += dy * slowY;

    /* page scrolling */

    if(cy > vh - scrollMargin){

      cy = vh - scrollMargin;
      window.scrollBy(0, scrollSpeed);

    }

    else if(cy < scrollMargin){

      cy = scrollMargin;
      window.scrollBy(0, -scrollSpeed);

    }

    cursor.style.left = cx + "px";
    cursor.style.top = cy + "px";

    /* save cursor position */

    sessionStorage.setItem("cursorX", cx);
    sessionStorage.setItem("cursorY", cy);

    lastDX = dx;
    lastDY = dy;

    createTrail(dx,dy);
    checkHover();
  }

  requestAnimationFrame(updateCursor);
}

updateCursor();



/* ===== trail ===== */

const trail = [];
const maxTrail = 500;
let lastTrailX = cx;
let lastTrailY = cy;
const trailSpacing = 10; 

function createTrail(dx,dy){

  const dist = Math.hypot(cx - lastTrailX, cy - lastTrailY);

  if(dist < trailSpacing) return;

  lastTrailX = cx;
  lastTrailY = cy;

  const dot = document.createElement("div");
  dot.className = "cursor-trail";

  const centerX = cx + cursor.offsetWidth / 2;
  const centerY = cy + cursor.offsetHeight - 40;

  dot.style.left = centerX + "px";
  dot.style.top = centerY + "px";

  document.body.appendChild(dot);

  trail.push(dot);

  if(trail.length > maxTrail){
    const old = trail.shift();
    old.remove();
  }

}

/* ===== hover detection ===== */

function checkHover(){

  const centerX = cx + cursor.offsetWidth / 2;
  const centerY = cy + cursor.offsetHeight / 2;

  const el = document.elementFromPoint(centerX, centerY);
  if(!el) return;

  const link = el.closest("a, .folder-title, .work-header, .gallery-image, .lightbox-arrow");
  
  document.querySelectorAll(".cursor-hover")
  .forEach(e=>e.classList.remove("cursor-hover"));

  if(link){
    link.classList.add("cursor-hover");
  }

}

/* ===== keyboard input ===== */

document.addEventListener("keydown",e=>{
  keys[e.key] = true;

  if(e.key === "Enter" || e.key === " "){
    e.preventDefault();

    const hovered = document.querySelector(".cursor-hover");
    if(hovered) hovered.click();
  }
});

document.addEventListener("keyup",e=>{
  keys[e.key] = false;
});

});