class Sudoku {
  constructor(divContainerId) {

    const urlParams = new URLSearchParams(window.location.search);
    const puzzle = urlParams.get('puzzle');

    // build html structure
    this.container = document.getElementById(divContainerId);
    this.viewGrid = new HTMLGrid(this.container.offsetWidth);


    // build logic structure and CommandQueue
    this.logicGrid = new LogicGrid();
    this.actionQueue = new CommandQueue(
            this.logicGrid.checkConstraints.bind(this.logicGrid));

    this.actionQueue.bindViewControllerLogic(this.viewGrid,this.logicGrid);

    this.logicGrid.checkConstraints();
    this.container.appendChild(this.viewGrid.wrapper);

    if( !puzzle ){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = this.loadXhttpPuzzle.bind(this,xhttp);
        xhttp.open("GET", "puzzle.txt", true);
        xhttp.send();
    }else{
        this.loadQueryPuzzle(puzzle);
    }


  }
  setMode(button, mode) {
    clearClass("selected-mode");
    button.classList.add("selected-mode");
  }

  solvePuzzle() {
    var solutionList = [];
    solveBoard(this.logicGrid.constraintList,solutionList);
    this.loadSolution(solutionList);
  }

  loadSolution(solutionList) {
    solutionList.forEach(candidate => {candidate.parent.enterGuess(candidate.id)});
    this.viewGrid.focusTrap.focus();
  }

    loadQueryPuzzle(puzzle) {
      let k = 0;
      for (var i = 0; i < 9; i++) { // column
        for (var j = 0; j < 9; j++) { // row
          let cell = j + (i*9);
          let value =puzzle.substring(cell, cell+1);

          if ( /^[1-9]$/.test(value) ) {
            this.logicGrid.squareList[k].enterGuessFcn(value - 1, true);
            var clue = new Constraint('clue');
            clue.candidateList.push(this.logicGrid.squareList[k].candidateList[value - 1]);
            this.logicGrid.squareList[k].candidateList[value - 1].constraintList.push(clue);
            this.logicGrid.constraintList.push(clue);
          }
          k++;
        }
      }
      this.logicGrid.checkConstraints();
      this.container.appendChild(this.viewGrid.wrapper);
    }

    loadXhttpPuzzle(xhttp) {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        let board = JSON.parse(xhttp.responseText);
        let k = 0;
        for (var i = 0; i < 9; i++) {
          for (var j = 0; j < 9; j++) {
            if (board[i][j]) {
              this.logicGrid.squareList[k].enterGuessFcn(board[i][j] - 1, true);
              var clue = new Constraint('clue');
              clue.candidateList.push(this.logicGrid.squareList[k].candidateList[board[i][j] - 1]);
              this.logicGrid.squareList[k].candidateList[board[i][j] - 1].constraintList.push(clue);
              this.logicGrid.constraintList.push(clue);
            }
            k++;
          }
        }
        this.logicGrid.checkConstraints();
        this.container.appendChild(this.viewGrid.wrapper);

      }
    }

}

function clearClass(className) {
  var elements = document.getElementsByClassName(className);
  while(elements.length > 0){
      elements[0].classList.remove(className);
  }
}
var f = [];
function factorial (n) {
  if (n == 0 || n == 1)
    return 1;
  if (f[n] > 0)
    return f[n];
  return f[n] = factorial(n-1) * n;
}

numValidCandidates = function(constraint) {
  return constraint.candidateList.reduce((acc,candidate) => acc + !candidate.eliminated,0);
}

smaller = function(constraintA,constraintB) {
  if (numValidCandidates(constraintA) > numValidCandidates(constraintB)) {
    return constraintB;
  } else {
    return constraintA;
  }
}

function shuffle (array) {
  var i = 0
    , j = 0
    , temp = null

  for (i = array.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1))
    temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

solveBoard = function(constraintList,solutionList) {
  var validConstraints = constraintList.filter(constraint => !constraint.satisfied);
  if (validConstraints.length == 0) {
    return 1;
  }
  var selectedConstraint = validConstraints.reduce(smaller);
  var numValid = numValidCandidates(selectedConstraint);
  if (numValid == 0) {
    return 0;
  }
  var validCandidates = selectedConstraint.candidateList.filter(candidate => !candidate.eliminated);
  shuffle(validCandidates);

  for (var i = 0; i<validCandidates.length; i++) {
    let candidate = validCandidates[i];
    solutionList.push(candidate);
    var validSubConstraints = candidate.constraintList.filter(constraint => !constraint.satisfied);
    var validElimCandidates = validSubConstraints.reduce((acc,constraint) => acc.concat(constraint.candidateList),[] )
                                .filter(candidate => !candidate.eliminated);
    validElimCandidates.forEach(candidate => {candidate.eliminated = true;});
    validSubConstraints.forEach(constraint => {constraint.satisfied = true;});

    var count = solveBoard(validConstraints,solutionList);
    if (count > 0) {return count;}

    validElimCandidates.forEach(candidate => {candidate.eliminated = false;});
    validSubConstraints.forEach(constraint => {constraint.satisfied = false;});
    solutionList.pop();
  }
  return 0;
}


