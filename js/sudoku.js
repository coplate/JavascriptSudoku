class sudoku {
  constructor(divContainerId) {
    this.container = document.getElementById(divContainerId);
    this.focusTrap = document.createElement('input');
    this.cellGrid = [ [], [], [], [], [], [], [], [], [] ];
    this.activeSquare = null;
    this.focusTrap.id = "focus-trap";
    this.container.appendChild(this.focusTrap);
    var trapFocus = function() {this.focusTrap.focus();};
    this.container.addEventListener('click', trapFocus.bind(this));
    this.focusTrap.addEventListener('keypress', this.keypressHandler.bind(this));

    this.width = this.container.offsetWidth;
    this.container.style.height = this.width;

    var tbl = document.createElement('table');
    var tblBody = document.createElement('tbody');

    for (var i = 0; i < 9; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < 9; j++) {
            this.cellGrid[i][j] = new gridSquare(i,j);
            this.cellGrid[i][j].sizeFonts(this.width);
            this.cellGrid[i][j].bindCandidateClickHandler(this.candidateClickHandler.bind(this,i,j));
            this.cellGrid[i][j].bindSquareClickHandler(this.activateSquare.bind(this,i,j));
            row.appendChild(this.cellGrid[i][j].tblCell);
        }

        tblBody.appendChild(row);

        row.classList.add('grid-row');
    }
    tbl.appendChild(tblBody);
    this.container.appendChild(tbl);

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
        this.cellGrid[this.activeSquare[0]][this.activeSquare[1]].enterGuess(event.key);
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
    this.tblCell = document.createElement('td');
    var wrapper = document.createElement('div');
    this.candidateTable = document.createElement('table');
    var tblBody = document.createElement('tbody');
    this.guessDiv = document.createElement('div');
    this.candidateCells = [];

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

    this.candidateTable.appendChild(tblBody);
    wrapper.appendChild(this.candidateTable);
    wrapper.appendChild(this.guessDiv);
    this.tblCell.appendChild(wrapper)

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
    console.log(width);
    this.guessDiv.style.fontSize = (width*0.08) + 'px';
    this.candidateTable.style.fontSize = (width*0.027) + 'px';
  }
}
