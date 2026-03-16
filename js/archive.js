let archiveData = null;

/* ---------- LOAD ARCHIVE DATA ---------- */

fetch("data/archive.json")
.then(r => r.json())
.then(data => {

  archiveData = data;

  const archive = document.getElementById("archive");

  data.folders.forEach((folder,i)=>{
    archive.appendChild(
      createFolder(folder, [], i === data.folders.length - 1)
    );
  });

});


/* ---------- DIRECTORY TREE ---------- */

function buildTree(prefix){
  return prefix.map(last => last ? "   " : "│  ").join("");
}

function createFolder(folder, prefix = [], isLast = false){

  const wrapper = document.createElement("div");
  wrapper.className = "archive-folder";

  const tree = buildTree(prefix) + (prefix.length ? (isLast ? "└─ " : "├─ ") : "");

  const title = document.createElement("div");
  title.className = "folder-title";

  const arrow = document.createElement("span");
  arrow.className = "folder-arrow";
  arrow.textContent = ">";

  title.innerHTML = `<span class="tree">${tree}</span>`;
  title.appendChild(arrow);
  title.append(" " + folder.name + "/");

  const contents = document.createElement("div");
  contents.className = "folder-contents";

  title.onclick = () => {
    const open = contents.classList.toggle("open");
    arrow.textContent = open ? "V" : ">";
  };

  wrapper.append(title, contents);

  const nextPrefix = [...prefix, isLast];

  /* subfolders */

  folder.folders?.forEach((sub,i)=>{
    contents.appendChild(
      createFolder(sub, nextPrefix, i === folder.folders.length - 1)
    );
  });

  /* works */

  folder.works?.forEach((work,i)=>{

    const workEl = document.createElement("div");
    workEl.className = "archive-work";

    const tree = buildTree(nextPrefix) + (i === folder.works.length - 1 ? "└─ " : "├─ ");
    const projectPath = `${folder.path}/${work.slug}`;

    workEl.innerHTML = `
      <div class="work-header">
        <span class="tree">${tree}</span>
        <span class="work-arrow">></span>
        <span class="work-title">
          ${work.video ? `<span class="video-icon">»</span>`:""}
          ${work.title}, ${work.year}
        </span>
      </div>

      <div class="work-body">
        <img src="${projectPath}/thumb.jpg">
        <div>
          <p>${work.short}</p>
          <a href="#" class="open-project" data-path="${projectPath}">
            open project →
          </a>
        </div>
      </div>
    `;

    const header = workEl.querySelector(".work-header");
    const body = workEl.querySelector(".work-body");
    const arrow = workEl.querySelector(".work-arrow");

    header.onclick = ()=>{
      const open = body.classList.toggle("open");
      arrow.textContent = open ? "V" : ">";
    };

    contents.appendChild(workEl);

  });

  return wrapper;

}


/* ---------- OPEN PROJECT ---------- */

document.addEventListener("click", async (e)=>{

  const link = e.target.closest(".open-project");
  if(!link) return;

  e.preventDefault();

  const projectPath = link.dataset.path;

  const viewer = document.getElementById("project-viewer");
  const archive = document.getElementById("archive");

  const html = await fetch("project.html").then(r=>r.text());

  viewer.innerHTML = `
    <div id="close-project" class="archive-back">
      <span class="tree">└─ </span>
      <span class="work-arrow"><</span>
      back to directory
    </div>
    ${html}
  `;

  viewer.style.display = "block";
  archive.style.display = "none";

  loadProject(projectPath);

});


/* ---------- CLOSE PROJECT ---------- */

document.addEventListener("click",(e)=>{

  if(!e.target.closest("#close-project")) return;

  document.getElementById("project-viewer").style.display = "none";
  document.getElementById("archive").style.display = "block";

});


/* ---------- PROJECT LOADER ---------- */

