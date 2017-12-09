class sudoku {
  constructor(divContainerId) {

    this.cellGrid = [ [], [], [], [], [], [], [], [], [] ];
    this.activeSquare = null;

    // build html structure and assemble hierarchy:
    this.container = document.getElementById(divContainerId);
    this.focusTrap = document.createElement('input');
    this.focusTrap.id = "focus-trap";
    this.container.appendChild(this.focusTrap);
    var tbl = document.createElement('table');
    this.container.appendChild(tbl);
    var tblBody = document.createElement('tbody');
    tbl.appendChild(tblBody);
    // construct sudoku grid
    for (var i = 0; i < 9; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < 9; j++) {
            this.cellGrid[i][j] = new gridSquare(i,j);
            row.appendChild(this.cellGrid[i][j].tblCell);
        }
        tblBody.appendChild(row);
        row.classList.add('grid-row');
    }

    // make container square and size fonts according to container width
    this.container.style.height = this.container.offsetWidth;
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            this.cellGrid[i][j].sizeFonts(this.container.offsetWidth);
        }
    }

    // attach event handlers
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            this.cellGrid[i][j].bindCandidateClickHandler(
              this.candidateClickHandler.bind(this,i,j));
            this.cellGrid[i][j].bindSquareClickHandler(
              this.activateSquare.bind(this,i,j));
        }
    }
    var trapFocus = function() {this.focusTrap.focus();};
    this.container.addEventListener(
      'click', trapFocus.bind(this));
    this.focusTrap.addEventListener(
      'keypress', this.keypressHandler.bind(this));

  }

  update(i,j,guess) {
    // update box candidates
    var nLow = Math.floor(i/3) * 3;
    var mLow = Math.floor(j/3) * 3;
    for (var n = nLow; n < nLow + 3; n++) {
      for (var m = mLow; m < mLow + 3; m++) {
        if (n != i & m != j) {
          this.cellGrid[n][m].removeCandidate(guess);
        }
      }
    }
    // update col candidates
    for (var n = 0; n<9; n++) {
      if (n != i) {
        this.cellGrid[n][j].removeCandidate(guess);
      }
    }
    // update row candidates
    for (var n = 0; n<9; n++) {
      if (n != j) {
        this.cellGrid[i][n].removeCandidate(guess);
      }
    }
  }

  candidateClickHandler(i,j,k) {
    if (this.activeSquare) {
      if (this.activeSquare[0] == i & this.activeSquare[1] == j ) {
        this.cellGrid[i][j].toggleCandidate(k);
      }
    }
  }

  keypressHandler(event) {
    if (/^[1-9]$/.test(event.key)) {
      if (this.activeSquare) {
        this.cellGrid[this.activeSquare[0]][this.activeSquare[1]]
          .enterGuess(event.key);
        this.update(this.activeSquare[0],this.activeSquare[1],
          parseInt(event.key)-1);
      }
    } else if (event.key == 'Delete') {
      if (this.activeSquare) {
        this.cellGrid[this.activeSquare[0]][this.activeSquare[1]].deleteGuess();
      }
    }
  }

  activateSquare(i,j) {
    if (this.activeSquare) {
      this.cellGrid[this.activeSquare[0]][this.activeSquare[1]].deactivate();
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
      this.candidateCells[k].addEventListener('click',clickHandler.bind(null,k));
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

  sizeFonts(width) {
    this.guessDiv.style.fontSize = (width*0.08) + 'px';
    this.candidateTable.style.fontSize = (width*0.027) + 'px';
  }
}
