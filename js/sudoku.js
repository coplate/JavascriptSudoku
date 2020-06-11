class Sudoku {
  constructor(divContainerId) {

    const urlParams = new URLSearchParams(window.location.search);
    const puzzle = urlParams.get('puzzle');

    const diagonalFlag = urlParams.get('D') || "0";
    const killerFlagList = urlParams.getAll('K') || [];
    const thermoFlagList = urlParams.getAll('T') || []; // a Thermometer, like a cage, need not be a 9 digit area
    //const chessFlag = urlParams.getAll('Z') || [];


    var cageList = [];
    for (var klc = 0; klc < killerFlagList.length; klc++) {
        const arrayOfStrings = killerFlagList[klc].split(".");
        cageList[klc] = {
            "sum":arrayOfStrings[0],
            "values":arrayOfStrings[1].match(/(..?)/g),
            fresh: true
        };

    }
    var thermoList = [];
    for (var t = 0; t < thermoFlagList.length; t++) {
        thermoList[t] = {
            "values":thermoFlagList[t].match(/(..?)/g),
            fresh: true
        };
    }


    let optionFlags = {
        "diagonalFlag": diagonalFlag,
        "killerCages": cageList,
        "thermometers": thermoList,
    };

    // build html structure
    this.container = document.getElementById(divContainerId);
    this.viewGrid = new HTMLGrid(this.container.offsetWidth, optionFlags);


    // build logic structure and CommandQueue
    this.logicGrid = new LogicGrid(optionFlags);
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
    this.viewGrid.setMode(mode);
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
    let guessDiv = this.divElement.querySelector('.guess');
    let candidatesDiv = this.divElement.querySelector('.candidates');
    guessDiv.innerHTML = (k + 1);
    candidatesDiv.hidden = true;
    guessDiv.hidden = false;
  }

  hideGuess(k) {
    let guessDiv = this.divElement.querySelector('.guess');
    let candidatesDiv = this.divElement.querySelector('.candidates');
    guessDiv.hidden = true;
    candidatesDiv.hidden = false;
    guessDiv.innerHTML = '';
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
  // a candidate will set itself to invalid if:
  // there is a constraint it is part of, that has a candidate guessed
  // in concrete terms: candidate '8' in cell R0C0 ( row 0 ) will toggle itself invalid if candidate '8' in R0C4 has been guessed.
  // can this be the right location to handle thermometers?  A thermometer candidate is invalid if any number higher than it has also been chosen in a predecessor
  // or a number lower than it in a successor
  update() {
    this.valid = !this.constraintList.some(
      constraint => constraint.candidateList.some(
        candidate => (candidate != this) && candidate.guessed));

    this.setConflict('collision',(this.guessed && !this.validProp) ||
                           (this.valid && !this.validProp) );
  }

}

 /* some regions must be ordered, like thermometers
 in these regions, you must ascend or descend as appropriate
 */
class OrderedRegion {
  constructor(type) {
    this.candidateList = []; // Grid squares are part of candidates, so if we use this type we can borrow some logic
    this.type = type;
  }

//  updateCandidates() {
//    this.candidateList.forEach(candidate => {candidate.update();});
//  }

//  check() {
//    /* If this constraint is for digit 8, then check to see if there is only 1 valid candidate for digit 8 */
//    /* This is currently not working as expected for Cages, as cages are not always 9 digits big. this logic expects 9 digit regions */
//    let numOptions = this.candidateList.reduce((sum,candidate) => sum + candidate.valid, 0);
//    this.candidateList.forEach(candidate => {
//      candidate.setFlagFcn(this.type + '-solve-flag',(numOptions == 1) && candidate.valid);
//    });
//
//  }
}
/* A "Constraint" is, for example, Where can digit 8 go in this Region */
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
    /* If this constraint is for digit 8, then check to see if there is only 1 valid candidate for digit 8 */
    /* This is currently not working as expected for Cages, as cages are not always 9 digits big. this logic expects 9 digit regions */
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
  constructor(optionFlags) {
    this.constraintList = [];
    this.squareList = [];
    this.orderedRegionList = []
    var boxConstraints = [];
    var rowConstraints = [];
    var colConstraints = [];
    var cellConstraints = [];
    var diagonalConstraints = [];
    var cageConstraints = [];
    var thermoConstraints = []

    // create constraints
    for (var i = 0; i < 9; i++) {
      boxConstraints[i] = [];
      rowConstraints[i] = [];
      colConstraints[i] = [];
      cellConstraints[i] = [];
      if( optionFlags["diagonalFlag"]  & ( i+1 ) ){ // D=1 for first diagonal, D=2 for Second, D=3 for both
        diagonalConstraints[i] = [];
      }
      for (var j = 0; j < 9; j++) {
        boxConstraints[i][j] = new Constraint('box');
        rowConstraints[i][j] = new Constraint('row');
        colConstraints[i][j] = new Constraint('col');
        cellConstraints[i][j] = new Constraint('cell');
        if( optionFlags["diagonalFlag"]  & ( i+1 ) ){  // D=1 for first diagonal, D=2 for Second, D=3 for both
            diagonalConstraints[i][j] = new Constraint('diagonal'); // i=1 is R0C0-R8C8, i=2 is R0C8-R9C0 is box#, j is Candidate Value#
            this.constraintList.push(diagonalConstraints[i][j]);
        }
        this.constraintList.push(boxConstraints[i][j]);
        this.constraintList.push(rowConstraints[i][j]);
        this.constraintList.push(colConstraints[i][j]);
        this.constraintList.push(cellConstraints[i][j]);
      }
    }
    for (var klc = 0; klc < optionFlags["killerCages"].length; klc++) {
        cageConstraints[klc] = [];
        for (var j = 0; j < 9; j++) {
         cageConstraints[klc][j] = new Constraint('cage'); // i is cage#, j is Candidate Value#
         this.constraintList.push(cageConstraints[klc][j]);
        }
    }
    for (var t = 0; t < optionFlags["thermometers"].length; t++) {
        thermoConstraints[t] = [];
        for (var j = 0; j < 9; j++) {
         thermoConstraints[t][j] = new Constraint('thermo'); // t is thermometer#, j is Candidate Value#
         this.constraintList.push(thermoConstraints[t][j]);
        }
        Array.from(Array(optionFlags["thermometers"][t]["values"].length), () => null)
        this.orderedRegionList.push(Array.from(Array(optionFlags["thermometers"][t]["values"].length), () => new OrderedRegion()));  // make a ordered region for each thermometer to be used later in the candidate section
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

          cellConstraints[i][j].candidateList.push(candidate);

          // create link between constraints and candidates
          let boxNum = Math.floor(i/3) + Math.floor(j/3) * 3;
          boxConstraints[boxNum][k].candidateList.push(candidate);// Move onto box B and say that  "the number N in RxCy" is a candidate of this Box.
          rowConstraints[i][k].candidateList.push(candidate);// Move onto row R and say that  "the number N in RxCy" is a candidate of this Row.
          colConstraints[j][k].candidateList.push(candidate);// Move onto col C and say that  "the number N in RxCy" is a candidate of this Col.
          // More generally, say that
          // For each region, if the Cell R0C0 is in the region, then  "the number N in Cell RxCy" is a possible solution to this region.
          // and then that candidates constraintList contains all of the regions that cell is a member of.

          candidate.constraintList = [ boxConstraints[boxNum][k],
                                       rowConstraints[i][k],
                                       colConstraints[j][k],
                                       cellConstraints[i][j] ];

          for (var klc = 0; klc < optionFlags["killerCages"].length; klc++) {
            if( optionFlags["killerCages"][klc]["values"].includes(""+i+""+j) ){
               cageConstraints[klc][k].candidateList.push(candidate);
               candidate.constraintList.push(cageConstraints[klc][k]);
            }
          }
          // for this to work, we can assume that "thermometers" is ordered from the bulb forward
          for (var t = 0; t < optionFlags["thermometers"].length; t++) {
            var index = optionFlags["thermometers"][t]["values"].indexOf(""+i+""+j);
            if( index >= 0 ){
               thermoConstraints[t][k].candidateList.push(candidate);
               candidate.constraintList.push(thermoConstraints[t][k]);
               this.orderedRegionList[t][index].candidateList.push(candidate);
               // I have an ordered region, and I am specifying what in it?
            }
          }
          if( (optionFlags["diagonalFlag"] > 0) ){
            if( i == j && (optionFlags["diagonalFlag"] & 1) ){
              diagonalConstraints[0][k].candidateList.push(candidate);
              candidate.constraintList.push(diagonalConstraints[0][k]);
            }
            if( i == (8-j) && (optionFlags["diagonalFlag"] & 2) ){
              diagonalConstraints[1][k].candidateList.push(candidate);
              candidate.constraintList.push(diagonalConstraints[1][k]);
            }
          }

        }
      }
    }
  }

  checkConstraints() {
    // go through all of the constraints, asking them to check themselves
    // each constraint currently checks: Is there only 1 candidate in my candidateList?
    // If so, that candidate must be the correct candidate for the number
    // Any given constrain only has candidates for a particular digit at the moment

    // I want to extend this to support thermometers, where we would check predecessor values.
    this.constraintList.forEach(constraint => {constraint.check();});
  }
}

