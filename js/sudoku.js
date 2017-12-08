class sudoku {
  constructor(divContainerId) {
    this.container = document.getElementById(divContainerId);
    this.focusTrap = document.createElement('input');
    this.cellGrid = [ [], [], [], [], [], [], [], [], [] ];

    this.focusTrap.id = "focus-trap";


    this.width = this.container.offsetWidth;
    this.container.style.height = this.width;

    var tbl = document.createElement('table');
    var tblBody = document.createElement('tbody');

    for (var i = 0; i < 9; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < 9; j++) {
            this.cellGrid[i][j] = new gridSquare();
            row.appendChild(this.cellGrid[i][j].HTMLElement);
        }

        tblBody.appendChild(row);

        row.classList.add('grid-row');
    }
    tbl.appendChild(tblBody);
    this.container.appendChild(tbl);

    $( ".guess" ).css({ fontSize: this.width*0.08 });
    $( ".candidate" ).css({ fontSize: this.width*0.027 });
  }
}

class gridSquare {
  constructor() {
    this.guess = null;
    this.candidates = [1,2,3,4,5,6,7,8,9];
    this.active = false;
    this.HTMLInterface = new HTMLInterface();
  }
  get HTMLElement() {
    return this.HTMLInterface.tblCell;
  }
}

class HTMLInterface {
  constructor() {
    this.tblCell = document.createElement('td');
    var wrapper = document.createElement('div');
    var tbl = document.createElement('table');
    var tblBody = document.createElement('tbody');
    this.guess = document.createElement('div');
    this.candidates = [];

    for (var i = 0; i < 3; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < 3; j++) {
            var candidateNum = j + 1 + 3 * i;
            var cell = document.createElement('td');
            this.candidates[candidateNum] = document.createElement('div');
            this.candidates[candidateNum].innerHTML = candidateNum;
            this.candidates[candidateNum].classList.add('N' + candidateNum);
            cell.classList.add('candidate');
            cell.appendChild(this.candidates[candidateNum]);
            row.appendChild(cell);
        }
        tblBody.appendChild(row);
    }

    tbl.appendChild(tblBody);
    wrapper.appendChild(tbl);
    wrapper.appendChild(this.guess);
    this.tblCell.appendChild(wrapper)

    wrapper.classList.add('cell-wrapper');
    tbl.classList.add('candidates');

    this.guess.classList.add('guess');
    this.tblCell.classList.add('grid-square');

  }
}

$(document).ready(function(){
    $( ".candidate" ).click(function(event){
      if ($(this).closest('.grid-square').hasClass('active')) {
        console.log('Toggle candidate ' + this.childNodes[0].innerHTML + ' for the active square');
        this.childNodes[0].hidden = !this.childNodes[0].hidden;
      } else {
        $(".sudoku-grid .grid-square.active").removeClass('active');
        $(this).closest('.grid-square').addClass('active')
        console.log('Make square ' + $(this).closest('.grid-square').attr('id') + ' active');
      }
    });

    $( "#game-area" ).click(function(event){
      document.getElementById('focus-trap').focus();
    });

    document.getElementById('focus-trap').onkeypress = function(event) {
      if ($.isNumeric(event.key)) {
        console.log('Add guess of ' + event.key + ' to active square');
        $( '.grid-square.active .candidates' ).hide();
        $( '.grid-square.active .guess' ).html(event.key);
        $( '.grid-square.active .guess' ).show();
      } else if (event.key == 'Delete') {
        console.log('Remove guess from active square');
        $( '.grid-square.active .guess' ).html('');
        $( '.grid-square.active .guess' ).hide();
        $( '.grid-square.active .candidates' ).show();
      }
    };
});
