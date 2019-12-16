const DEBUG = false;

function Cell(x, y, hasMine = false, minesAroundAmount = 0) {
  this.x = x;
  this.y = y;
  this.hasMine = hasMine;
  this.minesAroundAmount = minesAroundAmount;
  this.markedAsMined = false;
}

function Model(fieldWidth, fieldHeight, minesAmount) {
  const minFWidth = 10;
  const minFHeight = 10;
  const minMinesAmount = 5;
  this.fieldWidth = (fieldWidth >= minFWidth) ? fieldWidth : minFWidth;
  this.fieldHeight = (fieldHeight >= minFHeight) ? fieldHeight : minFHeight;
  this.minesAmount = (minesAmount >= minMinesAmount) ? minesAmount : minMinesAmount;

  const fieldSquare = this.fieldHeight * this.fieldWidth;
  if (this.minesAmount >= fieldSquare) {
    alert('   EN: The mine amound is more than or equal to the total cell amount and will be set to total cell amound divided into 2.\n   RU: Количество мин больше общего количества ячеек, оно будет установлено в половину от количества ячеек.');
    this.minesAmount = Math.round(fieldSquare / 2);
  }

  this.field = [];
  this.minedCells = [];
  this.openedCellsAmount = 0;
  this.maxNotMinedOpenedCellsAmount = this.fieldHeight * this.fieldWidth - minesAmount;
  this.gameIsOver = false;

  this.getCellsAroundACell = (cell) => {
    const { y } = cell;
    const { x } = cell;
    let cellsAround = [];
    for (let upperCellsX = x - 1; upperCellsX < x + 2; upperCellsX += 1) {
      const upperCell = this.field[y - 1] ? this.field[y - 1][upperCellsX] : null;
      cellsAround.push(upperCell);
    }
    for (let lowerCellsX = x - 1; lowerCellsX < x + 2; lowerCellsX += 1) {
      const lowerCell = this.field[y + 1] ? this.field[y + 1][lowerCellsX] : null;
      cellsAround.push(lowerCell);
    }
    const leftCell = this.field[y][x - 1];
    const rightCell = this.field[y][x + 1];
    cellsAround.push(leftCell, rightCell);
    // Because border cells don't have some cells.
    cellsAround = cellsAround.filter((c) => c);
    return cellsAround;
  };

  this.placeMines = () => {
    /* A popping out 2-d array of cell coordinates.
    It allows selecting only not mined mines. */
    const availableCells = [];
    for (let y = 0; y < this.fieldHeight; y += 1) {
      availableCells[y] = [];
      for (let x = 0; x < this.fieldWidth; x += 1) {
        availableCells[y][x] = [y, x];
      }
    }

    while (this.minedCells.length < this.minesAmount) {
      const ranY = Math.floor(Math.random() * availableCells.length);
      const ranX = Math.floor(Math.random() * availableCells[ranY].length);

      // Find out the cell coordinates.
      const realY = availableCells[ranY][ranX][0];
      const realX = availableCells[ranY][ranX][1];
      const theCell = this.field[realY][realX];

      theCell.hasMine = true;
      this.minedCells.push(theCell);

      availableCells[ranY].splice(ranX, 1);
      if (availableCells[ranY].length === 0) {
        availableCells.splice(ranY, 1);
      }
    }

    // Computing mines amount of around cells.
    for (let y = 0; y < this.fieldHeight; y += 1) {
      for (let x = 0; x < this.fieldWidth; x += 1) {
        let cellsAround = this.getCellsAroundACell(this.field[y][x]);
        cellsAround = cellsAround.filter((cell) => cell.hasMine);
        cellsAround.forEach(() => {
          this.field[y][x].minesAroundAmount += 1;
        });
      }
    }
  };

  this.fillField = () => {
    // Cell objects creation.
    for (let y = 0; y < this.fieldHeight; y += 1) {
      const row = [];
      for (let x = 0; x < this.fieldWidth; x += 1) {
        const newCell = new Cell(x, y);
        row.push(newCell);
      }
      this.field.push(row);
    }
    this.placeMines();
  };
}