class HTMLGrid {
  constructor(width, optionFlags) {
    this.mode = "normal";
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

        for (var klc = 0; klc < optionFlags["killerCages"].length; klc++) {
          if( optionFlags["killerCages"][klc]["values"].includes(""+i+""+j) ){
            var cageDiv = document.createElement('div');
            wrapper.appendChild(cageDiv);
            if( optionFlags["killerCages"][klc].fresh ){
                cageDiv.innerHTML=optionFlags["killerCages"][klc].sum;
                optionFlags["killerCages"][klc].fresh=false;
            }
            cageDiv.style.fontSize = (width*0.018) + 'px';
            cageDiv.classList.add('cage');
            //cageDiv.style.outlineStyle = "dashed";
            if(! optionFlags["killerCages"][klc]["values"].includes(""+((i+9+1)%9)+""+((j+9)%9)) ){
                cageDiv.style.borderBottom = " dotted 3px";
            }
            if(! optionFlags["killerCages"][klc]["values"].includes(""+((i+9-1)%9)+""+((j+9)%9)) ){
                cageDiv.style.borderTop = " dotted 3px";
            }
            if(! optionFlags["killerCages"][klc]["values"].includes(""+((i+9)%9)+""+((j+9+1)%9)) ){
                cageDiv.style.borderRight = " dotted 3px";
            }
            if(! optionFlags["killerCages"][klc]["values"].includes(""+((i+9)%9)+""+((j+9-1)%9)) ){
                cageDiv.style.borderLeft = " dotted 3px";
            }



            // cage border, remove the left, right, etc if the neighbor is part of the same cage
          }
        }

        for (var t = 0; t < optionFlags["thermometers"].length; t++) {
          if( optionFlags["thermometers"][t]["values"].includes(""+i+""+j) ){
            var thermoDiv = document.createElement('div');

            wrapper.appendChild(thermoDiv);

            thermoDiv.classList.add('thermo');
            if( optionFlags["thermometers"][t].fresh ){
                var bulbDiv = document.createElement('div');
                thermoDiv.appendChild(bulbDiv);
                bulbDiv.classList.add("bulb");


                optionFlags["thermometers"][t].fresh=false;
            }

            if( optionFlags["thermometers"][t]["values"].includes(""+((i+9+1)%9)+""+((j+9)%9)) ){
                var tubeDiv = document.createElement('div');
                thermoDiv.appendChild(tubeDiv);
                tubeDiv.classList.add("tube");
                tubeDiv.classList.add('tubeD');

            }
            if( optionFlags["thermometers"][t]["values"].includes(""+((i+9-1)%9)+""+((j+9)%9)) ){
                var tubeDiv = document.createElement('div');
                tubeDiv.classList.add("tube");
                thermoDiv.appendChild(tubeDiv);
                tubeDiv.classList.add("tubeU");
            }
            if( optionFlags["thermometers"][t]["values"].includes(""+((i+9)%9)+""+((j+9+1)%9)) ){
                var tubeDiv = document.createElement('div');
                tubeDiv.classList.add("tube");
                thermoDiv.appendChild(tubeDiv);
                tubeDiv.classList.add("tubeR");
            }
            if( optionFlags["thermometers"][t]["values"].includes(""+((i+9)%9)+""+((j+9-1)%9)) ){
                var tubeDiv = document.createElement('div');
                tubeDiv.classList.add("tube");
                thermoDiv.appendChild(tubeDiv);
                tubeDiv.classList.add("tubeL");
            }




            // cage border, remove the left, right, etc if the neighbor is part of the same cage
          }
        }


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

     if( optionFlags["diagonalFlag"]  >0  ){ // D=1 for first diagonal, D=2 for Second, D=3 for both
      var diagonalLine1 = document.createElement('div');
          diagonalLine1.classList.add('diagonal1');
          this.wrapper.appendChild(diagonalLine1);
    }
    if( optionFlags["diagonalFlag"]  & 2 ){ // D=1 for first diagonal, D=2 for Second, D=3 for both
        var diagonalLine2 = document.createElement('div');
        diagonalLine2.classList.add('diagonal2');
        this.wrapper.appendChild(diagonalLine2);

    }
    // attach event handlers to container and focustrap
    var trapFocus = function() {this.focusTrap.focus();};
    this.wrapper.addEventListener(
      'click', trapFocus.bind(this));
    this.focusTrap.addEventListener(
      'keydown', this.keypressHandler.bind(this));


  }
setMode(mode){
  this.mode = mode;
}
keypressHandler(event) {
    if (!event.ctrlKey & !event.shiftKey & !event.altKey & !event.metaKey){
      if (this.activeGridSquare) {
        if (/^[1-9]$/.test(event.key)) {
          let value = parseInt(event.key);
          if( this.mode == "normal" ){
            this.activeGridSquare.enterGuess(value);
          }else if( this.mode == "candidates" ){
            let candidateWrapper = this.activeGridSquare.candidateWrappers[value-1];
            candidateWrapper.clickFunction();
          }

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
          if (event.key == 'ArrowLeft'){ newColumnIndex = ((columnIndex+9-1)%9);} // 8=> 7, 0=> 8
          if (event.key == 'ArrowRight'){ newColumnIndex = ((columnIndex+1)%9);}
          if (event.key == 'ArrowUp'){ newRowIndex = ((rowIndex+9-1)%9);}
          if (event.key == 'ArrowDown'){ newRowIndex = ((rowIndex+1)%9);}

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
