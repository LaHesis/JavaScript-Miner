const DEBUG = false;

function Cell(x, y, hasMine = false, minesAroundAmount = 0) {
    this.x = x;
    this.y = y;
    this.hasMine = hasMine;
    this.minesAroundAmount = minesAroundAmount;
}

function Model(playFieldWidth, playFieldHeight, minesAmount) {
    this.playFieldWidth = (playFieldWidth >= 10) ? playFieldWidth : 10;
    this.playFieldHeight = (playFieldHeight >= 10) ? playFieldHeight : 10;
    this.minesAmount = (minesAmount >= 5) ? minesAmount : 5;

    this.mineAllocationTryLimit = 4000;
    this.field = [];
    this.minedCells = [];
    this.openedCellsAmount = 0;
    this.maxNotMinedOpenedCellsAmount = this.playFieldHeight * this.playFieldWidth - minesAmount;
    this.gameIsOver = false;
    this.debug = true;

    this.getCellsAroundCell = (cell) => {
        const y = cell.y;
        const x = cell.x;
        let cellsAround = [];
        for (let upperCellsX = x - 1; upperCellsX < x + 2; upperCellsX++) {
            const upperCell = this.field[y - 1] ? this.field[y - 1][upperCellsX] : null
            cellsAround.push(upperCell);
        }
        for (let lowerCellsX = x - 1; lowerCellsX < x + 2; lowerCellsX++) {
            const lowerCell = this.field[y + 1] ? this.field[y + 1][lowerCellsX] : null;
            cellsAround.push(lowerCell);
        }
        const leftCell = this.field[y][x - 1];
        const rightCell = this.field[y][x + 1];
        cellsAround.push(leftCell, rightCell)
        cellsAround = cellsAround.filter(cell => cell != undefined)
        return cellsAround;
    }

    this.placeMines = () => {
        let tryCount = 0;
        const field = this.field;
        while (this.minedCells.length < this.minesAmount) {
            if (tryCount > this.mineAllocationTryLimit) {
                alert('Too many mines! Try to decrease the amount)');
                break;
            }
            const y = Math.floor(Math.random() * this.playFieldHeight);
            const x = Math.floor(Math.random() * this.playFieldWidth);
            let theCell = field[y][x];
            if (theCell.hasMine == false) {
                theCell.hasMine = true;
                this.minedCells.push(theCell);
            }
            tryCount++;
        }

        // minesAroundAmount computing.
        for (let y = 0; y < this.playFieldHeight; y++) {
            for (let x = 0; x < this.playFieldWidth; x++) {
                this.getCellsAroundCell(field[y][x])
                    .filter(cell => cell.hasMine)
                    .forEach(cell => field[y][x].minesAroundAmount++);
            }
        }
    }

    this.fillField = () => {
        // Cell objects creation.
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
    if (DEBUG)
        model = new Model(20, 20, 5);
    else
        model = new Model(Number(prompt('Enter field of play width (the minimum is 10):\nВведите ширину игрового поля: (минимум — 10)', '10')),
                    Number(prompt('Enter field of play height (the minimum is 10):\nВведите высоту игрового поля: (минимум — 10)', '10')),
                    Number(prompt('Enter mine amount (the minimum is 5):\nВведите количество мин: (минимум — 5)', '10')));
    model.fillField();
    model.placeMines();
    view = new View(model.field);
    view.stylizeAndScaleCells()

    function openACell(cell, model) {
        if (!model.gameIsOver) {
            if (!cell.hasMine) model.openedCellsAmount++;
            if (model.openedCellsAmount == model.maxNotMinedOpenedCellsAmount) {
                handleAWin(model);
            }
            cell.tag.classList.remove('cell-covered');
            cell.tag.classList.add('cell-revealed');
            if (cell.hasMine) {
                cell.tag.classList.add('cell-mined');
                handleALoss(model);
            }
            else if (cell.minesAroundAmount == 0) {
                const cellRevealedBgColor = 'rgb(14, 105, 93)'
                cell.tag.style.color = cellRevealedBgColor;
                return 'safeCell'
            }
        }
    }

    // Cell click handling.
    for (let y = 0; y < model.field.length; y++) {
        model.field[y].forEach(cell => {
            cell.tag.addEventListener('click', (event) => {
                let cellsToReveal = [cell]
                do {
                    // Because some cells can already be opened by previous loop iteration.
                    cellsToReveal = cellsToReveal.filter(cell =>
                        cell.tag.classList.contains('cell-covered'))
                    if (cellsToReveal.length) {
                        const cellToReveal = cellsToReveal.pop(0);
                        const openingResult = openACell(cellToReveal, model);
                        if (openingResult == 'safeCell') {
                            const cellsAround = model.getCellsAroundCell(cellToReveal).filter(cell =>
                                cell.tag.classList.contains('cell-covered'));
                            cellsToReveal = cellsToReveal.concat(cellsAround);
                        }
                    }
                } while (cellsToReveal.length);
            });
        });
    }

    function handleAWin(model) {
        model.gameIsOver = true;
        model.minedCells.forEach(cell => {
            cell.tag.innerText = view.WinMineCharacter;
            cell.tag.style.backgroundColor = '#0d0';
            cell.tag.style.fontWeight = 'bold';
        });
        revealAllCells(model);
        alert('You\'ve won!!! Congratulations!\nУРАААААААААААА!!!');
    }

    function handleALoss(model) {
        if (!DEBUG) {
            model.gameIsOver = true;
            revealAllCells(model);
            alert('Sorry, but you lost(. You can try one more time if you wish and have time.');
        }
    }

    function revealAllCells(model) {
        for (let y = 0; y < model.field.length; y++) {
            model.field[y].forEach(cell => {
                cell.tag.classList.remove('cell-covered');
                cell.tag.classList.add('cell-revealed');
                if (cell.hasMine) {
                    cell.tag.classList.add('cell-mined');
                }
                else if (cell.minesAroundAmount == 0)
                    cell.tag.style.color = 'rgb(14, 105, 93)';
            });
        }
    }

    // For debug to open all cells.
    if (DEBUG)
        document.body.addEventListener('keydown', (event) => {
            if (event.code == 'Space') {
                revealAllCells(model);
            }
        });
}

function View(field) {
    this.fieldTag = document.getElementById('field');
    const mineCharacter = '☹'
    this.WinMineCharacter = '✔'
    this.theLongestFieldSide = field[0].length > field.length ? [field[0].length, 'wIsLonger'] : [field.length, 'hIsLonger'];
    if (field[0].length == field.length)
        this.theLongestFieldSide[1] = 'equal';

    // This method is not completely tested because I almost broke my mind against it all...
    this.getCellSize = (oneOfcellTags, shouldRemoveCellMargin) => {
        let cellMargin;
        if (shouldRemoveCellMargin) {
            cellMargin = 0;
            for (let y = 0; y < field.length; y++) {
                for (let x = 0; x < field[y].length; x++) {
                    field[y][x].tag.style.margin = '0';
                }
            }
        } else {
            cellMargin = Number(getComputedStyle(oneOfcellTags).margin.slice(0, -2));
        }
        const fieldPadding = Number(getComputedStyle(this.fieldTag).padding.slice(0, -2));
        const fieldAdditionalMargin = 40;
        const userScreenProportions = window.innerWidth > window.innerHeight ? 'wide' : 'portrait';
        const offsetTop = this.fieldTag.offsetTop;
        const screenHeightFieldSpace = window.innerHeight - cellMargin - fieldPadding * 2 - fieldAdditionalMargin - offsetTop - this.theLongestFieldSide[0] * cellMargin;
        const screenWidthFieldSpace = window.innerWidth - cellMargin - fieldPadding * 2 - fieldAdditionalMargin - this.theLongestFieldSide[0] * cellMargin;
        if (this.theLongestFieldSide[1] == 'equal') {
            if (userScreenProportions == 'wide') {
                const result = screenHeightFieldSpace / this.theLongestFieldSide[0] - cellMargin;
                // Remove cell margin if cells are small.
                return (result > 18 || shouldRemoveCellMargin) ? result : this.getCellSize(oneOfcellTags, true);
            } else {
                const result = screenWidthFieldSpace / this.theLongestFieldSide[0] - cellMargin;
                return (result > 18 || shouldRemoveCellMargin) ? result : this.getCellSize(oneOfcellTags, true);
            }
        }
        else if (this.theLongestFieldSide[1] == 'wIsLonger') {
            result = screenWidthFieldSpace / this.theLongestFieldSide[0] - cellMargin;
            return (result > 18 || shouldRemoveCellMargin) ? result : this.getCellSize(oneOfcellTags, true);
        }
        else {
            const result = screenHeightFieldSpace / this.theLongestFieldSide[0] - cellMargin;
            return (result > 18 || shouldRemoveCellMargin) ? result : this.getCellSize(oneOfcellTags, true);
        }
    }

    for (let y = 0; y < field.length; y++) {
        let row = document.createElement('div');
        row.classList.add('field-row');
        field[y].forEach(cell => {
            let cellTag = document.createElement('div');
            cellTag.classList.add('cell', 'cell-covered');
            if (cell.hasMine)
                cellTag.appendChild(document.createTextNode(mineCharacter));
            else
                cellTag.appendChild(document.createTextNode(cell.minesAroundAmount ? cell.minesAroundAmount : ''));
            row.appendChild(cellTag);
            cell.tag = cellTag;
        });
        this.fieldTag.appendChild(row);
    }

    this.stylizeAndScaleCells = () => {
        const cellSize = this.getCellSize(field[0][0].tag, false);
        const cellPadding = Number(getComputedStyle(field[0][0].tag).padding.slice(0, -2));
        const lineHeightAdditionalOffset = 2;
        for (let y = 0; y < field.length; y++) {
            for (let x = 0; x < field[y].length; x++) {
                field[y][x].tag.style.height = field[y][x].tag.style.width = cellSize + 'px';
                field[y][x].tag.style.lineHeight = cellSize - lineHeightAdditionalOffset * cellPadding + 'px';
                field[y][x].tag.style.fontSize = cellSize + 'px';
                field[y][x].tag.style.transitionDelay = (y / (field.length / 2) * this.theLongestFieldSide[0] + x) / 40 + 's';
                field[y][x].tag.classList.add('cell-appeared');

                if (field[y][x].hasMine) {
                    /*
                    Resize the mined cells font size if they look too large. Now ☹ looks OK.
                    But when cells are too small there are problems with characters alignment.
                    */
                    const cellSizeToFontSizeRatio = 1;
                    const fontSize = getComputedStyle(field[y][x].tag).fontSize.slice(0, -2);
                    field[y][x].tag.style.fontSize = fontSize * cellSizeToFontSizeRatio + 'px';
                }
            }
        }
        // Reset transition delay.
        const initialAnimationDelay = 3;
        setTimeout(() => {
        for (let y = 0; y < field.length; y++) {
            for (let x = 0; x < field[y].length; x++) {
                field[y][x].tag.style.transitionDelay = '0s';
                field[y][x].tag.style.transitionDuration = '.9s';
            }
        }
        }, (initialAnimationDelay));
    }
}

controller = new Controller();
