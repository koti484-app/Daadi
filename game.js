const userMode = localStorage.getItem('mode') || 'human';
const aiDifficulty = (localStorage.getItem('difficulty') || 'easy').toLowerCase();

let mode = userMode;
const WHITE = "white", BLACK = "black";
let aiColor = BLACK;
let state = null;

const gameDiv = document.getElementById('game');
const playerTurn = document.getElementById('playerTurn');
const restartBtn = document.getElementById('restart');
const backToMenuBtn = document.getElementById('backToMenu');

const boardSpots = [
  [50, 50], [200, 50], [350, 50],
  [350, 200], [350, 350], [200, 350],
  [50, 350], [50, 200], [100, 100],
  [200, 100], [300, 100], [300, 200],
  [300, 300], [200, 300], [100, 300],
  [100, 200], [150,150],[200,150],[250,150],
  [250,200],[250,250],[200,250],
  [150,250],[150,200]
];
const boardLines = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],
  [8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,8],
  [16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,16],
  [1,9],[3,11],[5,13],[7,15],[17,9],[19,11],[21,13],[23,15]
];
const mills = [
  [0,1,2],[2,3,4],[4,5,6],[6,7,0],
  [8,9,10],[10,11,12],[12,13,14],[14,15,8],
  [16,17,18],[18,19,20],[20,21,22],[22,23,16],
  [1,9,17],[3,11,19],[5,13,21],[7,15,23]
];
const adjacent = [
  [1,7],[0,2,9],[1,3],[2,4,11],[3,5],[4,6,13],[5,7],[0,6,15],
  [9,15],[1,8,10,17],[9,11],[3,10,12,19],[11,13],[5,12,14,21],[13,15],[7,8,14,23],
  [17,23],[9,16,18],[17,19],[11,18,20],[19,21],[13,20,22],[21,23],[15,16,22]
];

function initState() {
  return {
    currentPlayer: WHITE,
    phase: "placing",
    selected: null,
    toRemove: false,
    board: Array(24).fill(null),
    leftToPlace: { white: 9, black: 9 },
    inPlay: { white: 0, black: 0 },
    gameOver: false
  };
}

function renderBoard() {
  let svg = `<svg viewBox="0 0 400 400" width="400" height="400">`;
  boardLines.forEach(([a,b]) => {
    svg += `<line class="board-line" x1="${boardSpots[a][0]}" y1="${boardSpots[a][1]}" x2="${boardSpots[b][0]}" y2="${boardSpots[b][1]}" />`;
  });
  for(let i=0;i<24;i++){
    let spotClass="spot";
    if(state.selected===i) spotClass += " selected";
    svg += `<circle class="${spotClass}" data-index="${i}" cx="${boardSpots[i][0]}" cy="${boardSpots[i][1]}" r="16" />`;
    if(state.board[i]){
      svg += `<circle class="piece ${state.board[i]}${state.selected===i?' selected':''}" data-index="${i}" cx="${boardSpots[i][0]}" cy="${boardSpots[i][1]}" r="13" />`;
    }
  }
  svg += `</svg>`;
  gameDiv.innerHTML = svg;
}

function updateInfo() {
  let msg = '';
  if (state.gameOver) {
    msg = 'Game Over!';
  } else if(state.phase==="placing")
    msg = `${capitalize(state.currentPlayer)}: Place (${state.leftToPlace[state.currentPlayer]} left)`;
  else if(state.toRemove)
    msg = `${capitalize(state.currentPlayer)}: Remove opponent's piece`;
  else if(state.phase==="moving")
    msg = `${capitalize(state.currentPlayer)}: Move a piece`;
  else if(state.phase==="flying")
    msg = `${capitalize(state.currentPlayer)}: Fly anywhere`;
  playerTurn.textContent = msg;
}

