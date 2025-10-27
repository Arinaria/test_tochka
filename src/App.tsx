import React, { useState, useCallback } from 'react';
import './styles.css';

type Player = 1 | 2;
type CellValue = 0 | Player;

interface Position {
  row: number;
  col: number;
}

interface GameState {
  board: CellValue[][];
  currentPlayer: Player;
  gameOver: boolean;
  winner: Player | null;
  winningCells: Position[];
  animationInProgress: boolean;
}

const ROWS = 6;
const COLS = 7;
const WINNING_LENGTH = 4;

const createEmptyBoard = (): CellValue[][] => 
  Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

const initialState: GameState = {
  board: createEmptyBoard(),
  currentPlayer: 1,
  gameOver: false,
  winner: null,
  winningCells: [],
  animationInProgress: false
};

const isValidCell = (row: number, col: number): boolean => 
  row >= 0 && row < ROWS && col >= 0 && col < COLS;

const checkWin = (board: CellValue[][], row: number, col: number): { win: boolean; cells: Position[] } => {
  const player = board[row][col];
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1]
  ];

  for (const [dx, dy] of directions) {
    let cells: Position[] = [{ row, col }];

    for (let i = 1; i < WINNING_LENGTH; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (isValidCell(newRow, newCol) && board[newRow][newCol] === player) {
        cells.push({ row: newRow, col: newCol });
      } else break;
    }

    for (let i = 1; i < WINNING_LENGTH; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (isValidCell(newRow, newCol) && board[newRow][newCol] === player) {
        cells.push({ row: newRow, col: newCol });
      } else break;
    }

    if (cells.length >= WINNING_LENGTH) {
      return { win: true, cells: cells.slice(0, WINNING_LENGTH) };
    }
  }

  return { win: false, cells: [] };
};

const checkDraw = (board: CellValue[][]): boolean => 
  board[0].every(cell => cell !== 0);

const makeMove = (board: CellValue[][], col: number): number => {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === 0) return row;
  }
  return -1;
};

const isColumnFull = (board: CellValue[][], col: number): boolean => 
  board[0][col] !== 0;

const Cell: React.FC<{ 
  value: number; 
  position: Position; 
  isWinner: boolean; 
}> = ({ value, position, isWinner }) => {
  const getCellClass = () => {
    let className = 'cell';
    if (value === 0) className += ' empty';
    if (value === 1) className += ' player1';
    if (value === 2) className += ' player2';
    if (isWinner) className += ' winner';
    return className;
  };

  return (
    <div 
      className={getCellClass()}
      data-row={position.row}
      data-col={position.col}
    />
  );
};

const GameBoard: React.FC<{ 
  gameState: GameState; 
  onColumnClick: (col: number) => void; 
}> = ({ gameState, onColumnClick }) => {
  const isWinningCell = (row: number, col: number): boolean =>
    gameState.winningCells.some(cell => cell.row === row && cell.col === col);

  const renderColumns = () => {
    const columns = [];
    for (let col = 0; col < COLS; col++) {
      columns.push(
        <div
          key={`col-${col}`}
          className="column"
          style={{ left: col * 70 }}
          onClick={() => onColumnClick(col)}
          onMouseEnter={(e) => {
            if (!gameState.gameOver && !gameState.animationInProgress) {
              const target = e.currentTarget;
              target.classList.add(
                gameState.currentPlayer === 1 ? 'player1-hover' : 'player2-hover'
              );
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.classList.remove('player1-hover', 'player2-hover');
          }}
        />
      );
    }
    return columns;
  };

  return (
    <div className="game-board">
      <div className="board-container">
        <div id="gameBoard">
          {gameState.board.map((row, rowIndex) => (
            <div key={rowIndex} className="board-row">
              {row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  value={cell}
                  position={{ row: rowIndex, col: colIndex }}
                  isWinner={isWinningCell(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>
        <div id="columnsContainer">
          {renderColumns()}
        </div>
      </div>
    </div>
  );
};

const GameInfo: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const getPlayerName = (player: number): string => 
    player === 1 ? 'Игрок 1 (Красные)' : 'Игрок 2 (Желтые)';

  return (
    <>
      <div className="game-info">
        Сейчас ходит:
        <span className={`player-indicator player${gameState.currentPlayer}-indicator`}></span>
        <span id="currentPlayer">
          {gameState.gameOver ? 'Игра завершена' : getPlayerName(gameState.currentPlayer)}
        </span>
      </div>

      <div className="message" id="gameMessage">
        {gameState.gameOver && (
          gameState.winner ? 
            `Победил ${getPlayerName(gameState.winner)}!` : 
            'Ничья!'
        )}
      </div>
    </>
  );
};

const Controls: React.FC<{ 
  onRestart: () => void; 
  onClose: () => void; 
}> = ({ onRestart, onClose }) => {
  return (
    <div className="controls">
      <button className="restart-btn" onClick={onRestart}>
        Новая игра
      </button>
      <button className="close-btn" onClick={onClose}>
        Выйти
      </button>
    </div>
  );
};

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>(initialState);

  const resetGame = useCallback(() => {
    setGameState(initialState);
  }, []);

  const handleMove = useCallback((col: number) => {
    if (gameState.gameOver || gameState.animationInProgress || isColumnFull(gameState.board, col)) {
      return;
    }

    setGameState(prev => ({ ...prev, animationInProgress: true }));

    const targetRow = makeMove(gameState.board, col);
    if (targetRow === -1) return;

    setTimeout(() => {
      const newBoard = gameState.board.map(row => [...row]);
      newBoard[targetRow][col] = gameState.currentPlayer;

      const winResult = checkWin(newBoard, targetRow, col);
      
      if (winResult.win) {
        setGameState({
          board: newBoard,
          currentPlayer: gameState.currentPlayer,
          gameOver: true,
          winner: gameState.currentPlayer,
          winningCells: winResult.cells,
          animationInProgress: false
        });
      } else if (checkDraw(newBoard)) {
        setGameState({
          board: newBoard,
          currentPlayer: gameState.currentPlayer,
          gameOver: true,
          winner: null,
          winningCells: [],
          animationInProgress: false
        });
      } else {
        setGameState({
          board: newBoard,
          currentPlayer: gameState.currentPlayer === 1 ? 2 : 1,
          gameOver: false,
          winner: null,
          winningCells: [],
          animationInProgress: false
        });
      }
    }, 500);
  }, [gameState]);

  const startGame = () => {
    setGameStarted(true);
    resetGame();
  };

  const closeGame = () => {
    setGameStarted(false);
  };

  if (!gameStarted) {
    return (
      <div className="App">
        <header>
          <h1>Игра 4 в ряд</h1>
        </header>
        <main>
          <img src="/logo.jpg" alt="Логотип игры" className="logo" />
          <button className="play-btn" onClick={startGame}>
            НАЧАТЬ ИГРАТЬ
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="game-window">
      <div className="game-content">
        <h2>Игра 4 в ряд</h2>
        <GameInfo gameState={gameState} />
        <GameBoard gameState={gameState} onColumnClick={handleMove} />
        <Controls onRestart={resetGame} onClose={closeGame} />
      </div>
    </div>
  );
}

export default App;
