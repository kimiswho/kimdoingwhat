'use strict';
const TILE=32,C_W=800,C_H=576,MAP_W=25,MAP_H=18;

// ─── AUDIO ───────────────────────────────────────────────────
class AudioSys {
  constructor(){this.ctx=null;}
  init(){try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.ctx.resume();}catch(e){}}
  beep(freq=440,dur=.15,type='sine',vol=.3){
    if(!this.ctx)return;
    if(this.ctx.state==='suspended'){this.ctx.resume();return;}
    if(this.ctx.state!=='running')return;
    try{
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.connect(g);g.connect(this.ctx.destination);
      o.frequency.value=freq;o.type=type;
      g.gain.setValueAtTime(vol,this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+dur);
      o.start();o.stop(this.ctx.currentTime+dur);
    }catch(e){}
  }
  correct(){this.beep(523,.1);setTimeout(()=>this.beep(659,.1),100);setTimeout(()=>this.beep(784,.2),200);}
  wrong(){this.beep(200,.3,'sawtooth');}
  detected(){this.beep(880,.1,'square');setTimeout(()=>this.beep(440,.3,'square'),100);}
  pickup(){this.beep(600,.05);setTimeout(()=>this.beep(800,.05),50);}
  levelUp(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.beep(f,.2),i*150));}
  step(){this.beep(80+Math.random()*40,.04,'sawtooth',.05);}
}

// ─── LEADERBOARD ─────────────────────────────────────────────
const LB={
  key:'ballsy_lb',
  get(){try{return JSON.parse(localStorage.getItem(this.key))||[];}catch{return[];}},
  add(name,score,level,diff){
    const lb=this.get();
    lb.push({name:name.slice(0,12),score,level,diff:diff||'medium',date:new Date().toLocaleDateString()});
    lb.sort((a,b)=>b.score-a.score);
    localStorage.setItem(this.key,JSON.stringify(lb.slice(0,10)));
  }
};

// ─── QUIZ GENERATOR ──────────────────────────────────────────
function makeQ(diff){
  const ops=diff===1?['+','-']:diff===2?['+','-','×','÷']:['+','-','×','÷','mixed'];
  let op=ops[Math.floor(Math.random()*ops.length)];
  if(op==='mixed')op=['×','÷'][Math.floor(Math.random()*2)];
  let a,b,ans,q;
  const r=(n)=>Math.floor(Math.random()*n)+1;
  if(op==='+'){a=r(diff===1?20:50);b=r(diff===1?20:50);ans=a+b;q=`${a} + ${b} = ?`;}
  else if(op==='-'){a=r(diff===1?20:50)+5;b=r(a-1)+1;ans=a-b;q=`${a} − ${b} = ?`;}
  else if(op==='×'){a=r(12);b=r(12);ans=a*b;q=`${a} × ${b} = ?`;}
  else{b=r(11)+1;ans=r(10);a=b*ans;q=`${a} ÷ ${b} = ?`;}
  const wrong=new Set();
  while(wrong.size<3){const w=ans+(r(8)-4);if(w!==ans&&w>0)wrong.add(w);}
  return{q,ans,opts:[ans,...wrong].sort(()=>Math.random()-.5),timed:diff>=3};
}