function resetGame(newMode=null) {
  if(newMode) mode = newMode;
  aiColor = (mode === "ai") ? BLACK : null;
  state = initState();
  backToMenuBtn.style.display = 'none'; // hide button on new game
  renderBoard();
  updateInfo();
  if (mode === "ai" && state.currentPlayer === aiColor) setTimeout(aiTurn, 450);
}

gameDiv.addEventListener('click', function(e) {
  if(state.gameOver) return;
  const tgt = e.target;
  if (!(tgt.classList.contains('spot') || tgt.classList.contains('piece'))) return;
  const idx = parseInt(tgt.getAttribute('data-index')), color = state.currentPlayer;

  if(mode==="ai" && color===aiColor) return;

  if(state.toRemove) {
    if(canRemove(idx)) {
      removePiece(idx);
      state.toRemove = false;
      state.selected = null;
      afterTurn();
    }
    return;
  }

  if(state.phase === "placing"){
    if(state.leftToPlace[color] <= 0) return; // prevent overplacing
    if(!state.board[idx]){
      placePiece(idx, color);
      if(state.toRemove) renderBoard();
      else afterTurn();
    }
  }
  else if(state.phase === "moving" || state.phase === "flying"){
    if(state.selected == null){
      if(state.board[idx] === color) state.selected = idx;
    } else {
      if(!state.board[idx]){
        if(state.phase === "moving" && !adjacent[state.selected].includes(idx)){
          state.selected = null; renderBoard(); return;
        }
        movePiece(state.selected, idx, color);
        state.selected = null;
        if(state.toRemove) renderBoard();
        else afterTurn();
      } else if(state.board[idx] === color) {
        state.selected = idx;
      } else state.selected = null;
    }
  }
  renderBoard();
  updateInfo();
});

restartBtn.addEventListener('click',()=>resetGame(mode));

backToMenuBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

function capitalize(x){return x.charAt(0).toUpperCase()+x.slice(1);}
function formsMill(spot, color){
  return mills.some(mill=>mill.includes(spot)&&mill.every(s=>state.board[s]===color));
}
function isInMill(spot, color){
  return mills.some(mill=>mill.includes(spot)&&mill.every(s=>state.board[s]===color));
}
function canRemove(spot){
  const opp=state.currentPlayer===WHITE?BLACK:WHITE;
  if(state.board[spot]!==opp) return false;
  for(let i=0;i<24;i++) if(state.board[i]===opp && !isInMill(i,opp))
    return !isInMill(spot,opp);
  return true;
}
function removePiece(idx){
  const opp=state.currentPlayer===WHITE?BLACK:WHITE;
  state.board[idx]=null;
  state.inPlay[opp]--;
  state.toRemove=false;
  if(state.inPlay[opp] < 3 && state.leftToPlace[opp] === 0){
    state.gameOver = true;
    renderBoard();
    updateInfo();
    backToMenuBtn.style.display = 'inline-block';
    alert(`${capitalize(state.currentPlayer)} wins!`);
    return;
  }
}
function placePiece(idx,color){
  state.board[idx]=color;
  state.leftToPlace[color]--;
  state.inPlay[color]++;
  if(formsMill(idx, color)){
    state.toRemove=true;
  } else {
    if(state.leftToPlace[WHITE]===0 && state.leftToPlace[BLACK]===0)
      state.phase="moving";
  }
}
function movePiece(from, to, color){
  state.board[to]=color;
  state.board[from]=null;
  if(formsMill(to,color)) state.toRemove=true;
  for(const clr of [WHITE,BLACK]){
    if(state.inPlay[clr]===3 && state.leftToPlace[clr]===0)
      state.phase="flying";
  }
  for(const clr of [WHITE,BLACK]){
    if(state.inPlay[clr]>3 && state.leftToPlace[clr]===0 && state.phase==="flying")
      state.phase="moving";
  }
}
function afterTurn(){
  if(state.gameOver) return;
  if(state.toRemove) { renderBoard(); updateInfo(); return; }
  state.selected=null;
  state.currentPlayer=state.currentPlayer===WHITE?BLACK:WHITE;
  if(mode==="ai" && state.currentPlayer===aiColor) setTimeout(aiTurn, 540);
  renderBoard(); updateInfo();
}

