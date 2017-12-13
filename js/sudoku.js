class GridSquareWrapper {
  constructor(divElement, parent) {
    this.divElement = divElement;
    this.parent = parent;
    this.divElement.addEventListener('click',(this.activate).bind(this));
    this.candidateWrappers = [];
    this.enterGuessFcn = null;
    this.deleteGuessFcn = null;
  }

  activate() {
    console.log('test');
    if (this.parent.activeGridSquare) {
      this.parent.activeGridSquare.divElement.classList.remove('active');
    }
    this.parent.activeGridSquare = this;
    this.divElement.classList.add('active');
  }

  // controller
  enterGuess(k) {
    if (this.enterGuessFcn) {
      this.enterGuessFcn(k);
    } else {
      console.log('EnterGuess not bound: ', k - 1);
      this.showGuess(k - 1);
    }
  }

  deleteGuess() {
    if (this.deleteGuessFcn) {
      this.deleteGuessFcn();
    } else {
      console.log('DeleteGuess not bound');
      this.hideGuess();
    }
  }

  // view
  showGuess(k) {
    this.divElement.childNodes[0].innerHTML = (k + 1);
    this.divElement.childNodes[1].hidden = true;
    this.divElement.childNodes[0].hidden = false;
  }

  hideGuess(k) {
    this.divElement.childNodes[0].hidden = true;
    this.divElement.childNodes[1].hidden = false;
    this.divElement.childNodes[0].innerHTML = '';
  }

  setFlag(flag,val) {
    if (val) {
      this.divElement.classList.add(flag);
    } else {
      this.divElement.classList.remove(flag);
    }
  }
}

class CandidateWrapper {
  constructor(divElement,parent) {
    this.divElement = divElement;
    this.parent = parent;
    this.clickFunction = function() {console.log('clickFunction not set!', this.divElement.id);};
    this.divElement.addEventListener('click',(this.clickHandler).bind(this));
  }

  setHidden(val) {
    this.divElement.hidden = val;
  }

  setFlag(flag,val) {
    if (val) {
      this.divElement.classList.add(flag);
    } else {
      this.divElement.classList.remove(flag);
    }
  }

  clickHandler() {
    if (this.clickFunction) {
      if (this.parent.parent.activeGridSquare == this.parent){
        // if parent square is the activeGridSquare
        this.clickFunction();
      }
    }
  }

}

class HTMLGrid {
  constructor(width) {
    this.activeGridSquare = null;
    this.gridSquareWrappers = [];

    this.wrapper = document.createElement('div');

    this.focusTrap = document.createElement('input');
    this.focusTrap.id = "focus-trap";
    this.wrapper.appendChild(this.focusTrap);
    var tbl = document.createElement('table');
    this.wrapper.appendChild(tbl);
    var tblBody = document.createElement('tbody');
    tbl.appendChild(tblBody);
    // construct outer sudoku grid table
    for (var i = 0; i < 9; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < 9; j++) {
            // construct html elements and create hierarchy
            var tblCell = document.createElement('td');
            row.appendChild(tblCell);
            var wrapper = document.createElement('div');
            tblCell.appendChild(wrapper);

            var gridSquareWrapper = new GridSquareWrapper(wrapper,this)
            this.gridSquareWrappers.push(gridSquareWrapper);

            var guessDiv = document.createElement('div');
            wrapper.appendChild(guessDiv);
            var candidateTable = document.createElement('table');
            wrapper.appendChild(candidateTable);
            var innerBody = document.createElement('tbody');
            candidateTable.appendChild(innerBody);

            // font sizing
            guessDiv.style.fontSize = (width*0.08) + 'px';
            candidateTable.style.fontSize = (width*0.027) + 'px';

            // construct inner candidate table
            for (var k = 0; k < 3; k++) {
                var innerRow = document.createElement('tr');
                for (var l = 0; l < 3; l++) {
                    var candidateNum = l + 3 * k;
                    var candidateCell = document.createElement('td');
                    var candidateWrapper = document.createElement('div');
                    gridSquareWrapper.candidateWrappers.push(
                      new CandidateWrapper(candidateWrapper,gridSquareWrapper));
                    candidateWrapper.innerHTML = candidateNum + 1;
                    candidateWrapper.id =
                                  'R' + i + 'C' + j + 'N' + candidateNum;
                    candidateCell.classList.add('candidate');
                    candidateWrapper.classList.add('candidate-wrapper');
                    candidateCell.appendChild(candidateWrapper);
                    innerRow.appendChild(candidateCell);

                }
                innerBody.appendChild(innerRow);
            }

            // add css classes for styling
            wrapper.classList.add('cell-wrapper');
            candidateTable.classList.add('candidates');
            guessDiv.classList.add('guess');
            tblCell.classList.add('grid-square');


        }
        tblBody.appendChild(row);
        row.classList.add('grid-row');
    }

    // attach event handlers to container and focustrap
    var trapFocus = function() {this.focusTrap.focus();};
    this.wrapper.addEventListener(
      'click', trapFocus.bind(this));
    this.focusTrap.addEventListener(
      'keypress', this.keypressHandler.bind(this));

  }

  keypressHandler(event) {
    if (this.activeGridSquare) {
      if (/^[1-9]$/.test(event.key)) {
        this.activeGridSquare.enterGuess(parseInt(event.key));
      } else if (event.key == 'Delete') {
        this.activeGridSquare.deleteGuess();
      }
    }
  }
}

class Candidate {
  constructor(parent) {
    this.parent = parent;
    this.valid = true;
    this.constraintList = [];
    this.setFlagFcn = null;
    this.setHiddenFcn = null;
  }

