const DEBUG = false;

function Cell(x, y, hasMine = false, minesAroundAmount = 0) {
  this.x = x;
  this.y = y;
  this.hasMine = hasMine;
  this.minesAroundAmount = minesAroundAmount;
  this.markedAsMined = false;
}

function Model(finalBoardWidth, finalBoardHeight, finalMinesAmount) {
  // Man 2-d array of cells.
  this.board = [];
  this.boardWidth = finalBoardWidth;
  this.boardHeight = finalBoardHeight;
  this.minesAmount = finalMinesAmount;
  this.minedCells = [];
  this.openedCellsAmount = 0;
  this.gameIsOver = false;

  this.getCellsAroundACell = (cell) => {
    const { y } = cell;
    const { x } = cell;
    let cellsAround = [];
    for (let upperCellsX = x - 1; upperCellsX < x + 2; upperCellsX += 1) {
      const upperCell = this.board[y - 1] ? this.board[y - 1][upperCellsX] : null;
      cellsAround.push(upperCell);
    }
    for (let lowerCellsX = x - 1; lowerCellsX < x + 2; lowerCellsX += 1) {
      const lowerCell = this.board[y + 1] ? this.board[y + 1][lowerCellsX] : null;
      cellsAround.push(lowerCell);
    }
    const leftCell = this.board[y][x - 1];
    const rightCell = this.board[y][x + 1];
    cellsAround.push(leftCell, rightCell);
    // Because border cells don't have some cells.
    cellsAround = cellsAround.filter((c) => c);
    return cellsAround;
  };

  this.placeMines = () => {
    /* A popping out 2-d array of cell coordinates.
    It allows selecting only not mined mines. */
    const availableCells = [];
    for (let y = 0; y < this.boardHeight; y += 1) {
      availableCells[y] = [];
      for (let x = 0; x < this.boardWidth; x += 1) {
        availableCells[y][x] = [y, x];
      }
    }

    while (this.minedCells.length < this.minesAmount) {
      const ranY = Math.floor(Math.random() * availableCells.length);
      const ranX = Math.floor(Math.random() * availableCells[ranY].length);

      // Find out the cell coordinates.
      const realY = availableCells[ranY][ranX][0];
      const realX = availableCells[ranY][ranX][1];
      const theCell = this.board[realY][realX];

      theCell.hasMine = true;
      this.minedCells.push(theCell);

      availableCells[ranY].splice(ranX, 1);
      if (availableCells[ranY].length === 0) {
        availableCells.splice(ranY, 1);
      }
    }

    // Computing mines amount of around cells.
    for (let y = 0; y < this.boardHeight; y += 1) {
      for (let x = 0; x < this.boardWidth; x += 1) {
        let cellsAround = this.getCellsAroundACell(this.board[y][x]);
        cellsAround = cellsAround.filter((cell) => cell.hasMine);
        cellsAround.forEach(() => {
          this.board[y][x].minesAroundAmount += 1;
        });
      }
    }
  };

  this.fillBoard = () => {
    // Cell objects creating.
    for (let y = 0; y < this.boardHeight; y += 1) {
      const row = [];
      for (let x = 0; x < this.boardWidth; x += 1) {
        const newCell = new Cell(x, y);
        row.push(newCell);
      }
      this.board.push(row);
    }
    this.placeMines();
  };

  this.fillBoard();
}

