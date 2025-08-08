// Simple Tetris for Delaya - compact implementation
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scale = 24;
const cols = 10, rows = 20;
canvas.width = cols*scale;
canvas.height = rows*scale;

let grid = Array.from({length:rows},()=>Array(cols).fill(0));
const pieces = [
  [[1,1,1,1]], // I
  [[2,2],[2,2]], // O
  [[0,3,0],[3,3,3]], // T
  [[4,0,0],[4,4,4]], // J
  [[0,0,5],[5,5,5]], // L
  [[6,6,0],[0,6,6]], // S
  [[0,7,7],[7,7,0]]  // Z
];
const colors = ['#000000','#ffb3d9','#ffd18f','#c8a2ff','#a0e7ff','#ffd6a5','#caffbf','#ffd6e0'];

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // background soft glow
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(grid[r][c]){
        drawBlock(c,r,colors[grid[r][c]]);
      }
    }
  }
  if(cur) {
    cur.shape.forEach((row, y)=> row.forEach((v,x)=> {
      if(v){
        drawBlock(cur.x+x, cur.y+y, colors[v], true);
      }
    }));
  }
}

function drawBlock(x,y,color,glow){
  ctx.fillStyle = color;
  ctx.fillRect(x*scale+1,y*scale+1,scale-2,scale-2);
  if(glow){
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.strokeRect(x*scale+1,y*scale+1,scale-2,scale-2);
  }
}

function rotate(matrix){
  return matrix[0].map((_,i)=> matrix.map(row=> row[row.length-1-i]));
}

function collide(shape, x, y){
  for(let r=0;r<shape.length;r++){
    for(let c=0;c<shape[r].length;c++){
      if(shape[r][c]){
        let nx=x+c, ny=y+r;
        if(nx<0 || nx>=cols || ny>=rows) return true;
        if(ny>=0 && grid[ny][nx]) return true;
      }
    }
  }
  return false;
}

function merge(){
  cur.shape.forEach((row, r)=> row.forEach((v,c)=>{
    if(v && cur.y+r>=0) grid[cur.y+r][cur.x+c]=v;
  }));
}

function clearLines(){
  let cleared=0;
  for(let r=rows-1;r>=0;r--){
    if(grid[r].every(x=>x)){
      grid.splice(r,1);
      grid.unshift(Array(cols).fill(0));
      cleared++;
      r++;
    }
  }
  if(cleared){
    score += cleared*100;
    lines += cleared;
    level = 1 + Math.floor(lines/10);
    document.getElementById('score').innerText = score;
    document.getElementById('lines').innerText = lines;
    document.getElementById('level').innerText = level;
    // small sparkle effect
    spark();
  }
}

function newPiece(){
  const idx = Math.floor(Math.random()*pieces.length);
  const shape = pieces[idx].map(r=>r.slice());
  cur = {shape,x:Math.floor((cols-shape[0].length)/2),y:-shape.length, v: idx+1};
  if(collide(cur.shape, cur.x, cur.y)){
    gameOver();
  }
}

function drop(){
  if(!cur) return;
  if(!collide(cur.shape, cur.x, cur.y+1)){
    cur.y++;
  } else {
    merge();
    clearLines();
    newPiece();
  }
  draw();
}

let cur=null, score=0, lines=0, level=1;
let gravityInterval = 800;
let loopId = null;
function loop(){
  gravityInterval = Math.max(120, 800 - (level-1)*60);
  drop();
}
function startGame(){
  grid = Array.from({length:rows},()=>Array(cols).fill(0));
  score=0; lines=0; level=1;
  document.getElementById('score').innerText=score;
  document.getElementById('lines').innerText=lines;
  document.getElementById('level').innerText=level;
  newPiece();
  if(loopId) clearInterval(loopId);
  loopId = setInterval(loop, gravityInterval);
  document.getElementById('startScreen').classList.remove('visible');
  // Try to play audio
  const bgm = document.getElementById('bgm');
  bgm.currentTime = 0;
  bgm.play().catch(()=>{ /* mobile may require gesture */ });
}

function gameOver(){
  if(loopId) clearInterval(loopId);
  showMessage("Ik hou van jou Delaya", "Je hebt het spel gestopt — deze boodschap is speciaal voor Delaya ✨");
}

function showMessage(title,text){
  document.getElementById('messageTitle').innerText = title;
  document.getElementById('messageText').innerText = text;
  const msg = document.getElementById('message');
  msg.classList.add('show');
  // big sparkle animation
  msg.style.animation = 'pulse 1s ease-out';
  // stop music gently
  const bgm = document.getElementById('bgm');
  let fade = setInterval(()=> {
    if(bgm.volume > 0.05){ bgm.volume = Math.max(0, bgm.volume-0.05); }
    else { bgm.pause(); bgm.volume=1; clearInterval(fade); }
  },120);
}

document.getElementById('startBtn').addEventListener('click', ()=> {
  startGame();
  document.getElementById('bgm').play();
});

document.getElementById('restartBtn').addEventListener('click', ()=>{
  document.getElementById('message').classList.remove('show');
  document.getElementById('startScreen').classList.add('visible');
});

document.getElementById('left').addEventListener('click', ()=>{ if(cur && !collide(cur.shape, cur.x-1, cur.y)){ cur.x--; draw(); }});
document.getElementById('right').addEventListener('click', ()=>{ if(cur && !collide(cur.shape, cur.x+1, cur.y)){ cur.x++; draw(); }});
document.getElementById('down').addEventListener('click', ()=>{ if(cur) { drop(); }});
document.getElementById('drop').addEventListener('click', ()=>{ while(cur && !collide(cur.shape, cur.x, cur.y+1)){ cur.y++; } drop();});
document.getElementById('rotate').addEventListener('click', ()=>{ if(cur){ let r = rotate(cur.shape); if(!collide(r, cur.x, cur.y)) cur.shape = r; draw(); }});

// Keyboard
document.addEventListener('keydown', (e)=>{
  if(e.key==='ArrowLeft') document.getElementById('left').click();
  if(e.key==='ArrowRight') document.getElementById('right').click();
  if(e.key==='ArrowDown') document.getElementById('down').click();
  if(e.key===' ' || e.key==='ArrowUp') document.getElementById('rotate').click();
  if(e.key==='Enter') { if(!loopId) startGame(); }
});

// Small sparkle helper
function spark(){
  const el = document.createElement('div');
  el.style.position='fixed';
  el.style.left=(50+Math.random()*40)+'%';
  el.style.top=(30+Math.random()*40)+'%';
  el.style.width='8px';
  el.style.height='8px';
  el.style.borderRadius='50%';
  el.style.background='radial-gradient(#fff,#ffd1f4)';
  el.style.opacity='0.9';
  el.style.pointerEvents='none';
  el.style.transform='translate(-50%,-50%) scale(0.3)';
  el.style.transition='transform 700ms cubic-bezier(.2,.8,.2,1), opacity 700ms';
  document.body.appendChild(el);
  requestAnimationFrame(()=> el.style.transform='translate(-50%,-50%) scale(1)');
  setTimeout(()=> { el.style.opacity='0'; setTimeout(()=> el.remove(),800); },700);
}

// initial draw
draw();