async function loadProject(projectPath){

  const meta = await fetch(`${projectPath}/meta.json`).then(r=>r.json());

  document.getElementById("project-title").textContent =
    meta.year ? `${meta.title}, ${meta.year}` : meta.title;
  document.getElementById("project-medium").textContent = meta.medium;
  document.getElementById("project-long").textContent = meta.long;

  const gallery = document.getElementById("project-gallery");
  gallery.innerHTML = "";

  /* ---------- ESSAY / PDF ---------- */

  if(meta.pdf){

    /* hide normal project layout */
    document.querySelector(".project-layout").style.display = "none";

    const extra = document.getElementById("project-extra");

    extra.innerHTML = `
      <div class="essay-viewer">

        <iframe src="${projectPath}/${meta.pdf}"></iframe>

        <p class="essay-download">
          <a href="${projectPath}/${meta.pdf}" download>
            download pdf →
          </a>
        </p>

      </div>
    `;

    return;

  }

  /*----------- VIDEO ----------------*/

  if(meta.video){

    /* hide gallery column only */
    document.getElementById("project-gallery").style.display = "none";

    const extra = document.getElementById("project-extra");

    extra.innerHTML = `
      <div class="video-viewer">
        <iframe
          src="https://www.youtube.com/embed/${meta.video}"
          allowfullscreen>
        </iframe>
      </div>
    `;

    return;

  }

  /* find project in archive.json */

  let project = null;

  function findProject(folders){
    for(const f of folders){

      if(f.works){
        for(const w of f.works){
          if(`${f.path}/${w.slug}` === projectPath){
            project = w;
          }
        }
      }

      if(f.folders) findProject(f.folders);

    }
  }

  findProject(archiveData.folders);

  if(project?.images){

    project.images
      .filter(file => /^\d+\./.test(file))
      .forEach(name =>{

        const ext = name.split(".").pop().toLowerCase();

        if(ext === "mp4"){

          const video = document.createElement("video");
          video.src = `${projectPath}/images/${name}`;
          video.controls = true;
          video.loop = true;
          video.preload = "metadata";
          video.playsInline = true;
          video.className = "gallery-video";

          gallery.appendChild(video);

        } else {

          const img = new Image();
          img.src = `${projectPath}/images/${name}`;
          img.className = "gallery-image";

          gallery.appendChild(img);

        }

      });

  }

  /* optional video */

  if(meta.video){

    const video = document.getElementById("project-video");

    video.innerHTML = `
      <iframe
        width="100%"
        height="500"
        src="https://www.youtube.com/embed/${meta.video}"
        frameborder="0"
        allowfullscreen>
      </iframe>
    `;

  }

  /* optional custom html */

  if(meta.extra){

    const html = await fetch(`${projectPath}/${meta.extra}`).then(r=>r.text());
    document.getElementById("project-extra").innerHTML = html;

  }

}


/* ===== LIGHTBOX GALLERY ===== */

let galleryImages = [];
let currentIndex = 0;

document.addEventListener("click", e => {

  const img = e.target.closest(".gallery-image");
  if(!img) return;

  galleryImages = [...document.querySelectorAll(".gallery-image")];
  currentIndex = galleryImages.indexOf(img);

  openLightbox();

});

function openLightbox(){

  const overlay = document.createElement("div");
  overlay.className = "image-overlay";

  overlay.innerHTML = `
    <div class="lightbox-ui">

      <div class="lightbox-arrow lightbox-prev"><</div>

      <img class="lightbox-image" src="${galleryImages[currentIndex].src}">

      <div class="lightbox-arrow lightbox-next">></div>

    </div>
  `;

  document.body.appendChild(overlay);

  overlay.onclick = (e)=>{
    if(e.target === overlay) overlay.remove();
  };

  overlay.querySelector(".lightbox-prev").onclick = (e)=>{
    e.stopPropagation();
    prevImage();
  };

  overlay.querySelector(".lightbox-next").onclick = (e)=>{
    e.stopPropagation();
    nextImage();
  };

}

function nextImage(){

  currentIndex++;
  if(currentIndex >= galleryImages.length) currentIndex = 0;

  updateLightbox();

}

function prevImage(){

  currentIndex--;
  if(currentIndex < 0) currentIndex = galleryImages.length - 1;

  updateLightbox();

}

function updateLightbox(){

  const img = document.querySelector(".lightbox-image");
  if(!img) return;

  img.src = galleryImages[currentIndex].src;

}

/* keyboard navigation */

document.addEventListener("keydown", e => {

  if(!document.querySelector(".image-overlay")) return;

  if(e.key === "Escape"){
    document.querySelector(".image-overlay").remove();
  }

  if(e.key === "ArrowRight"){
    nextImage();
  }

  if(e.key === "ArrowLeft"){
    prevImage();
  }

});