// Prevent Safari from selecting text or showing the selection menu
document.addEventListener("selectstart", e => e.preventDefault());
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("dragstart", e => e.preventDefault());

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (selection) selection.removeAllRanges();
});

// Extra iPad protection
document.addEventListener("touchstart", e => {
  if (e.target === canvas) e.preventDefault();
}, { passive: false });

document.addEventListener("touchmove", e => {
  if (e.target === canvas) e.preventDefault();
}, { passive: false });


// CANVAS
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

let drawing = false;
let lastX = 0;
let lastY = 0;


// RESIZE CANVAS
function resize() {
  const old = canvas.toDataURL();

  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  canvas.width = w * dpr;
  canvas.height = h * dpr;

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  if (old && old !== "data:,") {
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
    };

    img.src = old;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
}

resize();

window.addEventListener("resize", resize);


// GET TOUCH/PENCIL POSITION
function point(e) {
  const r = canvas.getBoundingClientRect();

  return {
    x: e.clientX - r.left,
    y: e.clientY - r.top
  };
}


// APPLE PENCIL DOWN
canvas.addEventListener("pointerdown", e => {

  // IGNORE FINGER AND PALM
  if (e.pointerType !== "pen") return;

  e.preventDefault();
  e.stopPropagation();

  drawing = true;

  canvas.setPointerCapture(e.pointerId);

  const p = point(e);

  lastX = p.x;
  lastY = p.y;

});


// APPLE PENCIL MOVING
canvas.addEventListener("pointermove", e => {

  // IGNORE FINGER AND PALM
  if (!drawing || e.pointerType !== "pen") return;

  e.preventDefault();
  e.stopPropagation();

  const p = point(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  lastX = p.x;
  lastY = p.y;

});


// APPLE PENCIL UP
canvas.addEventListener("pointerup", e => {

  if (e.pointerType !== "pen") return;

  e.preventDefault();
  e.stopPropagation();

  drawing = false;

  if (canvas.hasPointerCapture(e.pointerId)) {
    canvas.releasePointerCapture(e.pointerId);
  }

});


// CANCELLED PENCIL TOUCH
canvas.addEventListener("pointercancel", e => {

  if (e.pointerType !== "pen") return;

  drawing = false;

  if (canvas.hasPointerCapture(e.pointerId)) {
    canvas.releasePointerCapture(e.pointerId);
  }

});


// IF PENCIL LEAVES THE PAGE
document.addEventListener("pointerup", e => {

  if (e.pointerType === "pen") {
    drawing = false;
  }

});


// SAVED BOARDS
const KEY = "magicBoardBoards";

function getBoards() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function saveBoards(b) {
  localStorage.setItem(KEY, JSON.stringify(b));
}


// CHECK IF CANVAS IS EMPTY
function isBlank() {

  const px = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  ).data;

  for (let i = 0; i < px.length; i += 4) {

    if (
      px[i] !== 255 ||
      px[i + 1] !== 255 ||
      px[i + 2] !== 255
    ) {
      return false;
    }

  }

  return true;
}


// CLEAR & SAVE
document.getElementById("clearBtn").onclick = () => {

  if (isBlank()) return;

  const image = canvas.toDataURL("image/png");

  const boards = getBoards();

  boards.unshift({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    image: image
  });

  saveBoards(boards);


  // CLEAR CANVAS
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = "#fff";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  // RESTORE DRAWING SETTINGS
  const d = window.devicePixelRatio || 1;

  ctx.setTransform(d, 0, 0, d, 0, 0);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;

};


// ARCHIVE
const archive = document.getElementById("archive");
const grid = document.getElementById("grid");
const empty = document.getElementById("empty");


function renderArchive() {

  grid.innerHTML = "";

  const boards = getBoards();

  empty.style.display =
    boards.length ? "none" : "block";


  boards.forEach(b => {

    const card = document.createElement("div");

    card.className = "card";


    const open = document.createElement("button");

    open.className = "open";


    const img = document.createElement("img");

    img.src = b.image;

    open.appendChild(img);


    open.onclick = () => {

      document.getElementById("viewerImg").src = b.image;

      document
        .getElementById("viewer")
        .classList.remove("hidden");

    };


    const date = document.createElement("div");

    date.className = "date";

    date.textContent =
      new Date(b.date).toLocaleString();


    const del = document.createElement("button");

    del.className = "delete";

    del.textContent = "Delete";


    del.onclick = () => {

      saveBoards(
        getBoards().filter(x => x.id !== b.id)
      );

      renderArchive();

    };


    date.appendChild(del);

    card.appendChild(open);

    card.appendChild(date);

    grid.appendChild(card);

  });

}


// OPEN ARCHIVE
document.getElementById("archiveBtn").onclick = () => {

  renderArchive();

  archive.classList.remove("hidden");

};


// CLOSE ARCHIVE
document.getElementById("closeArchive").onclick = () => {

  archive.classList.add("hidden");

};


// CLOSE VIEWER
document.getElementById("closeViewer").onclick = () => {

  document
    .getElementById("viewer")
    .classList.add("hidden");

};


// SERVICE WORKER
if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(() => {});

}
