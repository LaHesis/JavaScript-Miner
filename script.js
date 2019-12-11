const DEBUG = false;

function Cell(x, y, hasMine = false, minesAroundAmount = 0) {
    this.x = x;
    this.y = y;
    this.hasMine = hasMine;
    this.minesAroundAmount = minesAroundAmount;
    this.markedAsMined = false;
}

function Model(fieldWidth, fieldHeight, minesAmount) {
    this.fieldWidth = (fieldWidth >= 10) ? fieldWidth : 10;
    this.fieldHeight = (fieldHeight >= 10) ? fieldHeight : 10;
    this.minesAmount = (minesAmount >= 5) ? minesAmount : 5;
    const fieldSquare = this.fieldHeight * this.fieldWidth;
    if (this.minesAmount >= fieldSquare) {
        alert('The mine amound is more than or equal to the total cell amount and will be set to total cell amound divided into 2.\nКоличество мин больше общего количества ячеек, оно будет установлено в половину от количества ячеек.')
        this.minesAmount = Math.round(fieldSquare / 2);
    }

    this.mineAllocationTryLimit = 4000;
    this.field = [];
    this.minedCells = [];
    this.openedCellsAmount = 0;
    this.maxNotMinedOpenedCellsAmount = this.fieldHeight * this.fieldWidth - minesAmount;
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
        /*
        It's a popping down 2-d array of cells which stores coordinates of main field cells without mines.
        Its length and row lengths allow to generate random available cell.
        */
        let availableCells = [];
        for (let y = 0; y < this.fieldHeight; y++) {
            availableCells[y] = [];
            for (let x = 0; x < this.fieldWidth; x++) {
                availableCells[y][x] = [y, x];
            }
        }

        while (this.minedCells.length < this.minesAmount) {
            const ranY = Math.floor(Math.random() * availableCells.length);
            const ranX = Math.floor(Math.random() * availableCells[ranY].length);

            // Find out the cell coordinates.
            const realY = availableCells[ranY][ranX][0];
            const realX = availableCells[ranY][ranX][1];
            let theCell = this.field[realY][realX];

            theCell.hasMine = true;
            this.minedCells.push(theCell);

            availableCells[ranY].splice(ranX, 1);
            if (availableCells[ranY].length == 0)
                availableCells.splice(ranY, 1);
        }

        // minesAroundAmount computing.
        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                this.getCellsAroundCell(this.field[y][x])
                    .filter(cell => cell.hasMine)
                    .forEach(cell => this.field[y][x].minesAroundAmount++);
            }
        }
    }

    this.fillField = () => {
        // Cell objects creation.
        for (let y = 0; y < this.fieldHeight; y++) {
            let row = []
            for (let x = 0; x < this.fieldWidth; x++) {
                let newCell = new Cell(x, y);
                row.push(newCell);
            }
            this.field.push(row);
        }
    }
};