// AI logic (easy/medium/hard)
function aiTurn(){
  if(state.gameOver) return;
  if(state.phase==="placing"){
    let idx=aiPlaceIndex();
    placePiece(idx, aiColor);
    renderBoard(); updateInfo();
    if(state.toRemove){ setTimeout(()=>{aiRemove(); afterTurn();},440); }
    else afterTurn();
  } else if (state.phase==="moving"||state.phase==="flying"){
    let move = aiMove();
    if(move){
      movePiece(move.from,move.to,aiColor);
      renderBoard(); updateInfo();
      if(state.toRemove){ setTimeout(()=>{aiRemove(); afterTurn();},460);}
      else afterTurn();
    }
  }
}

function aiPlaceIndex() {
  if (aiDifficulty === "hard") {
    for (let i = 0; i < 24; i++) {
      if (!state.board[i]) {
        state.board[i] = aiColor;
        if (formsMill(i, aiColor)) {
          state.board[i] = null; return i;
        }
        state.board[i] = null;
      }
    }
    const plColor = aiColor === WHITE ? BLACK : WHITE;
    for (let i = 0; i < 24; i++) {
      if (!state.board[i]) {
        state.board[i] = plColor;
        if (formsMill(i, plColor)) {
          state.board[i] = null; return i;
        }
        state.board[i] = null;
      }
    }
  }
  if (aiDifficulty === "medium") {
    for (let i = 0; i < 24; i++) {
      if (!state.board[i]) {
        state.board[i] = aiColor;
        if (formsMill(i, aiColor)) {
          state.board[i] = null;
          return i;
        }
        state.board[i] = null;
      }
    }
  }
  const free = [];
  for (let i = 0; i < 24; i++) if (!state.board[i]) free.push(i);
  return free[Math.floor(Math.random() * free.length)];
}

function aiMove(){
  const board=state.board;
  let phase=state.phase,clr=aiColor;
  let canFly=(phase==="flying" && state.inPlay[aiColor]===3 && state.leftToPlace[aiColor]===0);

  if (aiDifficulty === "hard" || aiDifficulty === "medium") {
    for(let from=0;from<24;from++) if(board[from]===clr){
      let targets=(canFly? [...Array(24).keys()].filter(j=>!board[j]) : adjacent[from].filter(j=>!board[j]));
      for(let to of targets){
        board[from]=null;board[to]=clr;
        if(formsMill(to,clr)){board[from]=clr;board[to]=null;return{from,to};}
        board[from]=clr;board[to]=null;
      }
    }
  }
  if (aiDifficulty === "hard") {
    const plColor=clr===WHITE?BLACK:WHITE;
    for(let from=0;from<24;from++) if(board[from]===clr){
      let targets=(canFly? [...Array(24).keys()].filter(j=>!board[j]) : adjacent[from].filter(j=>!board[j]));
      for(let to of targets){
        board[from]=null;board[to]=plColor;
        if(formsMill(to,plColor)){board[from]=clr;board[to]=null;return{from,to};}
        board[from]=clr;board[to]=null;
      }
    }
  }
  let allMoves=[];
  for(let from=0;from<24;from++) if(board[from]===clr){
    let targets=(canFly? [...Array(24).keys()].filter(j=>!board[j]) : adjacent[from].filter(j=>!board[j]));
    for(let to of targets){allMoves.push({from,to});}
  }
  if(allMoves.length) return allMoves[Math.floor(Math.random()*allMoves.length)];
}

function aiRemove(){
  const plColor=aiColor===WHITE?BLACK:WHITE;
  for(let i=0;i<24;i++)
    if(state.board[i]===plColor && !isInMill(i,plColor)){
      removePiece(i); return;
    }
  for(let i=0;i<24;i++)
    if(state.board[i]===plColor){
      removePiece(i); return;
    }
}

resetGame(mode);