// ─── LEVEL DATA ───────────────────────────────────────────────
// T: 0=floor 1=wall 4=quiz 5=vend 6=rope 7=exit
const LEVELS=[
{
  name:'Stage 1: The Hallway',diff:1,reqQ:2,
  map:[
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  items:[{x:14,y:3,t:'note'},{x:22,y:13,t:'candy'},{x:4,y:13,t:'key'}],
  playerStart:{x:2,y:15},
  teachers:[
    {x:12,y:6,angle:0,spd:.55,patrol:[{x:12,y:6},{x:20,y:6},{x:20,y:14},{x:12,y:14}]},
  ],
  exitTile:{x:20,y:15},
},{
  name:'Stage 2: The Classroom',diff:2,reqQ:3,
  map:[
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1],
    [1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,4,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1],
    [1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1],
    [1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1],
    [1,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,1],
    [1,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  items:[{x:22,y:5,t:'note'},{x:8,y:12,t:'candy'},{x:17,y:1,t:'key'}],
  playerStart:{x:1,y:16},
  teachers:[
    {x:12,y:1,angle:0,spd:.65,patrol:[{x:12,y:1},{x:22,y:1},{x:22,y:16},{x:12,y:16}]},
    {x:5,y:8,angle:Math.PI/2,spd:.55,patrol:[{x:5,y:1},{x:5,y:16}]},
  ],
  exitTile:{x:22,y:13},
},{
  name:'Stage 3: The Library',diff:3,reqQ:4,
  map:[
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,0,0,0,5,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  items:[{x:23,y:4,t:'note'},{x:1,y:10,t:'candy'},{x:21,y:1,t:'key'},{x:11,y:13,t:'note'}],
  playerStart:{x:1,y:16},
  teachers:[
    {x:12,y:1,angle:Math.PI/2,spd:.8,patrol:[{x:12,y:1},{x:12,y:16}]},
    {x:4,y:10,angle:0,spd:.7,patrol:[{x:1,y:10},{x:21,y:10}]},
    {x:20,y:4,angle:Math.PI,spd:.6,patrol:[{x:20,y:1},{x:20,y:16}]},
  ],
  exitTile:{x:22,y:16},
}];

// ─── GAME ─────────────────────────────────────────────────────
class Game{
  constructor(){
    this.canvas=document.getElementById('gameCanvas');
    this.ctx=this.canvas.getContext('2d');
    this.audio=new AudioSys();
    this.state='menu';
    this.difficulty='medium';
    this.levelIdx=0;
    this.score=0;this.lives=3;this.coins=0;
    this.inventory=[];this.quizDone=0;
    this.player=null;this.teachers=[];this.items=[];
    this.map=[];this.camera={x:0,y:0};
    this.keys={};this._ePrev=false;
    this.particles=[];this.flashTimer=0;this.stepTimer=0;
    this.quiz=null;this.activePanel=null;this._qInterval=null;
    this.ropeState=null;this._alertMarker=null;
    this.lastTime=0;
    this._bind();
    this._showScreen('screen-menu');
    requestAnimationFrame(t=>this._loop(t));
  }

  _bind(){
    const resumeAudio=()=>{try{this.audio.ctx?.resume();}catch(e){}};
    document.addEventListener('click',resumeAudio,{once:true});
    document.addEventListener('keydown',resumeAudio,{once:true});
    document.addEventListener('keydown',e=>{
      this.keys[e.code]=true;
      if(e.code==='Escape')this._esc();
      if(e.code==='Space'&&this.state==='rope'){e.preventDefault();this._ropeHit();}
    });
    document.addEventListener('keyup',e=>{this.keys[e.code]=false;});
    // Main menu
    document.getElementById('btn-play').onclick=()=>{this.state='menu';this._showScreen('screen-diff');};
    document.getElementById('btn-lb').onclick=()=>this._showLB();
    document.getElementById('btn-back-lb').onclick=()=>{this.state='menu';this._showScreen('screen-menu');};
    document.getElementById('btn-submit-score').onclick=()=>this._submitScore();
    document.getElementById('btn-menu-go').onclick=()=>{this.state='menu';this._showScreen('screen-menu');};
    document.getElementById('btn-retry').onclick=()=>{this._showScreen('screen-diff');};
    document.getElementById('btn-next-level').onclick=()=>this._nextLevel();
    document.getElementById('btn-close-vend').onclick=()=>this._closeVend();
    document.querySelectorAll('.vend-item').forEach(b=>{
      b.onclick=()=>this._buyVend(b.dataset.item,+b.dataset.cost,b.dataset.effect);
    });
    // Difficulty screen
    document.getElementById('btn-diff-easy').onclick=()=>this._startWithDiff('easy');
    document.getElementById('btn-diff-medium').onclick=()=>this._startWithDiff('medium');
    document.getElementById('btn-diff-hard').onclick=()=>this._startWithDiff('hardcore');
    document.getElementById('btn-diff-back').onclick=()=>{this._showScreen('screen-menu');};
    // Pause screen
    document.getElementById('btn-resume').onclick=()=>this._resumeGame();
    document.getElementById('btn-restart-pause').onclick=()=>this._restartStage();
    document.getElementById('btn-home-pause').onclick=()=>{this.state='menu';this._showScreen('screen-menu');};
    // HUD buttons
    document.getElementById('btn-hud-pause').onclick=()=>this._togglePause();
    document.getElementById('btn-hud-restart').onclick=()=>this._restartStage();
    document.getElementById('btn-hud-home').onclick=()=>{this.state='menu';this._showScreen('screen-menu');};
  }

  _startWithDiff(diff){
    this.difficulty=diff;
    document.querySelectorAll('.btn-diff').forEach(b=>b.classList.remove('selected'));
    const map={easy:'btn-diff-easy',medium:'btn-diff-medium',hardcore:'btn-diff-hard'};
    document.getElementById(map[diff])?.classList.add('selected');
    this.startGame(0);
  }
  _togglePause(){
    if(this.state==='playing'){
      this.state='pause';
      document.getElementById('pause-stage-name').textContent=this.lv?.name||'';
      this._showScreen('screen-pause');
    } else if(this.state==='pause'){
      this._resumeGame();
    }
  }
  _resumeGame(){
    this._showScreen(null);
    this.state='playing';
  }
  _restartStage(){
    this._loadLevel(this.levelIdx);
    this._showScreen(null);
    this.state='playing';
  }

  _showScreen(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
    if(id)document.getElementById(id)?.classList.remove('hidden');
  }

  // ─── START ───
  startGame(idx){
    this.levelIdx=idx;this.score=0;this.coins=0;
    this.lives={easy:4,medium:3,hardcore:2}[this.difficulty]||3;
    this.inventory=[];this.quizDone=0;this.particles=[];
    this.audio.init();
    this._loadLevel(idx);
    this._showScreen(null);
    this.state='playing';
    this._hintHidden=false;this._hintTimer=8;
  }

  _getLevel(idx){
    if(idx<LEVELS.length)return LEVELS[idx];
    return this._genLevel(idx);
  }

  _genLevel(idx){
    const stage=idx+1;
    const diff=this.difficulty;
    const dm={easy:{sm:.72,qm:.7},medium:{sm:1,qm:1},hardcore:{sm:1.38,qm:1.3}}[diff];
    const reqQ=Math.max(2,Math.min(2+Math.floor(stage*dm.qm*0.55),9));
    const quizDiff=Math.min(3,1+Math.floor(stage/3));
    // Build map
    const map=Array.from({length:MAP_H},()=>Array(MAP_W).fill(1));
    // 6 rooms in 3×2 grid
    const cols=3,rowsG=2;
    const secW=Math.floor((MAP_W-2)/cols);
    const secH=Math.floor((MAP_H-2)/rowsG);
    const rooms=[];
    for(let gy=0;gy<rowsG;gy++){
      for(let gx=0;gx<cols;gx++){
        const sx=1+gx*secW,sy=1+gy*secH;
        const marX=1+Math.floor(Math.random()*2),marY=1+Math.floor(Math.random()*2);
        const rx=sx+marX,ry=sy+marY;
        const rw=Math.max(3,secW-marX*2-(Math.floor(Math.random()*2)));
        const rh=Math.max(3,secH-marY*2-(Math.floor(Math.random()*2)));
        for(let y=ry;y<ry+rh&&y<MAP_H-1;y++)
          for(let x=rx;x<rx+rw&&x<MAP_W-1;x++) map[y][x]=0;
        rooms.push({gx,gy,x:rx,y:ry,w:rw,h:rh,
          cx:Math.min(rx+Math.floor(rw/2),MAP_W-2),
          cy:Math.min(ry+Math.floor(rh/2),MAP_H-2)});
      }
    }
    // Corridors horizontal
    for(let gy=0;gy<rowsG;gy++)
      for(let gx=0;gx<cols-1;gx++){
        const r1=rooms[gy*cols+gx],r2=rooms[gy*cols+gx+1];
        for(let x=r1.cx;x<=r2.cx&&x<MAP_W-1;x++){
          const y=r1.cy;
          if(y>=1&&y<MAP_H-1)map[y][x]=0;
          if(y+1<MAP_H-1)map[y+1][x]=0;
        }
      }
    // Corridors vertical
    for(let gy=0;gy<rowsG-1;gy++)
      for(let gx=0;gx<cols;gx++){
        const r1=rooms[gy*cols+gx],r2=rooms[(gy+1)*cols+gx];
        for(let y=r1.cy;y<=r2.cy&&y<MAP_H-1;y++){
          const x=r1.cx;
          if(x>=1&&x<MAP_W-1)map[y][x]=0;
          if(x+1<MAP_W-1)map[y][x+1]=0;
        }
      }
    // Floor pool
    const playerStart={x:rooms[0].cx,y:rooms[0].cy};
    const floors=[];
    for(let y=1;y<MAP_H-1;y++)
      for(let x=1;x<MAP_W-1;x++)
        if(map[y][x]===0&&!(x===playerStart.x&&y===playerStart.y))floors.push({x,y});
    for(let i=floors.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[floors[i],floors[j]]=[floors[j],floors[i]];}
    let fi=0;
    const pick=(minD=3)=>{
      while(fi<floors.length){
        const f=floors[fi++];
        if(map[f.y][f.x]===0&&Math.hypot(f.x-playerStart.x,f.y-playerStart.y)>=minD)return f;
      }return null;
    };
    // Exit in last room
    const er=rooms[rooms.length-1];
    const exitTile={x:er.cx,y:er.cy};map[er.cy][er.cx]=7;
    // Quiz panels
    for(let q=0;q<reqQ+2;q++){const f=pick(5);if(f)map[f.y][f.x]=4;}
    const fv=pick(3);if(fv)map[fv.y][fv.x]=5;
    const fr=pick(3);if(fr)map[fr.y][fr.x]=6;
    // Items
    const items=[],iT=['note','candy','key'];
    for(let i=0;i<3;i++){const f=pick(2);if(f&&map[f.y][f.x]===0){items.push({x:f.x,y:f.y,t:iT[i]});}}
    // Teachers
    const numT=Math.min(1+Math.floor((stage-1)/2),4);
    const tRooms=[2,4,1,3,5];
    const teachers=[];
    for(let i=0;i<numT;i++){
      const tr=rooms[tRooms[i]%rooms.length];
      const spd=Math.min((0.45+stage*0.035)*dm.sm+i*.07,1.7);
      teachers.push({x:tr.cx,y:tr.cy,angle:Math.random()*Math.PI*2,spd,
        patrol:[{x:tr.x+1,y:tr.y+1},{x:tr.x+tr.w-2,y:tr.y+1},
                {x:tr.x+tr.w-2,y:tr.y+tr.h-2},{x:tr.x+1,y:tr.y+tr.h-2}]});
    }
    return{name:`Stage ${stage}`,diff:quizDiff,reqQ,map,items,playerStart,teachers,exitTile};
  }

  _loadLevel(idx){
    const lv=this._getLevel(idx);
    this.lv=lv;
    this.map=lv.map.map(r=>[...r]);
    const ps=lv.playerStart;
    this.player={
      x:ps.x*TILE+TILE/2,y:ps.y*TILE+TILE/2,
      vx:0,vy:0,speed:2.6,runSpeed:4.8,
      stamina:100,maxSt:100,running:false,stExhausted:false,
      facing:0,size:11,detected:false,detTimer:0,
    };
    const dmSpd={easy:.75,medium:1,hardcore:1.35}[this.difficulty];
    const dmFov={easy:-.08,medium:0,hardcore:.13}[this.difficulty];
    const dmVd={easy:.85,medium:1,hardcore:1.2}[this.difficulty];
    this.teachers=lv.teachers.map(s=>({
      x:s.x*TILE+TILE/2,y:s.y*TILE+TILE/2,
      angle:s.angle,spd:s.spd*dmSpd,
      patrol:s.patrol.map(p=>({x:p.x*TILE+TILE/2,y:p.y*TILE+TILE/2})),
      pi:0,state:'patrol',fov:.42*Math.PI+dmFov,vd:175*dmVd,
      detTimer:0,alertTimer:0,size:12,
    }));
    this.items=lv.items.map(it=>({
      x:it.x*TILE+TILE/2,y:it.y*TILE+TILE/2,t:it.t,got:false,
    }));
    this.quizDone=0;this._alertMarker=null;
    this._updateHUD();
  }

  // ─── LOOP ───
  _loop(ts){
    const dt=Math.min((ts-this.lastTime)/1000,.05);
    this.lastTime=ts;
    try{
      if(this.state==='playing'){this._update(dt);this._render();}
      else if(this.state==='rope'){this._updateRope(dt);this._render();}
      else if(this.state==='quiz'||this.state==='pause'){this._render();}
    }catch(e){console.error('[game loop]',e);}
    requestAnimationFrame(t=>this._loop(t));
  }

  // ─── UPDATE ───
  _update(dt){
    this._updatePlayer(dt);
    this._updateTeachers(dt);
    this._checkDetection();
    this._updateParticles(dt);
    this._updateCamera();
    if(this.flashTimer>0)this.flashTimer-=dt;
    const sf=document.getElementById('hud-stamina-fill');
    if(sf){sf.style.width=(this.player.stamina/this.player.maxSt*100)+'%';sf.style.background=this.player.stExhausted?'rgba(70,70,90,.6)':'';}
  }

  _updatePlayer(dt){
    const p=this.player;
    let dx=0,dy=0;
    if(this.keys['KeyW']||this.keys['ArrowUp'])   dy=-1;
    if(this.keys['KeyS']||this.keys['ArrowDown']) dy= 1;
    if(this.keys['KeyA']||this.keys['ArrowLeft']) dx=-1;
    if(this.keys['KeyD']||this.keys['ArrowRight'])dx= 1;
    const moving=dx!==0||dy!==0;
    const shiftHeld=this.keys['ShiftLeft']||this.keys['ShiftRight'];
    p.running=moving&&shiftHeld&&p.stamina>0&&!p.stExhausted;
    const spd=p.running?p.runSpeed:p.speed;
    if(p.running){p.stamina=Math.max(0,p.stamina-22*dt);if(p.stamina===0)p.stExhausted=true;}
    else{p.stamina=Math.min(p.maxSt,p.stamina+9*dt);if(p.stExhausted&&p.stamina>=25)p.stExhausted=false;}
    if(moving){
      const len=Math.hypot(dx,dy);dx=dx/len*spd;dy=dy/len*spd;
      p.facing=Math.atan2(dy,dx);
      this.stepTimer-=dt;
      if(this.stepTimer<=0){this.audio.step();this.stepTimer=p.running?.14:.26;}
    }
    this._moveX(dx);this._moveY(dy);
    // interact
    if(this.keys['KeyE']&&!this._ePrev)this._interact();
    this._ePrev=this.keys['KeyE'];
    // collect items
    this.items.forEach(item=>{
      if(item.got)return;
      if(Math.hypot(item.x-p.x,item.y-p.y)<TILE*.85){
        item.got=true;this.inventory.push(item.t);
        this.coins+=item.t==='key'?20:item.t==='note'?10:5;
        this.score+=50;this.audio.pickup();
        this._spawnFX(item.x,item.y,'#60A5FA',8);
        this._updateHUD();
      }
    });
    // check exit
    const ex=this.lv.exitTile;
    if(Math.hypot(p.x-(ex.x*TILE+TILE/2),p.y-(ex.y*TILE+TILE/2))<TILE&&this.quizDone>=this.lv.reqQ)
      this._completeLevel();
  }

  _moveX(dx){
    if(!dx)return;
    const p=this.player,nx=p.x+dx;
    const tx=Math.floor((nx+(dx>0?p.size:-p.size))/TILE);
    for(const off of[-p.size*.8,p.size*.8]){
      const ty=Math.floor((p.y+off)/TILE);
      if(ty>=0&&ty<MAP_H&&tx>=0&&tx<MAP_W&&(this.map[ty][tx]===1))return;
    }
    p.x=nx;
  }
  _moveY(dy){
    if(!dy)return;
    const p=this.player,ny=p.y+dy;
    const ty=Math.floor((ny+(dy>0?p.size:-p.size))/TILE);
    for(const off of[-p.size*.8,p.size*.8]){
      const tx=Math.floor((p.x+off)/TILE);
      if(tx>=0&&tx<MAP_W&&ty>=0&&ty<MAP_H&&(this.map[ty][tx]===1))return;
    }
    p.y=ny;
  }

  _interact(){
    const p=this.player;
    const ix=Math.round(p.x/TILE),iy=Math.round(p.y/TILE);
    const dirs=[{dx:0,dy:0},{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
    for(const {dx,dy} of dirs){
      const tx=ix+dx,ty=iy+dy;
      if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H)continue;
      const tile=this.map[ty][tx];
      if(tile===4){this._openQuiz(tx,ty);return;}
      if(tile===5){this._openVend();return;}
      if(tile===6){this._startRope();return;}
    }
  }

  // ─── TEACHERS ───
  _updateTeachers(dt){
    this.teachers.forEach(t=>{
      if(t.state==='patrol'){
        const tgt=t.patrol[t.pi];
        const dx=tgt.x-t.x,dy=tgt.y-t.y,d=Math.hypot(dx,dy);
        if(d<3){t.pi=(t.pi+1)%t.patrol.length;}
        else{const spd=t.spd*TILE*dt;t.x+=dx/d*spd;t.y+=dy/d*spd;t.angle=Math.atan2(dy,dx);}
      } else if(t.state==='chase'){
        const p=this.player,dx=p.x-t.x,dy=p.y-t.y,d=Math.hypot(dx,dy);
        const spd=t.spd*TILE*2*dt;
        t.x+=dx/d*spd;t.y+=dy/d*spd;t.angle=Math.atan2(dy,dx);
        t.alertTimer-=dt;
        if(d<18)this._caught();
        else if(t.alertTimer<=0){t.state='patrol';t.detTimer=0;}
      } else if(t.state==='alert'){
        // Rush toward the panel position where the wrong answer was given
        const dx=t.alertPos.x-t.x,dy=t.alertPos.y-t.y,d=Math.hypot(dx,dy);
        const spd=t.spd*TILE*1.9*dt;
        if(d>10){t.x+=dx/d*spd;t.y+=dy/d*spd;t.angle=Math.atan2(dy,dx);}
        else{
          // Arrived — scan by slowly rotating angle
          t.angle+=dt*1.8;
        }
        t.alertTimer-=dt;
        if(t.alertTimer<=0){t.state='patrol';t.detTimer=0;}
      }
    });
    if(this._alertMarker){this._alertMarker.life-=dt;if(this._alertMarker.life<=0)this._alertMarker=null;}
  }

  _checkDetection(){
    const p=this.player;let det=false;
    this.teachers.forEach(t=>{
      if(t.state==='chase')return;
      const onAlert=t.state==='alert';
      const dx=p.x-t.x,dy=p.y-t.y,d=Math.hypot(dx,dy);
      const vd=onAlert?t.vd*1.35:t.vd;
      if(d>vd){t.detTimer=Math.max(0,t.detTimer-.03);return;}
      let ad=Math.atan2(dy,dx)-t.angle;
      while(ad>Math.PI)ad-=Math.PI*2;while(ad<-Math.PI)ad+=Math.PI*2;
      const fov=onAlert?t.fov*1.4:t.fov;
      if(Math.abs(ad)<fov&&this._los(t.x,t.y,p.x,p.y)){
        det=true;
        const rate=onAlert?.06:.025;
        t.detTimer+=rate*(p.running?1.5:1);
        if(t.detTimer>=1){t.state='chase';t.alertTimer=6;t.detTimer=0;this.audio.detected();this.flashTimer=.5;}
      } else t.detTimer=Math.max(0,t.detTimer-.025);
    });
    p.detected=det;
    // detection meter
    const maxDet=Math.max(0,...this.teachers.map(t=>t.detTimer));
    const de=document.getElementById('hud-det-fill');
    if(de){de.style.width=(maxDet*100)+'%';de.style.background=maxDet>.6?'#ef4444':'#f59e0b';}
  }

  _los(ax,ay,bx,by){
    for(let i=1;i<20;i++){
      const f=i/20,x=ax+(bx-ax)*f,y=ay+(by-ay)*f;
      const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
      if(ty>=0&&ty<MAP_H&&tx>=0&&tx<MAP_W&&this.map[ty][tx]===1)return false;
    }
    return true;
  }

  _caught(){
    if(this.state!=='playing')return;
    this.lives--;this.score=Math.max(0,this.score-150);
    this.audio.wrong();this._spawnFX(this.player.x,this.player.y,'#ef4444',16);
    this._updateHUD();this.flashTimer=.8;
    if(this.lives<=0){this._gameOver();return;}
    const ps=this.lv.playerStart;
    this.player.x=ps.x*TILE+TILE/2;this.player.y=ps.y*TILE+TILE/2;
    this.player.stamina=this.player.maxSt;this.player.stExhausted=false;
    this.teachers.forEach(t=>{t.state='patrol';t.detTimer=0;});
  }

  // ─── QUIZ ───
  _openQuiz(tx,ty){
    this.quiz=makeQ(this.lv.diff);this.activePanel={tx,ty};
    document.getElementById('quiz-question').textContent=this.quiz.q;
    const opts=document.getElementById('quiz-options');opts.innerHTML='';
    this.quiz.opts.forEach(o=>{
      const b=document.createElement('button');b.className='quiz-btn';b.textContent=o;
      b.onclick=()=>this._answerQuiz(o,b);opts.appendChild(b);
    });
    const timerEl=document.getElementById('quiz-timer');
    if(this.quiz.timed){
      let t=10;timerEl.textContent=`⏱ 10s`;timerEl.classList.remove('hidden');
      this._qInterval=setInterval(()=>{
        t-=.1;timerEl.textContent=`⏱ ${Math.ceil(t)}s`;
        if(t<=0){clearInterval(this._qInterval);this._answerQuiz(null,null);}
      },100);
    } else timerEl.classList.add('hidden');
    document.getElementById('screen-quiz').classList.remove('hidden');
    this.state='quiz';
  }

  _answerQuiz(ans,btn){
    if(this._qInterval){clearInterval(this._qInterval);this._qInterval=null;}
    document.querySelectorAll('.quiz-btn').forEach(b=>b.disabled=true);
    const correct=ans===this.quiz.ans;
    if(correct){
      btn?.classList.add('correct');this.audio.correct();
      this.quizDone++;this.score+=200+this.lv.diff*50;
      const {tx,ty}=this.activePanel;this.map[ty][tx]=0;
      this._spawnFX(tx*TILE+TILE/2,ty*TILE+TILE/2,'#10B981',12);
    } else {
      btn?.classList.add('wrong');this.audio.wrong();
      this.lives=Math.max(0,this.lives-1);this.score=Math.max(0,this.score-50);
      this._updateHUD();
      // Alert all teachers to the player's position at the panel
      const px=this.player.x,py=this.player.y;
      this._alertMarker={x:px,y:py,life:7};
      this.teachers.forEach(t=>{
        t.state='alert';t.alertPos={x:px,y:py};t.alertTimer=7;t.detTimer=0;
      });
      this.audio.detected();this.flashTimer=.6;
    }
    this._updateHUD();
    setTimeout(()=>{
      document.getElementById('screen-quiz').classList.add('hidden');
      this.state='playing';
      if(this.lives<=0)this._gameOver();
    },900);
  }

  // ─── VENDING ───
  _openVend(){
    this.state='vending';
    document.getElementById('vend-coins').textContent=this.coins;
    document.getElementById('vend-msg').textContent='';
    document.getElementById('screen-vend').classList.remove('hidden');
  }
  _closeVend(){
    document.getElementById('screen-vend').classList.add('hidden');
    this.state='playing';
  }
  _buyVend(item,cost,effect){
    if(this.coins<cost){document.getElementById('vend-msg').textContent='Not enough coins!';return;}
    this.coins-=cost;
    if(effect==='stamina')this.player.stamina=this.player.maxSt;
    if(effect==='life')this.lives=Math.min(5,this.lives+1);
    if(effect==='score')this.score+=200;
    this.inventory.push('vend_'+item);this.audio.pickup();
    document.getElementById('vend-coins').textContent=this.coins;
    document.getElementById('vend-msg').textContent='✓ Got it!';
    this._updateHUD();
  }

  // ─── ROPE MINI-GAME ───
  _startRope(){
    this.state='rope';
    this.ropeState={hits:0,misses:0,target:8,interval:.65,next:.65,
      ropeAngle:0,active:false,winTimer:0,win:.25,done:false};
    document.getElementById('rope-progress').textContent='0 / 8';
    document.getElementById('rope-miss').textContent='❌❌❌';
    document.getElementById('screen-rope').classList.remove('hidden');
  }

  _updateRope(dt){
    const rs=this.ropeState;if(rs.done)return;
    rs.ropeAngle+=dt*3.5;rs.next-=dt;
    if(rs.next<=0){
      rs.next=rs.interval;rs.active=true;rs.winTimer=rs.win;
      this.audio.beep(440,.05,'square',.2);
    }
    if(rs.active){rs.winTimer-=dt;if(rs.winTimer<=0){rs.active=false;rs.misses++;this._updateRopeUI();if(rs.misses>=3)this._endRope(false);}}
    this._renderRopeCanvas();
  }

  _ropeHit(){
    const rs=this.ropeState;if(!rs||rs.done)return;
    if(rs.active){
      rs.hits++;rs.active=false;rs.misses=Math.max(0,rs.misses-1);
      this.audio.correct();this._updateRopeUI();
      if(rs.hits>=rs.target)this._endRope(true);
    } else {
      this.audio.beep(200,.1,'sawtooth',.15);
    }
  }

  _updateRopeUI(){
    const rs=this.ropeState;
    document.getElementById('rope-progress').textContent=`${rs.hits} / ${rs.target}`;
    document.getElementById('rope-miss').textContent='❌'.repeat(rs.misses)+'⬜'.repeat(3-rs.misses);
  }

  _endRope(success){
    this.ropeState.done=true;
    if(success){this.score+=300;this.audio.levelUp();document.getElementById('rope-result').textContent='🎉 +300 pts!';}
    else document.getElementById('rope-result').textContent='Better luck next time!';
    setTimeout(()=>{
      document.getElementById('screen-rope').classList.add('hidden');
      this.state='playing';this._updateHUD();
    },1500);
  }

  _renderRopeCanvas(){
    const rs=this.ropeState;
    const c=document.getElementById('rope-canvas'),ctx=c.getContext('2d');
    ctx.clearRect(0,0,c.width,c.height);
    const cx=c.width/2,cy=c.height/2,r=60;
    // Rope circle
    ctx.strokeStyle=rs.active?'#10B981':'#374151';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    // Rope end dot
    ctx.fillStyle=rs.active?'#34d399':'#6b7280';
    ctx.beginPath();
    ctx.arc(cx+Math.cos(rs.ropeAngle)*r,cy+Math.sin(rs.ropeAngle)*r,8,0,Math.PI*2);
    ctx.fill();
    // Beat indicator
    if(rs.active){
      ctx.fillStyle='rgba(16,185,129,.2)';ctx.beginPath();ctx.arc(cx,cy,r+12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#10B981';ctx.font='bold 18px Inter';ctx.textAlign='center';
      ctx.fillText('SPACE!',cx,cy+6);
    } else {
      ctx.fillStyle='#6b7280';ctx.font='14px Inter';ctx.textAlign='center';
      ctx.fillText('wait...',cx,cy+6);
    }
  }

  // ─── CAMERA ───
  _updateCamera(){
    const p=this.player;
    const tx=Math.max(0,Math.min(MAP_W*TILE-C_W,p.x-C_W/2));
    const ty=Math.max(0,Math.min(MAP_H*TILE-C_H,p.y-C_H/2));
    this.camera.x+=(tx-this.camera.x)*.12;
    this.camera.y+=(ty-this.camera.y)*.12;
  }

  // ─── PARTICLES ───
  _spawnFX(x,y,color,n){
    for(let i=0;i<n;i++){
      const a=(Math.PI*2/n)*i+Math.random()*.5,spd=30+Math.random()*60;
      this.particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:1,color});
    }
  }
  _updateParticles(dt){
    this.particles=this.particles.filter(p=>p.life>0);
    this.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.88;p.vy*=.88;p.life-=dt*2;});
  }

  // ─── RENDER ───
  _render(){
    const ctx=this.ctx;
    ctx.fillStyle='#07080F';ctx.fillRect(0,0,C_W,C_H);
    ctx.save();ctx.translate(-this.camera.x,-this.camera.y);
    this._renderMap(ctx);
    this._renderItems(ctx);
    this._renderParticles(ctx);
    this._renderTeachers(ctx);
    this._renderSpotlights(ctx);
    this._renderPlayer(ctx);
    ctx.restore();
    // Overlays
    if(this.flashTimer>0){ctx.fillStyle=`rgba(239,68,68,${this.flashTimer*.35})`;ctx.fillRect(0,0,C_W,C_H);}
    if(this.player?.detected){
      ctx.fillStyle=`rgba(245,158,11,${.08+Math.sin(Date.now()*.008)*.04})`;
      ctx.fillRect(0,0,C_W,C_H);
    }
    // Minimap
    this._renderMinimap(ctx);
    // Controls hint
    if(!this._hintHidden){
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(C_W-200,C_H-80,195,75);
      ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='11px Inter';
      ctx.fillText('WASD/Arrows: move',C_W-192,C_H-60);
      ctx.fillText('Shift: run   E: interact',C_W-192,C_H-44);
      ctx.fillText('Space: rope mini-game',C_W-192,C_H-28);
      if(this._hintTimer===undefined)this._hintTimer=8;
      this._hintTimer-=.016;if(this._hintTimer<0)this._hintHidden=true;
    }
  }

  _renderMap(ctx){
    const cx0=Math.max(0,Math.floor(this.camera.x/TILE));
    const cy0=Math.max(0,Math.floor(this.camera.y/TILE));
    const cx1=Math.min(MAP_W,cx0+Math.ceil(C_W/TILE)+2);
    const cy1=Math.min(MAP_H,cy0+Math.ceil(C_H/TILE)+2);
    const now=Date.now();
    for(let ty=cy0;ty<cy1;ty++){
      for(let tx=cx0;tx<cx1;tx++){
        const t=this.map[ty][tx],px=tx*TILE,py=ty*TILE;
        if(t===0){
          ctx.fillStyle='#0c1120';ctx.fillRect(px,py,TILE,TILE);
          ctx.strokeStyle='rgba(255,255,255,.03)';ctx.strokeRect(px,py,TILE,TILE);
        } else if(t===1){
          ctx.fillStyle='#1e2433';ctx.fillRect(px,py,TILE,TILE);
          ctx.fillStyle='#2e3a50';ctx.fillRect(px,py,TILE,5);
          ctx.fillStyle='#141c2c';ctx.fillRect(px,py+5,TILE,TILE-5);
        } else if(t===4){
          ctx.fillStyle='#0c1120';ctx.fillRect(px,py,TILE,TILE);
          ctx.fillStyle=`rgba(16,185,129,${.1+Math.sin(now*.003)*.05})`;ctx.fillRect(px+2,py+2,TILE-4,TILE-4);
          ctx.strokeStyle='#10B981';ctx.lineWidth=1.5;ctx.strokeRect(px+3,py+3,TILE-6,TILE-6);
          ctx.fillStyle='#10B981';ctx.font='bold 14px Arial';ctx.textAlign='center';
          ctx.fillText('?',px+TILE/2,py+TILE/2+5);ctx.textAlign='left';ctx.lineWidth=1;
        } else if(t===5){
          ctx.fillStyle='#0c1120';ctx.fillRect(px,py,TILE,TILE);
          ctx.fillStyle='#451a03';ctx.fillRect(px+3,py+3,TILE-6,TILE-6);
          ctx.font='16px Arial';ctx.textAlign='center';ctx.fillText('🥤',px+TILE/2,py+TILE/2+6);ctx.textAlign='left';
        } else if(t===6){
          ctx.fillStyle='#0c1120';ctx.fillRect(px,py,TILE,TILE);
          ctx.font='16px Arial';ctx.textAlign='center';ctx.fillText('🪢',px+TILE/2,py+TILE/2+6);ctx.textAlign='left';
        } else if(t===7){
          const rdy=this.quizDone>=this.lv.reqQ;
          ctx.fillStyle='#0c1120';ctx.fillRect(px,py,TILE,TILE);
          ctx.fillStyle=rdy?`rgba(34,197,94,${.25+Math.sin(now*.003)*.15})`:'rgba(80,80,80,.2)';
          ctx.fillRect(px+2,py+2,TILE-4,TILE-4);
          if(rdy){ctx.strokeStyle='#22C55E';ctx.lineWidth=2;ctx.strokeRect(px+3,py+3,TILE-6,TILE-6);ctx.lineWidth=1;}
          ctx.font='15px Arial';ctx.textAlign='center';ctx.fillText(rdy?'🚪':'🔒',px+TILE/2,py+TILE/2+5);ctx.textAlign='left';
        }
      }
    }
  }

  _renderItems(ctx){
    const icons={note:'📋',key:'🔑',candy:'🍬'};
    this.items.forEach(it=>{
      if(it.got)return;
      const bob=Math.sin(Date.now()*.003+it.x)*.3*TILE*.15;
      // Glow
      const g=ctx.createRadialGradient(it.x,it.y,2,it.x,it.y,TILE*.6);
      g.addColorStop(0,'rgba(96,165,250,.3)');g.addColorStop(1,'rgba(96,165,250,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(it.x,it.y,TILE*.6,0,Math.PI*2);ctx.fill();
      ctx.font='16px Arial';ctx.textAlign='center';
      ctx.fillText(icons[it.t]||'⭐',it.x,it.y+bob+5);ctx.textAlign='left';
    });
  }

  _renderPlayer(ctx){
    const p=this.player;
    const g=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,p.size*3.5);
    g.addColorStop(0,'rgba(16,185,129,.35)');g.addColorStop(1,'rgba(16,185,129,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size*3.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=p.detected?'#F59E0B':'#10B981';
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.5;ctx.stroke();ctx.lineWidth=1;
    ctx.strokeStyle='#fff';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(p.x,p.y);
    ctx.lineTo(p.x+Math.cos(p.facing)*p.size*1.5,p.y+Math.sin(p.facing)*p.size*1.5);
    ctx.stroke();ctx.lineWidth=1;
    if(p.running&&Math.random()>.4){
      ctx.fillStyle='rgba(52,211,153,.6)';ctx.beginPath();
      ctx.arc(p.x-Math.cos(p.facing)*p.size+(Math.random()-.5)*6,
              p.y-Math.sin(p.facing)*p.size+(Math.random()-.5)*6,2,0,Math.PI*2);ctx.fill();
    }
  }

  _renderTeachers(ctx){
    // Draw alert-target marker first (under teachers)
    if(this._alertMarker){
      const m=this._alertMarker,pulse=.5+.5*Math.sin(Date.now()*.008);
      const r=TILE*.55+pulse*4,alpha=Math.min(m.life,1)*.7;
      ctx.strokeStyle=`rgba(239,68,68,${alpha})`;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(m.x,m.y,r,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(m.x,m.y,r*.5,0,Math.PI*2);ctx.stroke();
      // crosshair lines
      ctx.beginPath();ctx.moveTo(m.x-r,m.y);ctx.lineTo(m.x+r,m.y);
      ctx.moveTo(m.x,m.y-r);ctx.lineTo(m.x,m.y+r);ctx.stroke();
      ctx.lineWidth=1;
      ctx.fillStyle=`rgba(239,68,68,${alpha*.5})`;ctx.font='bold 9px Inter';ctx.textAlign='center';
      ctx.fillText('WRONG ANSWER HERE',m.x,m.y-r-4);ctx.textAlign='left';
    }
    this.teachers.forEach(t=>{
      const isAlert=t.state==='alert';
      const isChase=t.state==='chase';
      const col=isChase?'239,68,68':isAlert?'239,68,200':'245,158,11';
      const pulse=isAlert?(.5+.5*Math.sin(Date.now()*.012)):1;
      const g=ctx.createRadialGradient(t.x,t.y,2,t.x,t.y,t.size*3.5*pulse);
      g.addColorStop(0,`rgba(${col},.4)`);g.addColorStop(1,`rgba(${col},0)`);
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(t.x,t.y,t.size*3.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=isChase?'#ef4444':isAlert?'#e040fb':'#d97706';
      ctx.beginPath();ctx.arc(t.x,t.y,t.size,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();ctx.lineWidth=1;
      ctx.font='13px Arial';ctx.textAlign='center';
      ctx.fillText(isChase?'😡':isAlert?'🚨':'👩‍🏫',t.x,t.y-t.size-3);ctx.textAlign='left';
      // Alert: draw line from teacher to target
      if(isAlert&&t.alertPos){
        const a=Math.min(t.alertTimer/7,.7);
        ctx.strokeStyle=`rgba(239,68,68,${a*.5})`;ctx.lineWidth=1;ctx.setLineDash([4,4]);
        ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.alertPos.x,t.alertPos.y);ctx.stroke();
        ctx.setLineDash([]);ctx.lineWidth=1;
        // "!" exclamation bubble
        ctx.fillStyle=`rgba(239,68,68,${.7+.3*Math.sin(Date.now()*.015)})`;
        ctx.beginPath();ctx.arc(t.x,t.y-t.size-14,7,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 10px Inter';ctx.textAlign='center';
        ctx.fillText('!',t.x,t.y-t.size-10);ctx.textAlign='left';
      }
      if(t.detTimer>0&&!isAlert){
        const mw=28,mh=4,mx=t.x-mw/2,my=t.y-t.size-16;
        ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(mx,my,mw,mh);
        ctx.fillStyle=t.detTimer>.6?'#ef4444':'#f59e0b';
        ctx.fillRect(mx,my,mw*t.detTimer,mh);
        ctx.font='8px Inter';ctx.textAlign='center';
        ctx.fillStyle='#fff';ctx.fillText('!',t.x,my-1);ctx.textAlign='left';
      }
    });
  }

  _renderSpotlights(ctx){
    this.teachers.forEach(t=>{
      ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.angle);
      const isAlert=t.state==='alert',isChase=t.state==='chase';
      const fov=isAlert?t.fov*1.4:t.fov;
      const vd=isAlert?t.vd*1.35:t.vd;
      const alpha=isChase?.28:isAlert?.22+.08*Math.sin(Date.now()*.01):.1+t.detTimer*.18;
      const col=isChase?`rgba(239,68,68,${alpha})`:isAlert?`rgba(224,64,251,${alpha})`:`rgba(245,158,11,${alpha})`;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,vd,-fov,fov);ctx.closePath();
      ctx.fillStyle=col;ctx.fill();
      const scol=isChase?'rgba(239,68,68,.25)':isAlert?'rgba(224,64,251,.3)':'rgba(245,158,11,.2)';
      ctx.strokeStyle=scol;ctx.lineWidth=1;ctx.stroke();ctx.restore();
    });
  }

  _renderParticles(ctx){
    this.particles.forEach(p=>{
      ctx.globalAlpha=p.life;ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,3*p.life,0,Math.PI*2);ctx.fill();
    });ctx.globalAlpha=1;
  }

  _renderMinimap(ctx){
    const mw=100,mh=72,mx=C_W-mw-8,my=8,sc=mw/MAP_W;
    ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(mx,my,mw,mh);
    ctx.strokeStyle='rgba(255,255,255,.15)';ctx.strokeRect(mx,my,mw,mh);
    for(let ty=0;ty<MAP_H;ty++){
      for(let tx=0;tx<MAP_W;tx++){
        const t=this.map[ty][tx];
        if(t===1)ctx.fillStyle='#2e3a50';
        else if(t===4)ctx.fillStyle='#10B981';
        else if(t===7)ctx.fillStyle='#22C55E';
        else if(t===5)ctx.fillStyle='#f59e0b';
        else if(t===6)ctx.fillStyle='#EC4899';
        else continue;
        ctx.fillRect(mx+tx*sc,my+ty*sc,sc,sc);
      }
    }
    // Player dot
    const px=mx+this.player.x/TILE*sc,py=my+this.player.y/TILE*sc;
    ctx.fillStyle='#10B981';ctx.beginPath();ctx.arc(px,py,2.5,0,Math.PI*2);ctx.fill();
    // Teacher dots
    this.teachers.forEach(t=>{
      ctx.fillStyle=t.state==='chase'?'#ef4444':'#f59e0b';
      ctx.beginPath();ctx.arc(mx+t.x/TILE*sc,my+t.y/TILE*sc,2,0,Math.PI*2);ctx.fill();
    });
  }

  // ─── LEVEL COMPLETE ───
  _completeLevel(){
    this.state='levelcomplete';this.score+=500*(this.levelIdx+1);this.audio.levelUp();
    const diffLabel={easy:'Easy',medium:'Medium',hardcore:'Hardcore'}[this.difficulty];
    document.getElementById('lc-name').textContent=`${this.lv.name} · ${diffLabel}`;
    document.getElementById('lc-score').textContent=this.score.toLocaleString();
    document.getElementById('lc-quizzes').textContent=`${this.quizDone}/${this.lv.reqQ}`;
    document.getElementById('lc-items').textContent=this.inventory.length;
    document.getElementById('btn-next-level').classList.remove('hidden');
    this._showScreen('screen-levelcomplete');
  }
  _nextLevel(){
    this.levelIdx++;this.quizDone=0;this.particles=[];
    this._loadLevel(this.levelIdx);this._showScreen(null);this.state='playing';
    this._hintHidden=false;this._hintTimer=6;
  }

  // ─── GAME OVER ───
  _gameOver(){
    this.state='gameover';
    document.getElementById('go-score').textContent=this.score.toLocaleString();
    document.getElementById('go-level').textContent=`Stage ${this.levelIdx+1}`;
    this._showScreen('screen-gameover');
  }
  _submitScore(){
    const name=document.getElementById('go-name').value.trim()||'Anonymous';
    LB.add(name,this.score,this.levelIdx+1,this.difficulty);this._showLB();
  }

  // ─── LEADERBOARD ───
  _showLB(){
    const lb=LB.get(),table=document.getElementById('lb-table');
    const dIcon={easy:'🟢',medium:'🟡',hardcore:'🔴'};
    table.innerHTML=lb.length===0
      ?'<div class="lb-empty">No scores yet — be the first!</div>'
      :lb.map((e,i)=>`<div class="lb-row ${i===0?'lb-gold':i===1?'lb-silver':i===2?'lb-bronze':''}">
          <span class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
          <span class="lb-name">${e.name}</span>
          <span class="lb-score">${e.score.toLocaleString()}</span>
          <span class="lb-stage">${dIcon[e.diff]||'🟡'} St.${e.level}</span>
          <span class="lb-date">${e.date}</span></div>`).join('');
    this._showScreen('screen-leaderboard');this.state='leaderboard';
  }

  // ─── HUD ───
  _updateHUD(){
    document.getElementById('hud-score').textContent=this.score.toLocaleString();
    document.getElementById('hud-coins').textContent=this.coins;
    document.getElementById('hud-quizzes').textContent=`${this.quizDone}/${this.lv?.reqQ||0}`;
    const lv=document.getElementById('hud-lives');
    if(lv)lv.innerHTML=[...Array(5)].map((_,i)=>`<span class="${i<this.lives?'h-full':'h-empty'}">♥</span>`).join('');
    const inv=document.getElementById('hud-inv');
    if(inv){const ic={note:'📋',key:'🔑',candy:'🍬'};inv.innerHTML=this.inventory.map(t=>`<span>${ic[t]||'⭐'}</span>`).join('');}
    const sn=document.getElementById('hud-stage');if(sn)sn.textContent=this.lv?.name||'';
  }

  _esc(){
    if(this.state==='quiz'){document.getElementById('screen-quiz').classList.add('hidden');this.state='playing';}
    else if(this.state==='vending')this._closeVend();
    else if(this.state==='rope'){document.getElementById('screen-rope').classList.add('hidden');this.state='playing';}
    else if(this.state==='playing')this._togglePause();
    else if(this.state==='pause')this._resumeGame();
  }
}

window.addEventListener('DOMContentLoaded',()=>{window._game=null;window._startGame=()=>{window._game=new Game();};});