function Controller() {
    const introMessageEN = 'Hi! Use left mouse button to open cells and right button to mark cells as mined. The numbers in cells designite amount of mines that adjacent cells have.';
    const introMessageRU = 'Привет! Используй левую клавишу мыши, чтобы открывать ячейки, и правую, чтобы помечать предположительно заминированные ячейки. Цифры в ячейках обозначают количество мин, находящихся в смежных ячейках.';
    const introMessage = `${introMessageEN}\n\n${introMessageRU}\n\n`;
    if (DEBUG)
        model = new Model(14, 14, 12);
    else
        model = new Model(Number(prompt(introMessage + 'Enter field of play width (the minimum is 10):\nВведите ширину игрового поля: (минимум — 10)', '10')),
                    Number(prompt('Enter field of play height (the minimum is 10):\nВведите высоту игрового поля: (минимум — 10)', '10')),
                    Number(prompt('Enter mine amount (the minimum is 5):\nВведите количество мин: (минимум — 5)', '10')));
    model.fillField();
    model.placeMines();
    view = new View(model.field);
    view.stylizeAndScaleCells()

    document.body.addEventListener('contextmenu', event => {
        event.preventDefault();
    })

    function openACell(cell, model) {
        if (!model.gameIsOver && !cell.markedAsMined) {
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
            cell.tag.addEventListener('contextmenu', event => {
                markAsMined(cell);
            })
        });
    }

    function markAsMined(cell) {
        if (cell.tag.classList.contains('cell-covered')) {
            cell.markedAsMined = !cell.markedAsMined;
            cell.tag.classList.toggle('marked-as-mined');
            cell.tag.setAttribute('character', view.markedAsMinedCharacter);
        }
    }

    function handleAWin(model) {
        model.gameIsOver = true;
        model.minedCells.forEach(cell => {
            cell.tag.innerText = view.winMineCharacter;
            cell.tag.classList.add('cleared-up-after-win');
        });
        revealAllCells(model);
        alert('You\'ve won!!! Congratulations!\nУРАААААААААААА!!!');
    }

    function handleALoss(model) {
        if (!DEBUG) {
            model.gameIsOver = true;
            revealAllCells(model);
            alert('Sorry, but you lost(. You can try one more time if you wish and have time.\nИзвините, но вы проиграли(.');
        }
    }

    function revealAllCells(model) {
        for (let y = 0; y < model.field.length; y++) {
            model.field[y].forEach(cell => {
                cell.tag.classList.remove('cell-covered');
                cell.tag.classList.remove('marked-as-mined');
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
    const mineCharacter = '☹';
    this.winMineCharacter = '✔';
    this.markedAsMinedCharacter = '👌'; // ⛳🚩👌
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
        // When evaluated cell size is less, cell margin will be removed.
        const noMarginModeCellMaxSize = 30;
        if (this.theLongestFieldSide[1] == 'equal') {
            if (userScreenProportions == 'wide') {
                const result = screenHeightFieldSpace / this.theLongestFieldSide[0] - cellMargin;
                // Remove cell margin if cells are small.
                return (result > noMarginModeCellMaxSize || shouldRemoveCellMargin) ? result : this.getCellSize(oneOfcellTags, true);
            } else {
                const result = screenWidthFieldSpace / this.theLongestFieldSide[0] - cellMargin;
                return (result > noMarginModeCellMaxSize || shouldRemoveCellMargin) ? result : this.getCellSize(oneOfcellTags, true);
            }
        }
        else if (this.theLongestFieldSide[1] == 'wIsLonger') {
            result = screenWidthFieldSpace / this.theLongestFieldSide[0] - cellMargin;
            return (result > noMarginModeCellMaxSize || shouldRemoveCellMargin) ? result : this.getCellSize(oneOfcellTags, true);
        }
        else {
            const result = screenHeightFieldSpace / this.theLongestFieldSide[0] - cellMargin;
            return (result > noMarginModeCellMaxSize || shouldRemoveCellMargin) ? result : this.getCellSize(oneOfcellTags, true);
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
        const minCellSize = 20;
        let cellSize = this.getCellSize(field[0][0].tag, false);
        if (cellSize < minCellSize)
            cellSize = minCellSize;
        const cellPadding = Number(getComputedStyle(field[0][0].tag).padding.slice(0, -2));
        const rowsTransitionRatio = 4;
        const fontScaleDownRatio = 1;
        for (let y = 0; y < field.length; y++) {
            for (let x = 0; x < field[y].length; x++) {
                field[y][x].tag.style.height = field[y][x].tag.style.width = cellSize + 'px';
                field[y][x].tag.style.lineHeight = cellSize - cellPadding + 'px';
                field[y][x].tag.style.fontSize = (cellSize - cellPadding) * fontScaleDownRatio + 'px';
                field[y][x].tag.style.transitionDelay = (y / (field.length / rowsTransitionRatio) * this.theLongestFieldSide[0] + x) / 40 + 's';
                field[y][x].tag.classList.add('cell-appeared');
            }
        }
        // Reset transition delay after initial transition.
        const initialAnimationDelay = 3;
        setTimeout(() => {
        for (let y = 0; y < field.length; y++) {
            for (let x = 0; x < field[y].length; x++) {
                field[y][x].tag.style.transitionDelay = '0s';
                field[y][x].tag.style.transitionDuration = '.5s';
            }
        }
        }, (initialAnimationDelay));
    }
}

controller = new Controller();
