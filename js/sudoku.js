function generateSudokuTable() {
    var tbl = document.createElement('table');
    var tblBody = document.createElement('tbody');

    for (var i = 0; i < 9; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < 9; j++) {
            var cell = generateGridElement();
            row.appendChild(cell);
            cell.classList.add('grid-square');
            cell.classList.add('C' + (j+1));
            cell.classList.add('R' + (i+1));
            cell.classList.add('B' + (Math.floor(j / 3) + 1 + 3 * Math.floor(i / 3)));
            cell.id = 'C' + (j+1) + 'R' + (i+1);
        }

        tblBody.appendChild(row);

        row.classList.add('grid-row');
    }

    tbl.appendChild(tblBody);
    tbl.classList.add('sudoku-grid')
    return tbl;
}

function generateGridElement() {
    var parentCell = document.createElement('td');
    var wrapper = document.createElement('div');
    var tbl = document.createElement('table');
    var tblBody = document.createElement('tbody');
    var guess = document.createElement('div');

    for (var i = 0; i < 3; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < 3; j++) {
            var cell = document.createElement('td');
            var candidate = document.createElement('div');
            var candidateNum = j + 1 + 3 * i;
            candidate.innerHTML = candidateNum;
            candidate.classList.add('N' + candidateNum);
            cell.classList.add('candidate');
            cell.appendChild(candidate);
            row.appendChild(cell);
        }
        tblBody.appendChild(row);
    }

    tbl.appendChild(tblBody);
    wrapper.appendChild(tbl);
    wrapper.appendChild(guess);
    parentCell.appendChild(wrapper)

    wrapper.classList.add('cell-wrapper');
    tbl.classList.add('candidates');
    guess.classList.add('guess');

    return parentCell;
}

function placeTable(id) {
  var body = document.getElementById(id);
  var width = body.offsetWidth;
  body.style.height = width
  body.appendChild(generateSudokuTable());
  $( ".guess" ).css({ fontSize: width*0.08 });
  $( ".candidate" ).css({ fontSize: width*0.027 });
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
