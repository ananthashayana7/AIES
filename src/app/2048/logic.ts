import { v4 as uuidv4 } from 'uuid';

export type Tile = {
  id: string;
  value: number;
  x: number;
  y: number;
  mergedFrom?: Tile[];
};

export type GameState = {
  tiles: Tile[];
  score: number;
  over: boolean;
  won: boolean;
};

const GRID_SIZE = 4;

export const createTile = (x: number, y: number, value: number = 2): Tile => ({
  id: uuidv4(),
  value,
  x,
  y,
});

export const getEmptyPositions = (tiles: Tile[]) => {
  const positions: [number, number][] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!tiles.find((t) => t.x === x && t.y === y)) {
        positions.push([x, y]);
      }
    }
  }
  return positions;
};

export const spawnTile = (tiles: Tile[]): Tile[] => {
  const emptyPositions = getEmptyPositions(tiles);
  if (emptyPositions.length === 0) return tiles;

  const [x, y] = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  return [...tiles, createTile(x, y, value)];
};

export const initializeGame = (): GameState => {
  let tiles: Tile[] = [];
  tiles = spawnTile(tiles);
  tiles = spawnTile(tiles);
  return {
    tiles,
    score: 0,
    over: false,
    won: false,
  };
};

type MoveDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const move = (state: GameState, direction: MoveDirection): GameState => {
  if (state.over) return state;

  const { tiles } = state;
  let newTiles: Tile[] = [];
  let scoreGain = 0;
  let hasChanged = false;

  const isVertical = direction === 'UP' || direction === 'DOWN';
  const isReverse = direction === 'RIGHT' || direction === 'DOWN';

  // Helper to get tiles in a specific row or column
  const getLine = (index: number) => {
    return tiles.filter((t) => (isVertical ? t.x === index : t.y === index));
  };

  for (let i = 0; i < GRID_SIZE; i++) {
    const line = getLine(i);
    // Sort line by position in move direction
    line.sort((a, b) => (isVertical ? a.y - b.y : a.x - b.x));
    if (isReverse) line.reverse();

    const newLine: Tile[] = [];
    for (let j = 0; j < line.length; j++) {
      const current = { ...line[j], mergedFrom: undefined };
      if (newLine.length > 0) {
        const last = newLine[newLine.length - 1];
        if (!last.mergedFrom && last.value === current.value) {
          // Merge
          last.value *= 2;
          last.mergedFrom = [ { ...last }, { ...current } ];
          scoreGain += last.value;
          hasChanged = true;
          continue;
        }
      }
      newLine.push(current);
    }

    // Update positions
    newLine.forEach((tile, j) => {
      const newPos = isReverse ? GRID_SIZE - 1 - j : j;
      const oldX = tile.x;
      const oldY = tile.y;
      if (isVertical) {
        tile.y = newPos;
      } else {
        tile.x = newPos;
      }
      if (tile.x !== oldX || tile.y !== oldY) {
        hasChanged = true;
      }
    });

    newTiles = [...newTiles, ...newLine];
  }

  if (!hasChanged) return state;

  const stateWithSpawn = spawnTile(newTiles);
  const isOver = checkGameOver(stateWithSpawn);
  const isWon = stateWithSpawn.some(t => t.value === 2048);

  return {
    ...state,
    tiles: stateWithSpawn,
    score: state.score + scoreGain,
    over: isOver,
    won: isWon && !state.won, // only trigger won once
  };
};

const checkGameOver = (tiles: Tile[]): boolean => {
  if (getEmptyPositions(tiles).length > 0) return false;

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const current = tiles.find((t) => t.x === x && t.y === y);
      if (!current) continue;

      // Check right
      const right = tiles.find((t) => t.x === x + 1 && t.y === y);
      if (right && right.value === current.value) return false;

      // Check down
      const down = tiles.find((t) => t.x === x && t.y === y + 1);
      if (down && down.value === current.value) return false;
    }
  }

  return true;
};
