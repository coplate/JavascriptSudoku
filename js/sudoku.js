class sudoku {
  constructor(divContainerId) {

    this.cellGrid = [ [], [], [], [], [], [], [], [], [] ];
    this.activeSquare = null;

    // build html structure and assemble hierarchy:
    this.container = document.getElementById(divContainerId);
    // make container square
    this.container.style.height = this.container.offsetWidth;

    this.wrapper = document.createElement('div');

    this.focusTrap = document.createElement('input');
    this.focusTrap.id = "focus-trap";
    this.wrapper.appendChild(this.focusTrap);
    var tbl = document.createElement('table');
    this.wrapper.appendChild(tbl);
    var tblBody = document.createElement('tbody');
    tbl.appendChild(tblBody);
    // construct sudoku grid
    for (var i = 0; i < 9; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < 9; j++) {
            // build and attach grid square
            this.cellGrid[i][j] = new gridSquare(i,j);
            row.appendChild(this.cellGrid[i][j].tblCell);
            // size fonts according to container width
            this.cellGrid[i][j].sizeFonts(this.container.offsetWidth);
            // attach event handlers to grid squares
            this.cellGrid[i][j].bindCandidateClickHandler(
              this.candidateClickHandler.bind(this,i,j));
            this.cellGrid[i][j].bindSquareClickHandler(
              this.activateSquare.bind(this,i,j));
        }
        tblBody.appendChild(row);
        row.classList.add('grid-row');
    }

    // attach event handlers to container and focustrap
    var trapFocus = function() {this.focusTrap.focus();};
    this.container.addEventListener(
      'click', trapFocus.bind(this));
    this.focusTrap.addEventListener(
      'keypress', this.keypressHandler.bind(this));

    // attach wrapper to html document
    this.container.appendChild(this.wrapper);
  }

  eliminateNeighborCandidates(i,j,guess) {
    var neighborList = this.neighbors(i,j);
    for (var k = 0; k < neighborList.length; k++) {
      let [m,n] = neighborList[k];
      this.cellGrid[m][n].removeCandidate(guess);
    }
    this.checkGrid();
  }

  updateNeighborCandidates(i,j,guess) {
    var neighborList = this.neighbors(i,j);
    for (var k = 0; k < neighborList.length; k++) {
      let [m,n] = neighborList[k];
      this.updateCandidates(m, n);
    }
    this.checkGrid();
  }

  updateCandidates(i,j) {
    var neighborList = this.neighbors(i,j);
    for (var k = 0; k < 9; k++) {
      this.cellGrid[i][j].addCandidate(k);
    }
    for (var k = 0; k < neighborList.length; k++) {
      let [m,n] = neighborList[k];
      if (this.cellGrid[m][n].guess) {
        this.cellGrid[i][j].removeCandidate(this.cellGrid[m][n].guess - 1);
      }
    }
  }

  checkGrid() {
    for (var k = 0; k<9; k++) {
      this.checkGroup(this.listBoxGroup(k),'box');
      this.checkGroup(this.listRowGroup(k),'row');
      this.checkGroup(this.listColGroup(k),'col');
    }
  }

  // check for conflict between guesses and lone candidates for solving
  checkGroup(group, groupType) {
    var candidates = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var guesses = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var conflictFlags = [];
    var solveFlags = [];
    for (var j = 0; j<9; j++) {
      let [m,n] = group[j];
      if (this.cellGrid[m][n].guess){
        guesses[this.cellGrid[m][n].guess - 1]++;
      } else {
        var countSquare = 0; // count for candidates in single square
        var candidateID = null;
        for (var k = 0; k<9; k++){
          if (this.cellGrid[m][n].candidates[k]) {
            countSquare += 1;
            candidates[k] += 1;
            candidateID = k;
          }
        }
        if (countSquare == 1) {
          this.cellGrid[m][n].setSolveFlag(candidateID);
        }
      }
    }
    for (var k = 0; k < 9; k++) {
      if (guesses[k] > 1) {conflictFlags.push(k)};
      if (candidates[k] == 1) {solveFlags.push(k)};
    }
    for (var j = 0; j<9; j++) {
      let [m,n] = group[j];
      let found = false;
      let solvable = false;
      if (this.cellGrid[m][n].guess){
        for (var k = 0; k < conflictFlags.length; k++){
          found = found ||
            (this.cellGrid[m][n].guess - 1 == conflictFlags[k]);
        }
      } else {
        for (var k = 0; k < solveFlags.length; k++){
          if (this.cellGrid[m][n].candidates[solveFlags[k]]) {
            this.cellGrid[m][n].setSolveFlag(solveFlags[k]);
          }
        }
      }
      this.cellGrid[m][n].setConflictFlag(found,groupType);
    }
  }

  listBoxGroup(k) {
    var group = [];
    var mLow = (k % 3) * 3;
    var nLow = Math.floor(k/3) * 3;
    for (var m = mLow; m < mLow + 3; m++) {
      for (var n = nLow; n < nLow + 3; n++) {
        group.push([m,n]);
      }
    }
    return group;
  }

  listColGroup(j) {
    var group = [];
    for (var m = 0; m<9; m++) {
      group.push([m,j]);
    }
    return group;
  }

  listRowGroup(i) {
    var group = [];
    for (var n = 0; n<9; n++) {
      group.push([i,n]);
    }
    return group;
  }

  neighbors(i,j) {
    var neighborList = [];
    neighborList = neighborList.concat(
      this.listBoxGroup(Math.floor(i/3) + Math.floor(j/3) * 3));
    neighborList = neighborList.concat(this.listRowGroup(i));
    neighborList = neighborList.concat(this.listColGroup(j));
    return neighborList;
  }

  candidateClickHandler(i,j,k) {
    if (this.activeSquare) {
      let [m,n] = this.activeSquare;
      if (m == i & n == j ) {
        this.cellGrid[i][j].toggleCandidate(k);
        this.checkGrid();
      }
    }
  }

  keypressHandler(event) {
    if (this.activeSquare) {
      let [m,n] = this.activeSquare;
      if (/^[1-9]$/.test(event.key)) {
        this.cellGrid[m][n].enterGuess(event.key);
        this.eliminateNeighborCandidates(m, n, parseInt(event.key) - 1);
      } else if (event.key == 'Delete') {
        this.cellGrid[m][n].deleteGuess();
        this.updateNeighborCandidates(m, n);
        this.checkGrid();
      }
    }
  }

  activateSquare(i,j) {
    if (this.activeSquare) {
      let [m,n] = this.activeSquare;
      this.cellGrid[m][n].deactivate();
    }
    this.cellGrid[i][j].activate();
    this.activeSquare = [i,j];
  }
}

