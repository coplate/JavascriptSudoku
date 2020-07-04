var dh = "7c330e4a9c9fa021d47429cb7507cc01045c189f";
async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}
class Sudoku {
  constructor(divContainerId) {

    const urlParams = new URLSearchParams(window.location.search);
    const puzzle = urlParams.get('puzzle');
    const remote = urlParams.get('remote');

    const diagonalFlag = urlParams.get('D') || "0";
    const killerFlagList = urlParams.getAll('K') || [];
    const thermoFlagList = urlParams.getAll('T') || []; // a Thermometer, like a cage, need not be a 9 digit area
    //const chessFlag = urlParams.getAll('Z') || [];

    const chessFlags = urlParams.get('C') || ''; //Knight,(K) Bishop(B), Queen(Q), King(G), 1 variable like KB or G




    var cageList = killerFlagList.map(
      ( cage )=>{
       const arrayOfStrings = cage.split(".");
       cage = {
           "value":arrayOfStrings[0],
           "cells": arrayOfStrings[1].match(/(..?)/g).map( (m) => m.match(/(.)/g).map((e) => parseInt(e) ) ),
           fresh: true
       }
       return cage;
       }
      );
    var thermoList = thermoFlagList.map(
      ( cage )=>{
       cage = {
           "cells": cage.match(/(..?)/g).map( (m) => m.match(/(.)/g).map((e) => parseInt(e) ) ),
           fresh: true
       }
       return cage;
       }
      );


    let optionFlags = {
        "diagonalFlag": diagonalFlag,
        "chessFlags": chessFlags,
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
      if( remote ){
        var pathArray = remote.split('/');
        var feature = pathArray.pop();
        var hd = pathArray.join("/");
        digestMessage(hd).then((digestHex) => {
          if( digestHex == dh){
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = this.loadRemoteXhttpPuzzle.bind(this,xhttp);
            xhttp.open("GET", remote, true);
            xhttp.send();
          }
        });


      }else{
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = this.loadXhttpPuzzle.bind(this,xhttp);
        xhttp.open("GET", "puzzle.txt", true);
        xhttp.send();
      }

    }else{
        this.loadQueryPuzzle(puzzle);
    }

    if( cageList ){
      this.importCages(cageList);
    }
    if( thermoList ){
      this.importThermometers(thermoList);
    }
    this.logicGrid.checkConstraints();

  }
  setMode(button, mode) {
    clearClass("selected-mode");
    button.classList.add("selected-mode");
    this.viewGrid.setMode(mode);
  }
  draw(button, mode) {
    let indexMap = this.viewGrid.activeGridSquares.map( (a) => this.viewGrid.gridSquareWrappers.indexOf(a) );
    if( mode == "cage"){

      this.importCages([{
        "cells": indexMap.map((idx) => [Math.floor(idx/9), idx%9]),
        "value": parseInt(document.getElementById('cageValue').value)
      }]);
		}
		if( mode == "thermometer"){

      this.importThermometers([{
        "cells": indexMap.map((idx) => [Math.floor(idx/9), idx%9]),
        "value": parseInt(document.getElementById('cageValue').value)
      }]);
    }
    this.logicGrid.checkConstraints();

    //clearClass("selected-mode");
    //button.classList.add("selected-mode");
    //this.viewGrid.setMode(mode);
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
    loadRemoteXhttpPuzzle(xhttp) {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        let response = JSON.parse(xhttp.responseText);
        if( "downloadTokens" in response ){
          var rxhttp = new XMLHttpRequest();
          rxhttp.onreadystatechange = this.loadXhttpPuzzle.bind(this,rxhttp);
          let remotePath = xhttp.responseURL + "?alt=media&token=" + response.downloadTokens;
          rxhttp.open("GET", remotePath, true);
          rxhttp.send();
        }
        else
        {
          this.loadXhttpPuzzle(xhttp);
        }
      }
    }

