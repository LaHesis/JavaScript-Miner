function Cell(x, y, hasMine = false, mineAroundAmount = 0) {
    this.x = x;
    this.y = y;
    this.hasMine = hasMine;
    this.mineAroundAmount = mineAroundAmount;
}



function Model(playFieldWidth, playFieldHeight, minesAmount) {
    this.playFieldWidth = playFieldWidth;
    this.playFieldHeight = playFieldHeight;
    this.minesAmount = minesAmount;

    this.mineAllocationTryLimit = 4000;
    this.field = [];

    this.placeMines = () => {
        let mines = [];
        let tryCount = 0;
        const field = this.field;
        while (mines.length < this.minesAmount) {
            if (tryCount > this.mineAllocationTryLimit) {
                alert('Too many mines! Try to decrease the amount)');
                break;
            }
            const x = Math.floor(Math.random() * this.playFieldHeight);
            const y = Math.floor(Math.random() * this.playFieldWidth);
            console.log(x, y);
            let theCell = field[x][y];
            if (theCell.hasMine == false) {
                theCell.hasMine = true;
                mines.push(theCell);
            }
            tryCount++;
        }
    }

    // this.putMineAroundAmount =

    this.fillField = () => {
        for (let y = 0; y < this.playFieldHeight; y++) {
            let row = []
            for (let x = 0; x < this.playFieldWidth; x++) {
                let newCell = new Cell(x, y);
                row.push(newCell);
            }
            this.field.push(row);
        }
    }
};


function Controller() {
    model = new Model(15, 15, 10);
    // model = new Model(Number(prompt('Enter field of play width (10 default): ', '10')),
    //             Number(prompt('Enter field of play height (10 default): ', '10')),
    //             Number(prompt('Enter mine amount (10 default): ', '10')));
    model.fillField();
    model.placeMines();
    view = new View(model.field);
    view.stylizeAndScaleCells()

    for (let y = 0; y < model.field.length; y++) {
        model.field[y].forEach(cell => {
            cell.tag.addEventListener('click', (e) => {
                cell.tag.classList.remove('cell-covered');
                cell.tag.classList.add('cell-revealed');
                if (cell.hasMine)
                    cell.tag.classList.add('cell-mined');
                else if (cell.mineAroundAmount == 0)
                    cell.tag.style.color = 'rgb(14, 105, 93)';
            });
        });
    }
}

function View(field) {
    this.fieldTag = document.getElementById('field');
    this.theLongestFieldSide = field[0].length > field.length ? [field[0].length, 'wIsLonger'] : [field.length, 'hIsLonger'];
    if (field[0].length == field.length)
        this.theLongestFieldSide[1] = 'equal';
    // This method is not completely tested because I almost broke my mind against it all...
    this.getCellSize = (oneOfcellTags) => {
        const cellMargin = Number(getComputedStyle(oneOfcellTags).margin.slice(0, -2));
        const cellPadding = Number(getComputedStyle(oneOfcellTags).padding.slice(0, -2));
        const fieldPadding = Number(getComputedStyle(this.fieldTag).padding.slice(0, -2));
        const fieldMargin = 40;
        const userScreenProportions = document.body.clientWidth > window.screen.availHeight ? 'wide' : 'portrait';
        const offsetTop = this.fieldTag.offsetTop;
        const screenHeightFieldSpace = window.screen.availHeight - cellMargin - cellPadding - fieldPadding * 2 - fieldMargin - offsetTop;
        const screenWidthFieldSpace = document.body.clientWidth - cellMargin - cellPadding - fieldPadding * 2 - fieldMargin;
        // const sizeThroughScreenHeightDividedIintoLongest = Math.round(screenHeightFieldSpace / (this.theLongestFieldSide[0] + cellMargin));
        if (this.theLongestFieldSide[1] == 'equal') {
            console.log('equal');
            console.log('clientWidth: ' + document.body.clientWidth);
            console.log('clientHeight: ' + window.screen.availHeight);
            console.log('offsetTop: ' + offsetTop);
            if (userScreenProportions == 'wide') {
                return screenHeightFieldSpace / (this.theLongestFieldSide[0] + cellMargin + cellPadding) - cellPadding - cellMargin;
            } else {
                return screenWidthFieldSpace / (this.theLongestFieldSide[0] + cellMargin + cellPadding) - cellPadding - cellMargin;
            }
        }
        else if (this.theLongestFieldSide[1] == 'wIsLonger')
            return screenWidthFieldSpace / (this.theLongestFieldSide[0] + cellMargin + cellPadding) - cellPadding - cellMargin;
        else
            return screenWidthFieldSpace / (this.theLongestFieldSide[0] + cellMargin + cellPadding) - cellPadding - cellMargin;
    }

    for (let y = 0; y < field.length; y++) {
        field[y].forEach(cell => {
            let cellTag = document.createElement('div');
            cellTag.classList.add('cell', 'cell-covered');
            if (cell.hasMine) {
                cellTag.appendChild(document.createTextNode('😢'));
            }
            else
                cellTag.appendChild(document.createTextNode(cell.mineAroundAmount));
            this.fieldTag.appendChild(cellTag);
            cell.tag = cellTag;
        });
        this.fieldTag.appendChild(document.createElement('br'));
    }

    this.stylizeAndScaleCells = () => {
        const cellSize = this.getCellSize(field[0][0].tag);
        for (let y = 0; y < field.length; y++) {
            for (let x = 0; x < field[y].length; x++) {
                field[y][x].tag.style.height = field[y][x].tag.style.width = cellSize + 'px';
                field[y][x].tag.style.lineHeight = cellSize + 'px';
                field[y][x].tag.style.fontSize = cellSize + 'px';
                field[y][x].tag.style.transitionDelay = (y / 4 * this.theLongestFieldSide[0] + x) / 40 + 's';
                field[y][x].tag.classList.add('cell-appeared');

            }
        }
        // Reset transition delay.
        setTimeout(() => {
        for (let y = 0; y < field.length; y++) {
            for (let x = 0; x < field[y].length; x++) {
                field[y][x].tag.style.transitionDelay = '0s';
                field[y][x].tag.style.transitionDuration = '.15s';
            }
        }
        }, (3));
    }
}

controller = new Controller();