function View(field) {
  this.fieldTag = document.getElementById('field');
  const mineCharacter = '☹';
  this.winMineCharacter = '✔';
  this.markedAsMinedCharacter = '👌'; // ⛳🚩👌

  const widthIsLarger = field[0].length > field.length;
  this.fOrientation = {
    fLargerLength: widthIsLarger ? field[0].length : field.length,
    fLessLength: widthIsLarger ? field.length : field[0].length,
    fLayout: widthIsLarger ? 'wideF' : 'narrowF',
  };
  if (field[0].length === field.length) {
    this.fOrientation.fLayout = 'equalF';
  }

  // This method is not completely tested because I almost broke my mind against it all...
  this.getCellSize = (oneOfcellTags) => {
    const cellMargin = Number(getComputedStyle(oneOfcellTags).margin.slice(0, -2));
    const fieldPadding = Number(getComputedStyle(this.fieldTag).padding.slice(0, -2));

    const fieldBottomMargin = Number(getComputedStyle(this.fieldTag).marginBottom.slice(0, -2));
    const fieldLMargin = Number(getComputedStyle(this.fieldTag).marginLeft.slice(0, -2));
    const fieldRMargin = Number(getComputedStyle(this.fieldTag).marginRight.slice(0, -2));

    const reservedSpace = cellMargin + fieldPadding * 2 + this.fOrientation.fLargerLength * cellMargin * 2;
    const fieldOffsetTop = this.fieldTag.offsetTop;
    const scrHeightAvailableSpace = window.innerHeight - reservedSpace - fieldOffsetTop - fieldBottomMargin;
    const scrWidthAvailableSpace = window.innerWidth - reservedSpace - fieldLMargin - fieldRMargin;
    const userScreenProportions = window.innerWidth > window.innerHeight ? 'wideScr' : 'portraitScr';
    let cellSize;
    if (this.fOrientation.fLayout === 'equalF') {
      if (userScreenProportions === 'wideScr') {
        cellSize = scrHeightAvailableSpace / this.fOrientation.fLargerLength;
      } else {
        cellSize = scrWidthAvailableSpace / this.fOrientation.fLargerLength;
      }
    } else if (this.fOrientation.fLayout === 'wideF') {
      cellSize = scrWidthAvailableSpace / this.fOrientation.fLargerLength;
      // After horizontal scaling the cells total height can be larger than the user screen height.
      // So it's necessary to shrink the cell size according to the differential factor
      // between total cells height and available user screen height.
      // TO DO: IMPROVE VERTICAL SCALING -- THE CELL SIZE IS SCALED TOO MUCH.
      const potentialTotalHeight = cellSize * this.fOrientation.fLessLength;
      if (potentialTotalHeight > scrHeightAvailableSpace) {
        cellSize *= scrHeightAvailableSpace / potentialTotalHeight;
      }
    } else {
      cellSize = scrHeightAvailableSpace / this.fOrientation.fLargerLength;
    }
    // Used to upscale too small cells.
    const minCellSize = 20;
    cellSize = (cellSize >= minCellSize) ? cellSize : minCellSize;
    if (DEBUG) {
      console.log(`computed cellSize === ${cellSize}`);
    }
    return cellSize;
  };

  for (let y = 0; y < field.length; y += 1) {
    const row = document.createElement('div');
    row.classList.add('field-row');
    field[y].forEach((cell) => {
      const cellTag = document.createElement('div');
      cellTag.classList.add('cell', 'cell-covered');
      if (cell.hasMine) {
        cellTag.appendChild(document.createTextNode(mineCharacter));
      } else {
        cellTag.appendChild(document.createTextNode(cell.minesAroundAmount ? cell.minesAroundAmount : ''));
      }
      row.appendChild(cellTag);
      cell.tag = cellTag;
    });
    this.fieldTag.appendChild(row);
  }

  this.stylizeAndScaleCells = () => {
    let cellSize = this.getCellSize(field[0][0].tag);
    // When evaluated cell size is less, cell margin will be removed.
    const noMarginModeCellMaxSize = 30;
    if (cellSize < noMarginModeCellMaxSize) {
      for (let y = 0; y < field.length; y += 1) {
        for (let x = 0; x < field[y].length; x += 1) {
          field[y][x].tag.style.margin = '0';
        }
      }
      // Recompute cell size because without margin it should be larger.
      cellSize = this.getCellSize(field[0][0].tag);
    }

    const cellPadding = Number(getComputedStyle(field[0][0].tag).padding.slice(0, -2));
    const durationInSec = 2.5;
    const animationType = Math.floor(Math.random() * 8);
    if (DEBUG) {
      console.log(`animationType is ${animationType}`);
    }

    for (let y = 0; y < field.length; y += 1) {
      for (let x = 0; x < field[y].length; x += 1) {
        field[y][x].tag.style.height = `${cellSize}px`;
        field[y][x].tag.style.width = `${cellSize}px`;
        field[y][x].tag.style.lineHeight = `${cellSize}px`;
        field[y][x].tag.style.fontSize = `${cellSize - cellPadding}px`;

        // Transition-delay computing.
        let trDelay;
        const yArg = (y / field.length) * Math.PI;
        const xArg = (x / field[y].length) * Math.PI;
        const speedRatio = 1.2;
        switch (animationType) {
          case 0:
            trDelay = `${(Math.cos(yArg) + Math.sin(xArg)) * speedRatio + speedRatio}s`;
            break;
          case 1:
            trDelay = `${(Math.cos(yArg) * Math.cos(xArg)) * speedRatio + speedRatio}s`;
            break;
          case 2:
            trDelay = `${(Math.cos(yArg) + Math.cos(xArg)) / speedRatio + speedRatio * 2}s`;
            break;
          case 3:
            trDelay = `${(Math.cos(yArg * 2) + Math.cos(xArg * 2)) + 2.2}s`;
            break;
          case 4:
            trDelay = `${(Math.cos(y / 2) + Math.cos(x / 2)) * 0.7 + 1.5}s`;
            break;
          case 5:
            trDelay = `${(y / field.length + x / field[0].length) * (durationInSec / 2)}s`;
            break;
          case 6:
            trDelay = `${(x / field[0].length) * durationInSec}s`;
            break;
          default:
            trDelay = `${(y / field.length) * durationInSec}s`;
            break;
        }
        field[y][x].tag.style.transitionDelay = trDelay;

        field[y][x].tag.classList.add('cell-appeared');
      }
    }

    // Now, when the cell size is computed and assigned, field should opaque.
    this.fieldTag.style.opacity = '1';

    // Reset transition delay after initial transition.
    const initialAnimationDelay = 3;
    setTimeout(() => {
      for (let y = 0; y < field.length; y += 1) {
        for (let x = 0; x < field[y].length; x += 1) {
          field[y][x].tag.style.transitionDelay = '0s';
          field[y][x].tag.style.transitionDuration = '.5s';
        }
      }
    }, (initialAnimationDelay));
  };
}