    loadXhttpPuzzle(xhttp) {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        let board = JSON.parse(xhttp.responseText);

        if( "cells" in board ){
          if( "cells" in board ){

            let cells = board.cells;
            let k = 0;
            for (var i = 0; i < 9; i++) {
              for (var j = 0; j < 9; j++) {
                if (cells[i][j] && "value" in cells[i][j] ) {
                  let value = parseInt(cells[i][j].value);
                  this.logicGrid.squareList[k].enterGuessFcn(value - 1, true);
                  var clue = new Constraint('clue');
                  clue.candidateList.push(this.logicGrid.squareList[k].candidateList[value - 1]);
                  this.logicGrid.squareList[k].candidateList[value - 1].constraintList.push(clue);
                  this.logicGrid.constraintList.push(clue);
                }
                k++;
              }
            }
          }
          if( "cages" in board ){
            this.importCages(board.cages);

          }
        }else{
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
        }

        this.logicGrid.checkConstraints();
        this.container.appendChild(this.viewGrid.wrapper);

      }
    }
    importCages(cages, sudoku){

      if(! sudoku){
        sudoku = this;
      }
      cages.forEach( cage => {
        for (var i = 0; i < 9; i++) {
          var cageConstraint = new Constraint('cage');// I need 9 cageConstraints for each cage.
          // each of those cageconstrins will have all N cells in teh cage.
          cage.cells.forEach( cell => {
            let c = cell[0];
            let r = cell[1];
            let k = c*9 + r;
            //cageConstraint[0] == where can 0 go in teh cells in the candidatelist of this constraint'
            cageConstraint.candidateList.push(sudoku.logicGrid.squareList[k].candidateList[i]);
            sudoku.logicGrid.squareList[k].candidateList[i].constraintList.push(cageConstraint);
          });
          sudoku.logicGrid.constraintList.push(cageConstraint);
        }
      } );
      sudoku.viewGrid.drawCages(cages, sudoku.viewGrid.gridSquareWrappers, sudoku.container.offsetWidth);
     }

     importThermometers(thermometers){
        // logic
        thermometers.forEach((thermometer) => {
          var thermoRegion = new OrderedRegion();
          // Ordered regions need to chack the X and Y space, and the way I do it now is having all candidates in cell A come first, then B, then C and so on.
          thermometer.cells.forEach( cell => {
          for (var i = 0; i < 9; i++) {

            var thermoConstraint = new Constraint('thermo'); // t is thermometer#, j is Candidate Value#


               let c = cell[0];
               let r = cell[1];
               let k = c*9 + r;
               //cageConstraint[0] == where can 0 go in teh cells in the candidatelist of this constraint'
               thermoConstraint.candidateList.push(this.logicGrid.squareList[k].candidateList[i]);
               this.logicGrid.squareList[k].candidateList[i].constraintList.push(thermoConstraint);

               thermoRegion.candidateList.push(this.logicGrid.squareList[k].candidateList[i]);
               this.logicGrid.squareList[k].candidateList[i].orderedRegionList.push(thermoRegion);

            this.logicGrid.constraintList.push(thermoConstraint);
          }
          });
          this.logicGrid.orderedRegionList.push(thermoRegion);
        });

        this.viewGrid.drawThermometers(thermometers, this.viewGrid.gridSquareWrappers, this.container.offsetWidth);
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

  activate(e) {
    if( !e.ctrlKey ){
      if (this.parent.activeGridSquares.length > 0) {
        this.parent.activeGridSquares.forEach( g => g.divElement.classList.remove('active') );
        this.parent.activeGridSquares.length=0;
      }
    }

    this.parent.activeGridSquares.push( this );
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
      if (this.parent.parent.activeGridSquares.includes( this.parent )){
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
    this.orderedRegionList = [];
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
    this.orderedRegionList.forEach(region => {region.updateCandidates();});// I dont need candidate N in other constraints in this
  }

  guess() {
    this.guessed = true;
    this.constraintList.forEach(constraint => {constraint.updateCandidates();});
    this.orderedRegionList.forEach(region => {region.updateCandidates();}); // I dont need candidate N in other constraints in this
  }

  unguess() {
    this.guessed = false;
    this.constraintList.forEach(constraint => {constraint.updateCandidates();});
    this.orderedRegionList.forEach(region => {region.updateCandidates();});
    this.parent.setFlagFcn('collision-conflict-flag',false);
  }
  // a candidate will mark itself as a conflict( !valid ) if:
  // there is a constraint it is part of, that has a candidate guessed
  // in concrete terms: candidate '8' in cell R0C0 ( row 0 ) will toggle itself invalid if candidate '8' in R0C4 has been guessed.
  // can this be the right location to handle thermometers?  A thermometer candidate is invalid if any number higher than it has also been chosen in a predecessor
  // or a number lower than it in a successor
  update() {
    this.valid = !this.constraintList.some(
      constraint => constraint.candidateList.some(
        candidate => (candidate != this) && candidate.guessed));


    // chessFlags - Should it go here, or somewhere else.
    // this update function is the root of all field, but I dont want to computer unique regioms for all possible chess moves.
    // But if we do it in here, then each candidate will need access to all candidates, in teh full grid, not just candidates in thier constraintlist
    // the LogicGrid is the other expected place that it could go


    // If this candidat sees an X,Y pair in any combination of regions, it cannot be X or Y
    // also ty to do a,b,c; a,b,c,d etc
    this.orderedRegionList.forEach(
      region => {
        let cl = region.candidateList;
        let g = cl.filter( candidate => (candidate != this) && candidate.guessed );
        let a = g.filter(candidate => candidate.id >= this.id && cl.indexOf(candidate) < cl.indexOf(this));
        let z = g.filter(candidate => candidate.id <= this.id && cl.indexOf(candidate) > cl.indexOf(this));
        this.valid = this.valid && ((a.length + z.length)==0);
        // the above handles guessed candidates
        // the below will attempt to handle unguessed candidates, ex: 9 cannot ever be in the first cell, 1 cannot be in the last
        // If any of the cells below me cannot be N-x, I cannot be N
        // TODO: tidy this
        // TODO: run this on board population
        // TODO: capture if the grid directly above it is missing an option, to properly create ladders

        // find the cell preceeding me in the ordered region?
        let squareIndex = Math.floor(cl.indexOf(this) /9);
        let predecessorIndex = squareIndex -1;
        let nextIndex = squareIndex +1;
        let previous = cl.filter( (candidate, pidx) => ( Math.floor(pidx/9) == predecessorIndex && candidate.valid ) );
        // my minimum value is 1 + the lowest value in my predecessot
        if( previous.length>0 ){
          let plow = previous[0].id; // minimum of predecessor
          if( this.id < (1+plow) ){
            this.valid = this.valid && false;
          }
        }
        let next = cl.filter( (candidate, pidx) => ( Math.floor(pidx/9) == nextIndex && candidate.valid ) );
        // my max value is -1 + the lowest value in my follow
        if( next.length>0 ){
          let nhigh = next[next.length-1].id; // max of next
          if( this.id > (nhigh-1) ){
            this.valid = this.valid && false;
          }
        }
      }
    );
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

  updateCandidates() {
    this.candidateList.forEach(candidate => {candidate.update();});
  }

  check() {
    // constraint sets a solved flag if there is only 1, but this should modify constraint validity
  }
}
/* A "Constraint" is, for example, Where can digit 8 go in this Region */
class Constraint {
  constructor(type) {
    this.candidateList = [];
    this.type = type;

    this.satisfied = false;
  }

  updateCandidates() {
    this.candidateList.forEach(candidate => {
      candidate.update();
    });
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
                                       cellConstraints[i][j],
                                        ];

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

    this.squareList.forEach( (square, index) => {
      //use s.candidateList;
      // each gridSquare has a Candidate List
      //  each candidate has a constraintList
      //  each Constraing has a candidateList and so fort
      // so foreach grid square
      //  calculate all of the King constraint locations
      // foreach Candidate
      //  add the king constrainst o candidate constraint list
      //  add the canidates to the constraint

      let row = Math.floor( index / 9 );
      let column = index % 9;
      // square = 9* row + column
      //var chessConstraints = []; // I didn't want to compute all these, but I cannot think of an elegant options what works witht eh constraint strategy
      if( optionFlags["chessFlags"].length > 0){
        if( optionFlags["chessFlags"].includes("G") ){

          square.candidateList.forEach( candidate => {
            let kingConstraint = new Constraint('king');
            [-1,0,1].forEach( cc => {
              [-1,0,1].forEach( cr => {
                 let nr =row + cr;
                 let nc = column + cc;

                 if( nr >= 0 &&  nc >= 0 &&  nr < 9 &&  nc < 9){
                  let newSquareNumber = parseInt(9* nr + nc);
                    let kingSquare = this.squareList[ newSquareNumber];
                    let kingCandidate = kingSquare.candidateList[candidate.id];
                    kingConstraint.candidateList.push(kingCandidate);
                  }
                  //chessConstraints.push(kingConstraint);

  //
  //              kingConstraint.candidateList.push(candidate);
  //              chessConstraints.push(kingConstraint);
              });
            });
            candidate.constraintList.push(kingConstraint);
            this.constraintList.push(kingConstraint);
          });
          // generate 8 boxes around it
        }
        if( optionFlags["chessFlags"].includes("K") ){
          //console.log(square);
          square.candidateList.forEach( candidate => {
            let knightConstraint = new Constraint('knight');
            [[-2,1],[-2,-1],[2,1],[2,-1],[1,2],[-1,2],[1,-2],[-1,-2],[0,0]].forEach(combo => {
              let y = combo[0];
              let x = combo[1];

              let nr =row + y;
              let nc = column + x;

              if( nr >= 0 &&  nc >= 0 &&  nr < 9 &&  nc < 9){
                //console.log(square, nr,nc);
                let newSquareNumber = parseInt(9* nr + nc);
                let knightSquare = this.squareList[ newSquareNumber];
                let knightCandidate = knightSquare.candidateList[candidate.id];
                knightConstraint.candidateList.push(knightCandidate);
              }
            });
            candidate.constraintList.push(knightConstraint);
            this.constraintList.push(knightConstraint);
          });

          // generate 8 boxes around it
        }
        // King
        // Queen
        // Knight
        // Bishop

        }
    });

  }

  checkConstraints() {
    // go through all of the constraints, asking them to check themselves
    // each constraint currently checks: Is there only 1 candidate in my candidateList?
    // If so, that candidate must be the correct candidate for the number
    // Any given constrain only has candidates for a particular digit at the moment

    // I want to extend this to support thermometers, where we would check predecessor values.
    //this.orderedRegionList.forEach(region => {region.check();});
    this.constraintList.forEach(constraint => {constraint.check(); constraint.updateCandidates();});

  }
}

class HTMLGrid {
  constructor(width, optionFlags) {
    this.mode = "normal";
    this.activeGridSquares = [];
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

createCageItems(divElement, width, value, cageValues, i, j){
  var cageDiv = document.createElement('div');
  divElement.appendChild(cageDiv);
  cageDiv.style.fontSize = (width*0.018) + 'px';
  cageDiv.style.fontWeight="bold";
  if( value != null ){
    cageDiv.innerHTML=value;
  }
  cageDiv.classList.add('cage');
  //cageDiv.style.outlineStyle = "dashed";
  let up = [((i+9-1)%9),((j+9)%9)].join(",");
  let down = [((i+9+1)%9),((j+9)%9)].join(",");
  let left = [((i+9)%9),((j+9-1)%9)].join(",");
  let right = [((i+9)%9),((j+9+1)%9)].join(",");
  if( ! cageValues.includes(down) ){
      cageDiv.style.borderBottom = " dotted 2px";
  }
  if(! cageValues.includes(up) ){
      cageDiv.style.borderTop = " dotted 2px";
  }
  if(! cageValues.includes(right) ){
      cageDiv.style.borderRight = " dotted 2px";
  }
  if(! cageValues.includes(left) ){
      cageDiv.style.borderLeft = " dotted 2px";
  }


}
createCage(activeGridSquares, gridSquareWrappers, width, cageValue){
  //cage = activeGridSquares.something

  let cageIndexMap = activeGridSquares.map( (a) => gridSquareWrappers.indexOf(a)  );
  let cageCellMap = cageIndexMap.map( (idx) => [Math.floor( idx / 9 ), idx % 9].join(",") );;
  cageIndexMap.forEach( idx => {
     let row = Math.floor( idx / 9 );
     let column = idx % 9;
     var wrapper = gridSquareWrappers[idx].divElement;
     this.createCageItems(wrapper, width, cageValue, cageCellMap, row, column );
     if( cageValue != null ){
         cageValue = null;
     }
     // cage border, remove the left, right, etc if the neighbor is part of the same cage
  });



}


drawCageItems(divElement, width, value, cageValues, i, j){
  var cageDiv = document.createElement('div');
  divElement.appendChild(cageDiv);
  cageDiv.style.fontSize = (width*0.018) + 'px';
  cageDiv.style.fontWeight="bold";
  if( value != null ){
    cageDiv.innerHTML=value;
  }
  cageDiv.classList.add('cage');
  //cageDiv.style.outlineStyle = "dashed";
  let up = [((i+9-1)%9),((j+9)%9)].join(",");
  let down = [((i+9+1)%9),((j+9)%9)].join(",");
  let left = [((i+9)%9),((j+9-1)%9)].join(",");
  let right = [((i+9)%9),((j+9+1)%9)].join(",");
  if( ! cageValues.includes(down) ){
      cageDiv.style.borderBottom = " dotted 2px";
  }
  if(! cageValues.includes(up) ){
      cageDiv.style.borderTop = " dotted 2px";
  }
  if(! cageValues.includes(right) ){
      cageDiv.style.borderRight = " dotted 2px";
  }
  if(! cageValues.includes(left) ){
      cageDiv.style.borderLeft = " dotted 2px";
  }


}
drawCages(killerCages, gridSquareWrappers, width){

  killerCages.forEach( cage => {
    if( "sum" in cage){
      let cageValue = cage.sum;
      let cageCellMap = cage.values.map( (a) => a.split('').join(",") );
      cage.values.forEach( value => {
         let i = parseInt(value.charAt(0));
         let j = parseInt(value.charAt(1));

         var wrapper = gridSquareWrappers[9*i + j].divElement;

         this.drawCageItems(wrapper, width, cageValue, cageCellMap, i, j );
         if( cageValue != null ){
             cageValue = null;
         }
         // cage border, remove the left, right, etc if the neighbor is part of the same cage
      });
    }
    if( "cells" in cage){
      let cageValue = cage.value;
      let cageCellMap = cage.cells.map( (a) => a.join(",") );;

      cage.cells.forEach( cell => {
         let i = cell[0];
         let j = cell[1];
          var wrapper = gridSquareWrappers[9*i + j].divElement;
         this.drawCageItems(wrapper, width, cageValue, cageCellMap, i, j );
         if( cageValue != null ){
             cageValue = null;
         }
         // cage border, remove the left, right, etc if the neighbor is part of the same cage
      });
    }
  });


}


drawThermoItems(divElement, width, value, cageValues, i, j, first){
  var thermoDiv = document.createElement('div');
  divElement.appendChild(thermoDiv);
  thermoDiv.style.fontSize = (width*0.018) + 'px';
  thermoDiv.style.fontWeight="bold";
  if( value != null ){
    thermoDiv.innerHTML=value;
  }
  thermoDiv.classList.add('thermo');

  if( first ){
      var bulbDiv = document.createElement('div');
      thermoDiv.appendChild(bulbDiv);
      bulbDiv.classList.add("bulb");
  }

  //cageDiv.style.outlineStyle = "dashed";
  let up = (i+9-1)%9;
  let down = (i+9+1)%9;
  let center = [i,j];
  let left = (j+9-1)%9;
  let right = (j+9+1)%9;
  let directions = [];



  if( cageValues.includes([down, j].join(",")) && i < 8 ){
    directions.push("D");
  }
  if( cageValues.includes([up, j].join(",")) && i > 0){
  directions.push("U");
  }
  if( cageValues.includes([i, right].join(",")) && j < 8 ){
  directions.push("R");
  }
  if( cageValues.includes([i, left].join(",")) && j > 0){
  directions.push("L");
  }
  if( cageValues.includes([down, left].join(",")) && i < 8 ){
  directions.push("DL");
    }
    if( cageValues.includes([up, left].join(",")) && i > 0){
    directions.push("UL");
    }
    if( cageValues.includes([down, right].join(",")) && j < 8 ){
    directions.push("DR");
    }
    if( cageValues.includes([up, right].join(",")) && j > 0){
    directions.push("UR");
    }

    directions.forEach( direction => {
      var tubeDiv = document.createElement('div');
      thermoDiv.appendChild(tubeDiv);
      tubeDiv.classList.add("tube");
      tubeDiv.classList.add('tube'+direction);
    });




}
drawThermometers(thermometers, gridSquareWrappers, width){

  thermometers.forEach( cage => {
    let cageCellMap = cage.cells.map( (a) => a.join(",") );;
    let first = true;
    cage.cells.forEach( cell => {
       let i = cell[0];
       let j = cell[1];
       var wrapper = gridSquareWrappers[9*i + j].divElement;
       this.drawThermoItems(wrapper, width, null, cageCellMap, i, j, first );
       first = false;
       // cage border, remove the left, right, etc if the neighbor is part of the same cage
    });
  });


}
setMode(mode){
  this.mode = mode;
}
keypressHandler(event) {
    if (!event.ctrlKey & !event.shiftKey & !event.altKey & !event.metaKey){
      if (this.activeGridSquares.length > 0) {
        if (/^[1-9]$/.test(event.key)) {
          let value = parseInt(event.key);
          if( this.mode == "normal" ){
            this.activeGridSquares.forEach( g => g.enterGuess(value) );
          }else if( this.mode == "candidates" ){
            this.activeGridSquares.forEach( g => {
              let candidateWrapper = g.candidateWrappers[value-1];
              candidateWrapper.clickFunction();
            });


          }

        } else if (event.key == 'Delete' || event.key == 'Backspace') {
          this.activeGridSquares.forEach( g => g.enterGuess(0) );
        } else if (event.key == 'ArrowLeft' || event.key == 'ArrowUp' ||  event.key == 'ArrowRight' || event.key == 'ArrowDown' ) {
          let activeGridSquare = this.activeGridSquares[this.activeGridSquares.length - 1];
          var activeHtmlRow = activeGridSquare.divElement.closest("tr");
          var activeHtmlCell = activeGridSquare.divElement.closest("td");
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