class GridSquareWrapper {
  constructor(divElement, parent) {
    this.divElement = divElement;
    this.parent = parent;
    this.divElement.addEventListener('click',(this.activate).bind(this));
    this.candidateWrappers = [];
    this.enterGuessFcn = null;
  }

  activate() {
    if (this.parent.activeGridSquare) {
      this.parent.activeGridSquare.divElement.classList.remove('active');
    }
    this.parent.activeGridSquare = this;
    this.divElement.classList.add('active');
  }

  // controller
  enterGuess(k) {
    if (this.enterGuessFcn) {
      this.enterGuessFcn(k - 1);
    } else {
      console.log('EnterGuess not bound: ', k - 1);
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

class GridSquare {
  constructor() {
    this.id = null;
    this.guessedCandidate = null;
    this.prefilled = false;
    this.candidateList = [];
    this.showGuessFcn = null;
    this.hideGuessFcn = null;
    this.setFlagFcn = null;
    this.actionQueue = null;
  }

  enterGuess(newGuess, prefilled = false) {
    var previousGuess = -1;
    if (this.guessedCandidate) {previousGuess = this.guessedCandidate.id};
    if (!this.prefilled && (previousGuess != newGuess)) {
      var action = new Command()
      action.actionFcn = this.enterGuessFcn.bind(this,newGuess);
      action.undoFcn = this.enterGuessFcn.bind(this,previousGuess);
      this.actionQueue.push(action);
    }
  }

  enterGuessFcn(k, prefill = false) {
    if (this.guessedCandidate) {
      this.guessedCandidate.unguess();
    }
    if (k != -1) {
      this.showguessFcn(k);
      this.candidateList[k].guess();
      this.guessedCandidate = this.candidateList[k];
      //this.guessedCandidate.update();
    } else {
      this.hideGuessFcn();
      this.guessedCandidate = null;
    }
    if (prefill) {
      this.prefilled = true;
      this.setFlagFcn('prefilled',true);
    }
  }

}

class CandidateWrapper {
  constructor(divElement,parent) {
    this.divElement = divElement;
    this.parent = parent;
    this.clickFunction = null;
    this.divElement.addEventListener('click',(this.clickHandler).bind(this));
  }

  setHidden(val) {
    this.divElement.childNodes[0].hidden = val;
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

class Candidate {
  constructor(parent,id) {
    this.parent = parent;
    this.id = id;
    this.validProp = true;
    this.toggled = null;
    this.guessed = false;
    this.constraintList = [];
    this.setFlagFcn = null;
    this.setHiddenFcn = null;
    this.actionQueue = null;

    this.eliminated = false;
  }
  get valid() {
    if (this.toggled != null) {
      return this.toggled;
    } else {
      return this.validProp;
    }
  }

  set valid(val) {
    this.validProp = val;
    this.setHiddenFcn(!this.valid);
  }

  setConflict(type, val) {
    if (this.guessed) {
      this.parent.setFlagFcn(type + '-conflict-flag',this.guessed & val);
    }
    this.setFlagFcn(type + '-conflict-flag',val);
  }

  toggle() {
    var action = new Command()
    action.actionFcn = this.toggleFcn.bind(this);
    action.undoFcn = this.toggleFcn.bind(this);
    this.actionQueue.push(action);
  }

  toggleFcn() {
    if (this.toggled != null && this.toggled == this.valid) {
      this.toggled = null;
    } else {
      this.toggled = !this.valid;
    }
    this.setHiddenFcn(!this.valid);
    this.constraintList.forEach(constraint => {constraint.updateCandidates();});
  }

  guess() {
    this.guessed = true;
    this.constraintList.forEach(constraint => {constraint.updateCandidates();});
  }

  unguess() {
    this.guessed = false;
    this.constraintList.forEach(constraint => {constraint.updateCandidates();});
    this.parent.setFlagFcn('collision-conflict-flag',false);
  }

  update() {
    this.valid = !this.constraintList.some(
      constraint => constraint.candidateList.some(
        candidate => (candidate != this) && candidate.guessed));
    this.setConflict('collision',(this.guessed && !this.validProp) ||
                           (this.valid && !this.validProp) );
  }

}

class Constraint {
  constructor(type) {
    this.candidateList = [];
    this.type = type;

    this.satisfied = false;
  }

  updateCandidates() {
    this.candidateList.forEach(candidate => {candidate.update();});
  }

  check() {
    let numOptions = this.candidateList.reduce((sum,candidate) => sum + candidate.valid, 0);
    this.candidateList.forEach(candidate => {
      candidate.setFlagFcn(this.type + '-solve-flag',(numOptions == 1) && candidate.valid);
    });

  }
}

class Command {
  constructor(auto = false) {
    this.auto = auto; // flag for whether this action was created by user or automatically
  }

  execute() {
    this.actionFcn();
  }

  undo() {
    this.undoFcn();
  }
}

class CommandQueue {
  constructor(boardUpdate) {
    this.queue = [];
    this.current = -1;
    this.boardUpdateFcn = boardUpdate;
  }

  push(commandObject) {
    commandObject.execute();
    this.current++;
    this.queue.splice(this.current);
    this.queue.push(commandObject);
    this.boardUpdateFcn();
  }

  undo() {
    if (this.current > -1) {
      this.queue[this.current].undo();
      this.current--;
      this.boardUpdateFcn();
    }
  }

  redo() {
    if (this.current < this.queue.length - 1) {
      this.current++;
      this.queue[this.current].execute();
      this.boardUpdateFcn();
    }
  }

  bindViewControllerLogic(viewGrid,logicGrid) {
    viewGrid.actionQueue = this;
    for (var i = 0; i < 81; i++) {
      this.bindGridSquareFcns(logicGrid.squareList[i], viewGrid.gridSquareWrappers[i]);
      for (var j = 0; j < 9; j++) {
        this.bindCandidateFcns(logicGrid.squareList[i].candidateList[j],
          viewGrid.gridSquareWrappers[i].candidateWrappers[j]);
      }
    }
  }

  bindCandidateFcns(candidate,candidateWrapper) {
    candidate.setHiddenFcn = candidateWrapper.setHidden.bind(candidateWrapper);
    candidate.setFlagFcn = candidateWrapper.setFlag.bind(candidateWrapper);
    candidate.actionQueue = this;
    candidateWrapper.clickFunction = candidate.toggle.bind(candidate);
  }

  bindGridSquareFcns(GridSquare, GridSquareWrapper) {
    GridSquare.showguessFcn = GridSquareWrapper.showGuess.bind(GridSquareWrapper);
    GridSquare.hideGuessFcn = GridSquareWrapper.hideGuess.bind(GridSquareWrapper);
    GridSquare.setFlagFcn = GridSquareWrapper.setFlag.bind(GridSquareWrapper);
    GridSquare.actionQueue = this;
    GridSquareWrapper.enterGuessFcn = GridSquare.enterGuess.bind(GridSquare);
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
        gridSquare.id = 'R' + i + 'C' + j;
        this.squareList.push(gridSquare);
        for (var k = 0; k < 9; k++) {
          // create candidate and add to corresponding square
          var candidate = new Candidate(gridSquare,k);
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

  checkConstraints() {
    this.constraintList.forEach(constraint => {constraint.check();});
  }
}

class HTMLGrid {
  constructor(width) {
    this.activeGridSquare = null;
    this.gridSquareWrappers = [];
    this.actionQueue = null;

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
            candidateWrapper.innerHTML =
                    '<span>' + (candidateNum + 1) + '</span>';
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
      'keydown', this.keypressHandler.bind(this));


  }

keypressHandler(event) {
    if (!event.ctrlKey & !event.shiftKey & !event.altKey & !event.metaKey){
      if (this.activeGridSquare) {
        if (/^[1-9]$/.test(event.key)) {
          this.activeGridSquare.enterGuess(parseInt(event.key));
        } else if (event.key == 'Delete' || event.key == 'Backspace') {
          this.activeGridSquare.enterGuess(0);
        } else if (event.key == 'ArrowLeft' || event.key == 'ArrowUp' ||  event.key == 'ArrowRight' || event.key == 'ArrowDown' ) {
          var activeHtmlRow = this.activeGridSquare.divElement.closest("tr");
          var activeHtmlCell = this.activeGridSquare.divElement.closest("td");
          var tableBody = activeHtmlRow.closest("tbody")
          var columnIndex = Array.prototype.indexOf.call(activeHtmlRow.children, activeHtmlCell);
          var rowIndex = Array.prototype.indexOf.call(tableBody.children, activeHtmlRow);


          var newColumnIndex = columnIndex;
          var newRowIndex = rowIndex;
          if (event.key == 'ArrowLeft'){ newColumnIndex = columnIndex-1;}
          if (event.key == 'ArrowRight'){ newColumnIndex = columnIndex+1;}
          if (event.key == 'ArrowUp'){ newRowIndex = rowIndex-1;}
          if (event.key == 'ArrowDown'){ newRowIndex = rowIndex+1;}
          tableBody.children[newRowIndex].children[newColumnIndex].children[0].click();
        }
      }
    } else if  (event.ctrlKey & !event.shiftKey & !event.altKey & !event.metaKey) {
      if (event.key == 'z' || event.key == 'Z') {
        this.actionQueue.undo();
      }
      if (event.key == 'y' || event.key == 'Y') {
        this.actionQueue.redo();
      }
    }
  }
}