function View(board) {
  this.boardTag = document.getElementById('board');
  const mineCharacter = '☹';
  this.winMineCharacter = '✔';
  this.markedAsMinedCharacter = '👌'; // ⛳🚩👌
  this.revealingCellaudio = new Audio();
  this.revealingCellaudio.src = 'sounds/own_footstep_faster.mp3';
  this.revealingCellaudio.volume = 0.3;

  this.markingCellaudio = new Audio();
  this.markingCellaudio.src = 'sounds/own_knock.mp3';
  this.markingCellaudio.volume = 0.3;

  this.lossGameOverAudio = new Audio();
  this.lossGameOverAudio.src = 'sounds/rustling_or_squeak.mp3';
  this.lossGameOverAudio.volume = 0.7;

  const widthIsLarger = board[0].length > board.length;
  this.fOrientation = {
    fLargerLength: widthIsLarger ? board[0].length : board.length,
    fLessLength: widthIsLarger ? board.length : board[0].length,
    fLayout: widthIsLarger ? 'wideF' : 'narrowF',
  };
  if (board[0].length === board.length) {
    this.fOrientation.fLayout = 'equalF';
  }

  // Cell elements creating and appending.
  for (let y = 0; y < board.length; y += 1) {
    const row = document.createElement('div');
    row.classList.add('board-row');
    board[y].forEach((cell) => {
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
    this.boardTag.appendChild(row);
  }

  // This method is not completely tested because I almost broke my mind against it all...
  this.getCellSize = (oneOfcellTags) => {
    const cellMargin = Number(getComputedStyle(oneOfcellTags).margin.slice(0, -2));
    const boardPadding = Number(getComputedStyle(this.boardTag).padding.slice(0, -2));

    const boardBottomMargin = Number(getComputedStyle(this.boardTag).marginBottom.slice(0, -2));
    const boardLMargin = Number(getComputedStyle(this.boardTag).marginLeft.slice(0, -2));
    const boardRMargin = Number(getComputedStyle(this.boardTag).marginRight.slice(0, -2));

    const reservedSpace = cellMargin + boardPadding * 2 + this.fOrientation.fLargerLength * cellMargin * 2;
    const boardOffsetTop = this.boardTag.offsetTop;
    const scrHeightAvailableSpace = window.innerHeight - reservedSpace - boardOffsetTop - boardBottomMargin;
    const scrWidthAvailableSpace = window.innerWidth - reservedSpace - boardLMargin - boardRMargin;
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

  this.stylizeAndScaleCells = () => {
    let cellSize = this.getCellSize(board[0][0].tag);
    // When evaluated cell size is less, cell margin will be removed.
    const noMarginModeCellMaxSize = 30;
    if (cellSize < noMarginModeCellMaxSize) {
      for (let y = 0; y < board.length; y += 1) {
        for (let x = 0; x < board[y].length; x += 1) {
          board[y][x].tag.style.margin = '0';
        }
      }
      // Recompute cell size because without margin it should be larger.
      cellSize = this.getCellSize(board[0][0].tag);
    }

    const cellPadding = Number(getComputedStyle(board[0][0].tag).padding.slice(0, -2));
    const durationInSec = 2.5;
    const animationType = Math.floor(Math.random() * 8);
    if (DEBUG) {
      console.log(`animationType is ${animationType}`);
    }

    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board[y].length; x += 1) {
        board[y][x].tag.style.height = `${cellSize}px`;
        board[y][x].tag.style.width = `${cellSize}px`;
        board[y][x].tag.style.lineHeight = `${cellSize}px`;
        board[y][x].tag.style.fontSize = `${cellSize - cellPadding}px`;

        // Transition-delay computing.
        let trDelay;
        const yArg = (y / board.length) * Math.PI;
        const xArg = (x / board[y].length) * Math.PI;
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
            trDelay = `${(y / board.length + x / board[0].length) * (durationInSec / 2)}s`;
            break;
          case 6:
            trDelay = `${(x / board[0].length) * durationInSec}s`;
            break;
          default:
            trDelay = `${(y / board.length) * durationInSec}s`;
            break;
        }
        board[y][x].tag.style.transitionDelay = trDelay;

        board[y][x].tag.classList.add('cell-appeared');
      }
    }

    // Now, when the cell size is computed and assigned, board should opaque.
    this.boardTag.style.opacity = '1';

    // Reset transition delay after initial transition.
    const initialAnimationDelay = 3;
    setTimeout(() => {
      for (let y = 0; y < board.length; y += 1) {
        for (let x = 0; x < board[y].length; x += 1) {
          board[y][x].tag.style.transitionDelay = '0s';
          board[y][x].tag.style.transitionDuration = '.5s';
        }
      }
    }, (initialAnimationDelay));
  };

  this.markCellAsMined = (cell) => {
    if (cell.tag.classList.contains('cell-covered')) {
      cell.markedAsMined = !cell.markedAsMined;
      cell.tag.classList.toggle('marked-as-mined');
      cell.tag.setAttribute('character', this.markedAsMinedCharacter);
      this.playAudio('marking');
    }
  };

  this.revealAllCells = () => {
    for (let y = 0; y < board.length; y += 1) {
      board[y].forEach((cell) => {
        this.revealACell(cell);
        cell.tag.classList.remove('marked-as-mined');
        if (cell.hasMine) {
          this.displayACellAsMined(cell);
        }
      });
    }
  };

  this.revealACell = (cell) => {
    cell.tag.classList.remove('cell-covered');
    cell.tag.classList.add('cell-revealed');
  };

  this.displayACellAsMined = (cell) => {
    cell.tag.classList.add('cell-mined');
  };

  this.changeACellTransitionDelay = (cell, newTDelay) => {
    cell.tag.style.transitionDelay = `${newTDelay}s`;
  };

  this.playAudio = (type) => {
    switch (type) {
      case 'lossGameOverAudio':
        this.lossGameOverAudio.play();
        break;
      case 'marking':
        this.markingCellaudio.play();
        break;
      // Also for revealing a cell.
      default:
        this.revealingCellaudio.play();
        break;
    }
  };
}

