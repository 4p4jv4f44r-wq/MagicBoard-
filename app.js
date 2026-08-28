const canvas=document.getElementById("board");
const ctx=canvas.getContext("2d");
let drawing=false, lastX=0,lastY=0;

function resize(){
  const old=canvas.toDataURL();
  const w=window.innerWidth,h=window.innerHeight,dpr=Math.max(1,window.devicePixelRatio||1);
  canvas.width=w*dpr; canvas.height=h*dpr; canvas.style.width=w+"px"; canvas.style.height=h+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);
  if(old && old!=="data:,"){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,w,h);img.src=old}
  ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="#111";ctx.lineWidth=4;
}
resize();window.addEventListener("resize",resize);

function point(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
canvas.addEventListener("pointerdown",e=>{
  if(e.pointerType!=="pen") return;
  drawing=true;canvas.setPointerCapture(e.pointerId);const p=point(e);lastX=p.x;lastY=p.y
});
canvas.addEventListener("pointermove",e=>{if(!drawing||e.pointerType!=="pen")return;const p=point(e);ctx.beginPath();ctx.moveTo(lastX,lastY);ctx.lineTo(p.x,p.y);ctx.stroke();lastX=p.x;lastY=p.y});
["pointerup","pointercancel"].forEach(x=>canvas.addEventListener(x,()=>drawing=false));

const KEY="magicBoardBoards";
function getBoards(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
function saveBoards(b){localStorage.setItem(KEY,JSON.stringify(b))}
function isBlank(){
 const px=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 for(let i=0;i<px.length;i+=4){if(px[i]!==255||px[i+1]!==255||px[i+2]!==255)return false}
 return true;
}
document.getElementById("clearBtn").onclick=()=>{
 if(isBlank())return;
 const image=canvas.toDataURL("image/png");
 const boards=getBoards();
 boards.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),image});
 saveBoards(boards);
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
 const d=window.devicePixelRatio||1;ctx.setTransform(d,0,0,d,0,0);ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="#111";ctx.lineWidth=4;
};

const archive=document.getElementById("archive"),grid=document.getElementById("grid"),empty=document.getElementById("empty");
function renderArchive(){
 grid.innerHTML="";const boards=getBoards();empty.style.display=boards.length?"none":"block";
 boards.forEach(b=>{
   const card=document.createElement("div");card.className="card";
   const open=document.createElement("button");open.className="open";
   const img=document.createElement("img");img.src=b.image;open.appendChild(img);
   open.onclick=()=>{document.getElementById("viewerImg").src=b.image;document.getElementById("viewer").classList.remove("hidden")};
   const date=document.createElement("div");date.className="date";date.textContent=new Date(b.date).toLocaleString();
   const del=document.createElement("button");del.className="delete";del.textContent="Delete";
   del.onclick=()=>{saveBoards(getBoards().filter(x=>x.id!==b.id));renderArchive()};
   date.appendChild(del);card.append(open,date);grid.appendChild(card);
 });
}
document.getElementById("archiveBtn").onclick=()=>{renderArchive();archive.classList.remove("hidden")};
document.getElementById("closeArchive").onclick=()=>archive.classList.add("hidden");
document.getElementById("closeViewer").onclick=()=>document.getElementById("viewer").classList.add("hidden");
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