class gridSquare {
  constructor(i,j) {
    this.guess = null;
    this.candidates = [true,true,true,true,true,true,true,true,true];
    this.candidateCells = [];

    // construct html elements and create hierarchy
    this.tblCell = document.createElement('td');
    var wrapper = document.createElement('div');
    this.tblCell.appendChild(wrapper);
    this.guessDiv = document.createElement('div');
    wrapper.appendChild(this.guessDiv);
    this.candidateTable = document.createElement('table');
    wrapper.appendChild(this.candidateTable);
    var tblBody = document.createElement('tbody');
    this.candidateTable.appendChild(tblBody);

    // construct candidate table
    for (var i = 0; i < 3; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < 3; j++) {
            var candidateNum = j + 3 * i;
            this.candidateCells[candidateNum] = document.createElement('td');
            var candidate = document.createElement('div');
            candidate.innerHTML = candidateNum + 1;
            candidate.classList.add('N' + candidateNum);
            this.candidateCells[candidateNum].classList.add('candidate');
            this.candidateCells[candidateNum].appendChild(candidate);
            row.appendChild(this.candidateCells[candidateNum]);
        }
        tblBody.appendChild(row);
    }

    // add css classes for styling
    wrapper.classList.add('cell-wrapper');
    this.candidateTable.classList.add('candidates');
    this.guessDiv.classList.add('guess');
    this.tblCell.classList.add('grid-square');

  }

  bindCandidateClickHandler(clickHandler) {
    for (var k = 0; k < 9; k++) {
      this.candidateCells[k].addEventListener('click',
        clickHandler.bind(null,k));
    }
  }

  bindSquareClickHandler(clickHandler) {
    this.tblCell.addEventListener('click',clickHandler);
  }
  activate() {
    this.tblCell.classList.add('active');
  }

  deactivate() {
    this.tblCell.classList.remove('active');
  }

  toggleCandidate(k) {
    this.candidates[k] = !this.candidates[k];
    this.candidateCells[k].childNodes[0].hidden = !this.candidates[k];
  }

  removeCandidate(k) {
    this.candidates[k] = false;
    this.candidateCells[k].childNodes[0].hidden = true;
  }

  addCandidate(k) {
    this.candidates[k] = true;
    this.candidateCells[k].childNodes[0].hidden = false;
  }

  enterGuess(k) {
    this.guess = parseInt(k);
    this.guessDiv.innerHTML = k;
    this.candidateTable.hidden = true;
    this.guessDiv.hidden = false;
  }

  deleteGuess() {
    this.guess = null;
    this.guessDiv.innerHTML = '';
    this.guessDiv.hidden = true;
    this.candidateTable.hidden = false;
  }

  setSolveFlag(k) {
    this.candidateCells[k].classList.add('solve-flag');
  }

  setConflictFlag(flag,groupType) {
    if (flag) {
      this.tblCell.classList.add(groupType + '-conflict');
    } else {
      this.tblCell.classList.remove(groupType + '-conflict');
    }
  }

  sizeFonts(width) {
    this.guessDiv.style.fontSize = (width*0.08) + 'px';
    this.candidateTable.style.fontSize = (width*0.027) + 'px';
  }
}