function Controller() {
  this.gameCompletionMessageDelay = 500;

  function takeGameSettings() {
    const minBWidth = 10;
    const defBWidth = 12;
    const minBHeight = 10;
    const defBHeight = 12;
    let settings = [];

    if (DEBUG) {
      // Square boards.
      // settings = [14, 14, 12, null];
      // settings = [10, 10, 10, null];
      // settings = [25, 25, 12, null];
      // Wide boards.
      // settings = [30, 10, 12, null];
      // TO DO: IMPROVE VERTICAL SCALING -- THE CELL SIZE IS SCALED TOO MUCH.
      settings = [20, 10, 12, null];
      // Narrow board.
      // settings = [10, 30, 12, null];
      settings[3] = settings[0] * settings[1];
    } else {
      const introMessageEN = '   EN: Hi! Use left mouse button to open cells and right button to mark cells as mined. The digits in cells designate amount of mines that adjacent cells have.';
      const introMessageRU = '   RU: Привет! Используй левую клавишу мыши, чтобы открывать ячейки, и правую, чтобы помечать предположительно заминированные ячейки. Цифры в ячейках обозначают количество мин, находящихся в смежных ячейках.\n';
      const introMessage = `${introMessageEN}\n${introMessageRU}\n`;

      const widthMessage = `   EN: Enter board width (the minimum is ${minBWidth}, by default is — ${defBWidth}).\n   RU: Введите ширину игрового поля: (минимум — ${minBWidth}), по умолчанию — ${defBWidth}.`;
      const inputBoardWidth = prompt(introMessage + widthMessage, defBWidth);
      const heightMessage = `   EN: Enter board height (the minimum is ${minBHeight}, by default is — ${defBHeight}).\n   RU: Введите высоту игрового поля: (минимум — ${minBHeight}), по умолчанию — ${defBHeight}.`;
      const inputBoardHeight = prompt(heightMessage, defBHeight);

      const nBoardWidth = Number(inputBoardWidth);
      const nBoardHeight = Number(inputBoardHeight);

      let finalBoardWidth;
      let finalboardHeight;

      if (Number.isNaN(nBoardWidth) || nBoardWidth === 0) {
        finalBoardWidth = defBWidth;
      } else {
        finalBoardWidth = (nBoardWidth >= minBWidth) ? nBoardWidth : minBWidth;
      }
      if (Number.isNaN(nBoardHeight) || nBoardHeight === 0) {
        finalboardHeight = defBHeight;
      } else {
        finalboardHeight = (nBoardHeight >= minBHeight) ? nBoardHeight : minBHeight;
      }

      const boardSize = finalBoardWidth * finalboardHeight;
      const minMinesAmount = 5;
      const autoMinesAmountRatio = 0.10;
      const defMinesAmount = Math.round(boardSize * autoMinesAmountRatio);
      const minesAmountMessage = `   EN: Enter mine amount (the minimum is ${minMinesAmount}, the default is ${defMinesAmount} that is total cell amount multiplied by ${autoMinesAmountRatio}).\n   RU: Введите количество мин: (минимум — ${minMinesAmount}, по умолчанию — ${defMinesAmount}, что составляет приблизительно ${autoMinesAmountRatio} от общего количества ячеек).`;
      const inputMinesAmount = prompt(minesAmountMessage, defMinesAmount);
      const nMinesAmount = Number(inputMinesAmount);
      let finalMinesAmount;
      if (Number.isNaN(nMinesAmount)) {
        finalMinesAmount = defMinesAmount;
      } else {
        finalMinesAmount = (nMinesAmount >= minBHeight) ? nMinesAmount : minBHeight;
      }
      settings = [finalBoardWidth, finalboardHeight, finalMinesAmount, boardSize];
    }
    return settings;
  }

  this.startNewGame = () => {
    const settings = takeGameSettings();
    this.model = new Model(...settings);
    // TODO: Replace the array with an object for better readability.
    this.maxNotMinedOpenedCellsAmount = settings[3] - settings[2];

    this.view = new View(this.model.board);
    this.view.stylizeAndScaleCells();
    // Cell click handling.
    this.addClickHandlers();
  };

  this.handleAWin = () => {
    this.model.gameIsOver = true;
    this.model.minedCells.forEach(cell => {
      cell.tag.innerText = this.view.winMineCharacter;
      cell.tag.classList.add('cleared-up-after-win');
    });
    this.view.revealAllCells();
    const winEnMessage = '   EN: You\'ve won!!! Congratulations!';
    const winRuMessage = '   RU: УРАААААААААААА!!!';
    setTimeout(() => {
      alert(`${winEnMessage}\n${winRuMessage}`);
    }, this.gameCompletionMessageDelay);
  };

  this.handleALoss = () => {
    if (!DEBUG) {
      this.model.gameIsOver = true;
      this.view.revealAllCells();
      this.view.playAudio('lossGameOverAudio');
      const lossEnMessage = '   EN: Sorry, but you lost(. You can try one more time if you wish and have time.';
      const lossRuMessage = '   RU: Извините, но вы проиграли(.';
      setTimeout(() => {
        alert(`${lossEnMessage}\n${lossRuMessage}`);
      }, this.gameCompletionMessageDelay);
    }
  };

  this.openACell = (cell) => {
    if (!this.model.gameIsOver && !cell.markedAsMined) {
      if (!cell.hasMine) {
        this.model.openedCellsAmount += 1;
      }
      if (this.model.openedCellsAmount === this.maxNotMinedOpenedCellsAmount) {
        this.handleAWin();
      }
      this.view.revealACell(cell);
      if (cell.hasMine) {
        this.view.displayACellAsMined(cell);
        this.handleALoss();
      }
    }
    return cell;
  };

  this.addClickHandlers = () => {
    document.body.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    for (let y = 0; y < this.model.board.length; y += 1) {
      // Used below for incrementing delay in bunches, i.e. for every bunchSize cells.
      const bunchSize = 7;

      this.model.board[y].forEach((cell) => {
        cell.tag.addEventListener('click', () => {
          let cTransitionAndAudioDelay = 0;
          let bunchCounter = 0;
          let cellsToReveal = [cell];
          do {
            // Because some cells might already be opened by previous loop iteration.
            cellsToReveal = cellsToReveal.filter((toRevCell) => toRevCell.tag.classList.contains('cell-covered'));
            if (cellsToReveal.length) {
              const cellToReveal = cellsToReveal.pop(0);

              this.view.changeACellTransitionDelay(cellToReveal, cTransitionAndAudioDelay);

              if (bunchCounter === 0) {
                this.view.playAudio();
              } else if (bunchCounter % bunchSize === 0) {
                cTransitionAndAudioDelay += 0.05;
                setTimeout(() => {
                  this.view.playAudio();
                }, cTransitionAndAudioDelay * 1000);
              }
              bunchCounter += 1;
              this.openACell(cellToReveal);

              if (cellToReveal.minesAroundAmount === 0) {
                const cellsAround = this.model.getCellsAroundACell(cellToReveal).filter(cell => cell.tag.classList.contains('cell-covered'));
                cellsToReveal = cellsToReveal.concat(cellsAround);
              }
            }
          } while (cellsToReveal.length);
        });

        cell.tag.addEventListener('contextmenu', () => {
          this.view.markCellAsMined(cell);
        });
      });
    }
    // For debug to reveal all cells feature.
    if (DEBUG) {
      document.body.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
          this.view.revealAllCells();
        }
      });
    }
  };
}

const controller = new Controller();
controller.startNewGame();