  bindFcns(candidateWrapper) {
    this.setHiddenFcn = candidateWrapper.setHidden.bind(candidateWrapper);
    this.setFlagFcn = candidateWrapper.setFlag.bind(candidateWrapper);
    candidateWrapper.clickFunction = this.toggle.bind(this);
  }

  toggle () {
    console.log('Toggle!');
  }
}

class GridSquare {
  constructor() {
    this.prefilled = false;
    this.candidateList = [];
    this.showGuessFcn = null;
    this.hideGuessFcn = null;
    this.setFlagFcn = null;
  }

  bindFcns(GridSquareWrapper) {
    this.showguessFcn = GridSquareWrapper.showGuess.bind(GridSquareWrapper);
    this.hideGuessFcn = GridSquareWrapper.hideGuess.bind(GridSquareWrapper);
    this.setFlagFcn = GridSquareWrapper.setFlag.bind(GridSquareWrapper);
    GridSquareWrapper.enterGuessFcn = this.enterGuess.bind(this);
    GridSquareWrapper.deleteGuessFcn = this.deleteGuess.bind(this);
  }

  enterGuess(k) {
    console.log('EnterGuess bound ', k);
  }
  deleteGuess() {
    console.log('DeleteGuess bound');
  }
}

class Constraint {
  constructor(type) {
    this.candidateList = [];
    this.type = type;
  }
}

class LogicGrid {
  constructor() {
    this.constraintList = [];
    this.squareList = [];
    var boxConstraints = [];
    var rowConstraints = [];
    var colConstraints = [];
    var cellConstraints = [];

    // create constraints
    for (var i = 0; i < 9; i++) {
      boxConstraints[i] = [];
      rowConstraints[i] = [];
      colConstraints[i] = [];
      cellConstraints[i] = [];
      for (var j = 0; j < 9; j++) {
        boxConstraints[i][j] = new Constraint('box');
        rowConstraints[i][j] = new Constraint('row');
        colConstraints[i][j] = new Constraint('col');
        cellConstraints[i][j] = new Constraint('cell');
        this.constraintList.push(boxConstraints[i][j]);
        this.constraintList.push(rowConstraints[i][j]);
        this.constraintList.push(colConstraints[i][j]);
        this.constraintList.push(cellConstraints[i][j]);
      }
    }

    // construct outer sudoku grid table
    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        // construct inner candidate table
        var gridSquare = new GridSquare();
        this.squareList.push(gridSquare);
        for (var k = 0; k < 9; k++) {
          // create candidate and add to corresponding square
          var candidate = new Candidate();
          gridSquare.candidateList.push(candidate);

          // create link between constraints and candidates
          let boxNum = Math.floor(i/3) + Math.floor(j/3) * 3;
          boxConstraints[boxNum][k].candidateList.push(candidate);
          rowConstraints[i][k].candidateList.push(candidate);
          colConstraints[j][k].candidateList.push(candidate);
          cellConstraints[i][j].candidateList.push(candidate);
          candidate.constraintList = [ boxConstraints[boxNum][k],
                                       rowConstraints[i][k],
                                       colConstraints[j][k],
                                       cellConstraints[i][j] ];

        }
      }
    }
  }

  bindViewController(viewGrid) {
    for (var i = 0; i < 81; i++) {
      this.squareList[i].bindFcns(viewGrid.gridSquareWrappers[i]);
      for (var j = 0; j < 9; j++) {
        this.squareList[i].candidateList[j].bindFcns(
          viewGrid.gridSquareWrappers[i].candidateWrappers[j]);
      }
    }
  }
}

class Sudoku {
  constructor(divContainerId) {

    // build html structure and attach to document
    this.container = document.getElementById(divContainerId);
    var viewGrid = new HTMLGrid(this.container.offsetWidth);
    this.container.appendChild(viewGrid.wrapper);

    //
    var logicGrid = new LogicGrid();
    logicGrid.bindViewController(viewGrid);

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
        this.cellGrid[m][n].clearSolveFlag('cell');
        if (countSquare == 1) {
          this.cellGrid[m][n].setSolveFlag(candidateID,'cell');
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
        this.cellGrid[m][n].clearSolveFlag(groupType);
        for (var k = 0; k < solveFlags.length; k++){
          if (this.cellGrid[m][n].candidates[solveFlags[k]]) {
            this.cellGrid[m][n].setSolveFlag(solveFlags[k],groupType);
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
      } else if (event.key == 'd') {
        this.downloadGrid();
      }
    }
  }

  downloadGrid() {
    console.log(JSON.stringify(this.cellGrid.map(function(gridRow) {
        return gridRow.map(function (gridSquare) {
          return gridSquare.guess;
        })
      })));
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
    this.prefilled = false;

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

  enterGuess(k,prefilled = false) {
    if (!this.prefilled) {
      this.guess = parseInt(k);
      this.guessDiv.innerHTML = k;
      this.candidateTable.hidden = true;
      this.guessDiv.hidden = false;
      if (prefilled) {
        this.prefilled = prefilled;
        this.tblCell.classList.add('prefilled');
      }
    }
  }

  deleteGuess() {
    if (!this.prefilled) {
      this.guess = null;
      this.guessDiv.innerHTML = '';
      this.guessDiv.hidden = true;
      this.candidateTable.hidden = false;
    }
  }

  setSolveFlag(k,groupType) {
    this.candidateCells[k].classList.add(groupType + '-solve-flag');
  }

  clearSolveFlag(groupType) {
    for (var k = 0; k < 9; k++) {
      this.candidateCells[k].classList.remove(groupType + '-solve-flag');
    }
  }

  setConflictFlag(flag,groupType) {
    if (flag) {
      this.tblCell.classList.add(groupType + '-conflict');
    } else {
      this.tblCell.classList.remove(groupType + '-conflict');
    }
  }


}
