window.addEventListener("DOMContentLoaded", () => {

  const map = [
    "kkjlllollmllll_____ ___________g_____kkjjllllllollmllllnlolllmnll",
    "mllllnlolllmn______ _C________MikL__kkjjmllllnlolllmnlllllllolllk",
    "_lnllllollolllmnmn_ _Bdfe____YOSOSR_lllmnlolnmlllllonnjk_jlljklll",
    "__lllollmllllnlolllmjSCXe_gWGJITHTHh!!Gg_gGgW!F!F!Gfe__gW_llollol",
    "lnllllollolllmnmnlnk6ABB5LgWgjkkjkkjkkMLe__ gYGgWge_MZSce___Mllnl",
    "mllllnlolllmnlllolllgGkjllmllnmllolllljkLMLGFFGGFGGGg_WGWWCClnm",
    "lllollmllllnlolllmnjMabcdellmlnlomllljkL__zxyzry_zxzy__ CBBBL_l",
    "mllllnlomgglllllolln gWGWg_1 24e__xWMacdaeMLgGFpGfLgWFFRHSPPQLj",
    "ollmllolMOPQLllolnml _Mfe132434a_c_gWGWGFFGFFXqwXWgeeOOPOQEDe_l",
    "mllllnlolllmnlllo__MaZEOPPERSZKTTNPOFFGWgLMe txy_zxzsadeefGWgjl",
    "mllllnlomnllbl_gWGW_EEDGgGGWPPi77i5kjkY#jkj  peffkjkjXXZa1_4lll",
    "lllollmllllnlolllm_ abcdefaSPHH__KRGVKLML qxzw XW gllmI___gGWgL",
    "ollmllolllmnllo____ GGFFFGG_GGFFGGWg  qxyzw_MSQDRPZKThHOGFGWgllm",
    "mllllnlolllmn______ __UW_ zyxyzxyzxxzzwzyxs___gGWDDHOPQcde14lgGlj",
    "mllllmllllnlollollX MZSceXGW gRRcegWMRSSOPp0_1_317i7KJ#XWQPEllOll",
    "mllllmllllnlmlloFFXlllmnlogGF FGWg_16PX_gWvxyzzyrxy____9__gZZLll",
    "mllllnloLGnllbllollmlllolllYbX_MQZllmlojjkg_gGg vxyzs__8__LLlllom",
    "ollmllollllnllolnmlllmnlomlllnMfdlnlllmlk__gWGFFT!FfMQSOPeXWg_kjlll"
  ];

  function randomWaterTile() {
    const weighted = ["l","l","l","l","l","l","m","n","o"];
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  function addWaterBorder(originalMap, thickness = 2) {
    const width = Math.max(...originalMap.map(r => r.length));
    const padded = originalMap.map(row => row.padEnd(width, "l"));

    const topBottom = Array.from({ length: thickness }, () =>
      Array.from({ length: width + thickness * 2 }, randomWaterTile).join("")
    );

    const middle = padded.map(row => {
      const side = Array.from({ length: thickness }, randomWaterTile).join("");
      return side + row + side;
    });

    return [...topBottom, ...middle, ...topBottom];
  }

  const borderedMap = addWaterBorder(map, 50);

  const tileGroups = {
    rocks: ["D","E","H","N","L","M","P","Q","R","T","V","b","c","d","e","f","0","1","2","3","4","7"],
    building: ["A","U","8"],
    buildingTop: ["B","C","i","9","S"],
    grass: ["F","G","W","X","Y","g"],
    water: ["j","k","l","m","n","o"],
    paths: ["p","q","r","s","t","u","v","w","x","y","z"],
    empty: ["_"],
    ground: ["I","6","5","J","K","O","Z","a","h","!","/","#"]
  };

  const tileCategory = {};
  Object.entries(tileGroups).forEach(([group, chars]) => {
    chars.forEach(c => tileCategory[c] = group);
  });

  const groupProperties = {
    rocks:{walkable:true,cover:false},
    building:{walkable:true,cover:false},
    buildingTop:{walkable:true,cover:true},
    grass:{walkable:true,cover:false},
    paths:{walkable:true,cover:false},
    empty:{walkable:true,cover:false},
    ground:{walkable:true,cover:false},
    water:{walkable:false,cover:false}
  };

  const linkTiles = {
    A:{description:"Get a load of this guy!",url:"about.html"},
    U:{description:"The Archaic Libraries",url:"portfolio.html"},
    8:{description:"Wow, the stuff in here is pretty comprehensive. I wouldn't go in if I were you... if you're looking to hire, come on in...",url:"cv.html"},
    V:{description:"hey, psst, congrats on finding me. i love you."}
  };

  const world = document.getElementById("world");
  const caption = document.getElementById("caption");

  let player = { x: 90, y: 58 };
  const grid = [];

  let camX = 0, camY = 0, targetX = 0, targetY = 0;
  const cameraSpeed = 0.15;

  const viewport = document.getElementById("viewport");

const buildingLabels = [
  { x: 72, y: 51, text: "About" },
  { x: 73, y: 63, text: "Archives" },
  { x: 106, y: 65, text: "Curriculum Vitae" }
];

const labelElements = [];

function createLabels() {
  buildingLabels.forEach(label => {

    const el = document.createElement("div");
    el.className = "map-label";

    const text = document.createElement("span");
    text.textContent = label.text;

    const arrow = document.createElement("span");
    arrow.className = "label-arrow";
    arrow.textContent = ">";

    el.appendChild(arrow);
    el.appendChild(text);

    viewport.appendChild(el);

    label.el = el;
    label.arrow = arrow;

    labelElements.push(label);
  });
}

  const paletteCache = {};
  function getPalette(group) {
    if (paletteCache[group]) return paletteCache[group];
    const styles = getComputedStyle(document.documentElement);
    const palette = [];
    for (let i = 1;; i++) {
      const val = styles.getPropertyValue(`--${group}-${i}`).trim();
      if (!val) break;
      palette.push(val);
    }
    return paletteCache[group] = palette.length ? palette : ["#000"];
  }

  borderedMap.forEach((row, y) => {
    const rowEl = document.createElement("div");
    grid[y] = [];
    [...row].forEach((char, x) => {
      const span = document.createElement("span");
      span.className = `tile ${tileCategory[char] || "empty"}`;
      span.textContent = char;

      const palette = getPalette(tileCategory[char] || "empty");
      const color = palette[Math.floor(Math.random() * palette.length)];
      span.style.color = color;
      span.dataset.baseColor = color;

      if (linkTiles[char]) {
        span.classList.add("interactive");
        span.addEventListener("mouseenter", () => {
          caption.innerHTML = `<span class="player-symbol">${char}</span> — ${linkTiles[char].description}`;
        });
        span.addEventListener("mouseleave", () => caption.textContent = "");
      }

      span.addEventListener("click", () => {
        console.log("tile:", x, y, "char:", char);
        movePlayerIfAllowed(x,y);
      });

      grid[y][x] = span;
      rowEl.appendChild(span);
    });
    world.appendChild(rowEl);
  });

  function movePlayerIfAllowed(x,y){
    if(y<0||y>=borderedMap.length) return;
    if(x<0||x>=borderedMap[y].length) return;
    const category = tileCategory[borderedMap[y][x]] || "empty";
    if(!(groupProperties[category]||groupProperties.empty).walkable) return;
    movePlayerTo(x,y);
  }

  function movePlayerTo(x,y){
    const oldTile = grid[player.y][player.x];
    oldTile.textContent = borderedMap[player.y][player.x];
    oldTile.classList.remove("player");
    oldTile.style.color = oldTile.dataset.baseColor;

    player = {x,y};

    const newTile = grid[y][x];
    const category = tileCategory[borderedMap[y][x]] || "empty";

    if(!(groupProperties[category]||groupProperties.empty).cover){
      newTile.textContent = "@";
      newTile.classList.add("player");
      newTile.style.color = "#000";
    }

    centerCamera();
    const char = borderedMap[y][x];

      if (linkTiles[char]) {
        caption.innerHTML = `<span class="player-symbol">${char}</span> — ${linkTiles[char].description}`;
      } else {
        caption.textContent = "";
      }
  }

  function centerCamera(){
    const viewport = document.getElementById("viewport");
    const rect = grid[0][0].getBoundingClientRect();
    targetX = viewport.clientWidth/2 - player.x*rect.width - rect.width/2;
    targetY = viewport.clientHeight/2 - player.y*rect.height - rect.height/2;
  }

  createLabels();

  function updateCamera(){
  camX += (targetX-camX)*cameraSpeed;
  camY += (targetY-camY)*cameraSpeed;

  world.style.transform = `translate(${camX}px,${camY}px)`;

  updateLabels();

  requestAnimationFrame(updateCamera);
}

function updateLabels(){

  const rect = grid[0][0].getBoundingClientRect();
  const tileW = rect.width;
  const tileH = rect.height;

  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;

  const centerX = vw / 2;
  const centerY = vh / 2;

  const placed = [];

  labelElements.forEach(label => {

    const worldX = label.x * tileW + camX + tileW/2;
    const worldY = label.y * tileH + camY + tileH/2;

    let x = worldX;
    let y = worldY;

    let offscreen = false;

    const margin = 8;
    const width = 140;
    const height = 22;

    if (x < margin) { x = margin; offscreen = true; }
    if (x > vw - width - margin) { x = vw - width - margin; offscreen = true; }

    if (y < margin) { y = margin; offscreen = true; }
    if (y > vh - height - margin) { y = vh - height - margin; offscreen = true; }

    /* simple collision avoidance */
    for (let other of placed) {
      if (
        x < other.x + width &&
        x + width > other.x &&
        y < other.y + height &&
        y + height > other.y
      ) {
        y = other.y + height + 4;
      }
    }

    placed.push({x,y});

    label.el.style.transform = `translate(${x}px,${y}px)`;

    if (offscreen) {

      const dx = worldX - centerX;
      const dy = worldY - centerY;

      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      label.arrow.style.display = "inline-block";
      label.arrow.style.transform = `rotate(${angle}deg)`;

    } else {

      label.arrow.style.display = "none";

    }

  });
}

  movePlayerTo(player.x, player.y);
  camX = targetX;
  camY = targetY;
  world.style.transform = `translate(${camX}px,${camY}px)`;
  updateCamera();

  document.addEventListener("keydown", e=>{
    const keys = {w:[0,-1],ArrowUp:[0,-1],s:[0,1],ArrowDown:[0,1],a:[-1,0],ArrowLeft:[-1,0],d:[1,0],ArrowRight:[1,0]};
    if(e.key==="Enter"){ linkTiles[borderedMap[player.y][player.x]]?.url && (window.location.href = linkTiles[borderedMap[player.y][player.x]].url); return; }
    if(!keys[e.key]) return;
    const [dx,dy]=keys[e.key];
    movePlayerIfAllowed(player.x+dx,player.y+dy);
    e.preventDefault();
  });

  window.addEventListener("resize", centerCamera);

});