function Controller() {
  function takeGameSettings() {
    const introMessageEN = '   EN: Hi! Use left mouse button to open cells and right button to mark cells as mined. The numbers in cells designite amount of mines that adjacent cells have.';
    const introMessageRU = '   RU: Привет! Используй левую клавишу мыши, чтобы открывать ячейки, и правую, чтобы помечать предположительно заминированные ячейки. Цифры в ячейках обозначают количество мин, находящихся в смежных ячейках.';
    const introMessage = `${introMessageEN}\n${introMessageRU}\n`;
    let settings = [];
    if (DEBUG) {
      // Square fields.
      // settings = [14, 14, 12];
      // settings = [10, 10, 10];
      // settings = [25, 25, 12];
      // Wide fields.
      // settings = [30, 10, 12];
      // TO DO: IMPROVE VERTICAL SCALING -- THE CELL SIZE IS SCALED TOO MUCH.
      settings = [20, 10, 12];
      // Narrow field.
      // settings = [10, 30, 12];
    } else {
      const widthMessage = '   EN: Enter field of play width (the minimum is 10):\n   RU: Введите ширину игрового поля: (минимум — 10)';
      const fWidth = Number(prompt(introMessage + widthMessage, '10'));
      const heightMessage = '   EN: Enter field of play height (the minimum is 10):\n   RU: Введите высоту игрового поля: (минимум — 10)';
      const fHeight = Number(prompt(heightMessage, '10'));
      const minesAmountMessage = '   EN: Enter mine amount (the minimum is 5):\n   RU: Введите количество мин: (минимум — 5)';
      const minesAmount = Number(prompt(minesAmountMessage, '10'));
      settings = [fWidth, fHeight, minesAmount];
    }
    return settings;
  }

  this.startNewGame = () => {
    this.model = new Model(...takeGameSettings());
    this.model.fillField();
    this.view = new View(this.model.field);
    this.view.stylizeAndScaleCells();
    // Cell click handling.
    this.addClickHandlers();
  };

  this.revealAllCells = () => {
    for (let y = 0; y < this.model.field.length; y += 1) {
      this.model.field[y].forEach((cell) => {
        cell.tag.classList.remove('cell-covered');
        cell.tag.classList.remove('marked-as-mined');
        cell.tag.classList.add('cell-revealed');
        if (cell.hasMine) {
          cell.tag.classList.add('cell-mined');
        } else if (cell.minesAroundAmount === 0) {
          cell.tag.style.color = 'rgb(14, 105, 93)';
        }
      });
    }
  };

  this.handleAWin = () => {
    this.model.gameIsOver = true;
    this.model.minedCells.forEach(cell => {
      cell.tag.innerText = this.view.winMineCharacter;
      cell.tag.classList.add('cleared-up-after-win');
    });
    this.revealAllCells();
    alert('   EN: You\'ve won!!! Congratulations!\n   RU: УРАААААААААААА!!!');
  };

  this.handleALoss = () => {
    if (!DEBUG) {
      this.model.gameIsOver = true;
      this.revealAllCells();
      alert('   EN: Sorry, but you lost(. You can try one more time if you wish and have time.\n   RU: Извините, но вы проиграли(.');
    }
  };

  this.openACell = (cell) => {
    if (!this.model.gameIsOver && !cell.markedAsMined) {
      if (!cell.hasMine) this.model.openedCellsAmount++;
      if (this.model.openedCellsAmount === this.model.maxNotMinedOpenedCellsAmount) {
        this.handleAWin();
      }
      cell.tag.classList.remove('cell-covered');
      cell.tag.classList.add('cell-revealed');
      if (cell.hasMine) {
        cell.tag.classList.add('cell-mined');
        this.handleALoss();
      } else if (cell.minesAroundAmount === 0) {
        const cellRevealedBgColor = 'rgb(14, 105, 93)';
        cell.tag.style.color = cellRevealedBgColor;
        return 'safeCell';
      }
    }
  };

  this.markAsMined = (cell) => {
    if (cell.tag.classList.contains('cell-covered')) {
      cell.markedAsMined = !cell.markedAsMined;
      cell.tag.classList.toggle('marked-as-mined');
      cell.tag.setAttribute('character', this.view.markedAsMinedCharacter);
    }
  };

  this.addClickHandlers = () => {
    document.body.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
    for (let y = 0; y < this.model.field.length; y += 1) {
      this.model.field[y].forEach((cell) => {
        cell.tag.addEventListener('click', () => {
          let cellsToReveal = [cell];
          do {
            // Because some cells can already be opened by previous loop iteration.
            cellsToReveal = cellsToReveal.filter((toRevCell) => toRevCell.tag.classList.contains('cell-covered'));
            if (cellsToReveal.length) {
              const cellToReveal = cellsToReveal.pop(0);
              const openingResult = this.openACell(cellToReveal);
              if (openingResult === 'safeCell') {
                const cellsAround = this.model.getCellsAroundACell(cellToReveal).filter(cell => cell.tag.classList.contains('cell-covered'));
                cellsToReveal = cellsToReveal.concat(cellsAround);
              }
            }
          } while (cellsToReveal.length);
        });
        cell.tag.addEventListener('contextmenu', () => {
          this.markAsMined(cell);
        });
      });
    }
    // For debug to reveal all cells.
    if (DEBUG) {
      document.body.addEventListener('keydown', (event) => {
        if (event.code == 'Space') {
          this.revealAllCells();
        }
      });
    }
  };
}

const controller = new Controller();
controller.startNewGame();
