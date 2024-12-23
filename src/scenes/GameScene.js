import Grid from "../objects/Grid.js";
import Diamond from "../objects/Diamond.js";
import Bomb from "../objects/Bomb.js";
import MatchManager from "../managers/MatchManager.js";
import EffectsManager from "../managers/EffectsManager.js";
import BoardManager from "../managers/BoardManager.js";
import { GAME_CONFIG } from "../config.js";

import bg from '../assets/images/sky.png';
import diamonds from '../assets/images/diamonds.png';
import blocks from '../assets/images/blocks.png';
import blocksJson from '../assets/images/blocks.json';
import matchImg from '../assets/images/match3.png';
import matchJson from '../assets/images/match3.json';
import explosionImage from '../assets/images/explosion.png';
import nineSlice from '../assets/images/nine-slice.png';
import nineSliceJson from '../assets/images/nine-slice.json';

import kyobiOGG from '../assets/audio/kyobi.ogg';
import kyobiM4A from '../assets/audio/kyobi.m4a';
import kyobiJson from '../assets/audio/kyobi.json';


/**
 * GameScene отвечает за основную логику игровой сцены:
 * - Инициализация MRAID (если доступен)
 * - Запуск игры (startGame)
 * - Создание и обновление сетки (createTiles)
 * - Обработка завершения уровня (levelCompleted)
 * - Управление вводом (перетаскивание кристаллов)
 */
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.matchManager = null;
        this.isProcessing = false;
        this.score = 0;
        this.gridArray = [];
        this.targetScore = 300;

        this.Diamond = Diamond;
    }

    preload() {
        this.load.image('bg', bg);
        this.load.atlas('coin', matchImg, matchJson);
        this.load.atlas('buttons', nineSlice, nineSliceJson);
        this.load.spritesheet('diamonds', diamonds, {
            frameWidth: 32,
            frameHeight: 24,
        });
        this.load.atlas('blocks', blocks, blocksJson);
        this.load.spritesheet('explosion', explosionImage, {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.audioSprite('kyobi', kyobiJson, [kyobiOGG, kyobiM4A]);
    }

    create() {
        // Проверка и инициализация MRAID если доступен
        if (typeof mraid !== 'undefined') {
            if (mraid.getState() === 'loading') {
                mraid.addEventListener('ready', () => {
                    this.startGame();
                });
            } else {
                this.startGame();
            }
        } else {
            // Если MRAID нет, просто запускаем игру
            this.startGame();
        }
    }

    /**
     * startGame - Основная инициализация игрового процесса:
     * - Создание фона
     * - Запуск фоновой музыки
     * - Настройка сетки и создание тайлов
     * - Настройка обработчиков ввода
     */
    startGame() {
        this.add.image(0, 0, 'bg').setOrigin(0, 0);

        // Фоновая музыка
        this.backgroundMusic = this.sound.addAudioSprite('kyobi');
        this.backgroundMusic.play(GAME_CONFIG.AUDIO.BACKGROUND_TRACK, {
            loop: true,
            volume: GAME_CONFIG.AUDIO.MUSIC_VOLUME,
        });

        // Настройки поля
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.rows = GAME_CONFIG.ROWS;
        this.cols = GAME_CONFIG.COLS;
        this.gridX = (this.sys.game.config.width - this.cols * this.tileSize) / 2;
        this.gridY = GAME_CONFIG.START_Y;

        // Создаем сетку
        this.grid = new Grid(this, {
            tileSize: this.tileSize,
            rows: this.rows,
            cols: this.cols,
            x: this.gridX,
            y: this.gridY,
            lineColor: GAME_CONFIG.GRID_LINE_COLOR,
            lineAlpha: GAME_CONFIG.GRID_LINE_ALPHA,
        });

        // Отображение очков
        this.scoreText = this.add.text(10, 10, 'Счёт: 0', {fontSize: '20px', fill: '#fff'});

        // Анимация взрыва
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 22 }),
            frameRate: 60,
            repeat: 0,
        });

        // Инициализация менеджера эффектов
        this.effectsManager = new EffectsManager(this);
        this.boardManager = new BoardManager(this);

        // Создаем начальные тайлы
        this.createTiles();

        // Обработчики перетаскивания
        this.input.on('dragstart', this.onDragStart, this);
        this.input.on('drag', this.onDrag, this);
        this.input.on('dragend', this.onDragEnd, this);
    }

    /**
     * createTiles - Создает изначальный набор тайлов на игровом поле.
     */
    createTiles() {
        this.gridArray = [];

        for (let row = 0; row < this.rows; row++) {
            this.gridArray[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const x = this.gridX + col * this.tileSize + this.tileSize / 2;
                const y = this.gridY + row * this.tileSize + this.tileSize / 2;

                const frame = this.getRandomFrame(row, col);
                const diamond = new Diamond(this, x, y, frame, row, col);
                this.gridArray[row][col] = diamond;
            }
        }

        // Инициализация MatchManager для обработки совпадений
        this.matchManager = new MatchManager(this, this.gridArray);
        if (this.matchManager.checkMatches()) {
            this.matchManager.handleMatches();
        }
    }

    /**
     * checkAndRemoveFrame - Вспомогательный метод для удаления неподходящего кадра из списка
     * учитывая уже расположенные тайлы, чтобы не образовывать совпадение сразу.
     */
    checkAndRemoveFrame(row1, col1, row2, col2, possibleFrames) {
        const tile1 = this.gridArray[row1][col1];
        const tile2 = this.gridArray[row2][col2];

        if (
            tile1 && tile2 &&
            tile1.canMatch && tile2.canMatch &&
            tile1.frame.name === tile2.frame.name
        ) {
            const frameToAvoid = tile1.frame.name;
            const index = possibleFrames.indexOf(parseInt(frameToAvoid));
            if (index !== -1) {
                possibleFrames.splice(index, 1);
            }
        }
    }

    /**
     * getRandomFrame - Получает случайный кадр (тип кристалла) для тайла, избегая немедленных совпадений.
     */
    getRandomFrame(row, col) {
        const possibleFrames = [0, 1, 2, 3, 4];

        if (col >= 2) {
            this.checkAndRemoveFrame(row, col - 1, row, col - 2, possibleFrames);
        }

        if (row >= 2) {
            this.checkAndRemoveFrame(row - 1, col, row - 2, col, possibleFrames);
        }

        return Phaser.Utils.Array.GetRandom(possibleFrames);
    }

    /**
     * levelCompleted - Метод вызывается при достижении целевого счета.
     * Очищает поле, затем спавнит новые кристаллы, затем затемняет экран и показывает CTA.
     */
    levelCompleted() {
        this.gridArray.forEach(row => {
            row.forEach(tile => {
                if (tile) {
                    tile.disableInteractive();
                }
            });
        });

        this.boardManager.removeAllCrystals(() => {
            this.boardManager.spawnNewCrystals(() => {
                this.createOverlay();
                this.showCTA();
            });
        });
    }


    /**
     * createOverlay - Создает полупрозрачный оверлей поверх игры.
     */
    createOverlay() {
        const overlay = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x000000,
            0.5
        ).setDepth(10);

        this.overlay = overlay;
    }

    /**
     * showCTA - Показывает CTA для установки полной версии игры
     * с кликом по которому открывается ссылка (через mraid.open или window.open).
     */
    showCTA() {
        const buttonX = this.sys.game.config.width / 2;
        const buttonY = this.sys.game.config.height / 2.5;

        // Создаём фоновый Nine-Slice для кнопки
        const buttonBg = this.add.nineslice(
            buttonX, buttonY,
            'buttons', 'YellowButtonSml',
            252, 60,
            16, 16
        ).setOrigin(0.5).setDepth(11);

        // Добавляем текст поверх кнопки
        const buttonText = this.add.text(buttonX, buttonY, 'Установить', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);

        // Делаем кнопку интерактивной
        buttonBg.setInteractive();

        // Обработчик нажатия
        buttonBg.on('pointerdown', () => {
            if (typeof mraid !== 'undefined') {
                mraid.open('https://example.com/install');
            } else {
                window.open('https://example.com/install', '_blank');
            }
        });

        // Настраиваем визуальный отклик на нажатие
        buttonBg.on('pointerover', () => {
            buttonBg.setTint(0xcccccc); // Меняем цвет при наведении
        });

        buttonBg.on('pointerout', () => {
            buttonBg.clearTint(); // Возвращаем оригинальный цвет
        });
    }

    /**
     * Методы onDragStart, onDrag, onDragEnd, swapTiles, resetTilePosition
     * отвечают за механику перетаскивания кристаллов и их перемещения.
     */
    onDragStart(pointer, gameObject) {
        if (this.isProcessing) return;
        if (!gameObject.isMovable || !gameObject.input.enabled) return;

        gameObject.startX = gameObject.x;
        gameObject.startY = gameObject.y;

        if (gameObject instanceof Diamond) {
            gameObject.setScale(1.3);
        }
    }

    onDrag(pointer, gameObject, dragX, dragY) {
        if (this.isProcessing) return;
        if (!gameObject.isMovable) return;

        const startX = gameObject.startX;
        const startY = gameObject.startY;
        const deltaX = dragX - startX;
        const deltaY = dragY - startY;
        const maxDelta = this.tileSize;

        // Ограничиваем перетаскивание только на одну клетку
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Горизонтально
            if (deltaX > 0) {
                gameObject.x = Math.min(startX + maxDelta, dragX);
            } else {
                gameObject.x = Math.max(startX - maxDelta, dragX);
            }
            gameObject.y = startY;
        } else {
            // Вертикально
            if (deltaY > 0) {
                gameObject.y = Math.min(startY + maxDelta, dragY);
            } else {
                gameObject.y = Math.max(startY - maxDelta, dragY);
            }
            gameObject.x = startX;
        }
    }

    onDragEnd(pointer, gameObject) {
        if (this.isProcessing) return;

        if (gameObject instanceof Diamond) {
            gameObject.setScale(1);
        }

        const deltaX = gameObject.x - gameObject.startX;
        const deltaY = gameObject.y - gameObject.startY;
        let direction = null;

        // Определяем направление сдвига
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > this.tileSize / 2) {
                direction = 'right';
            } else if (deltaX < -this.tileSize / 2) {
                direction = 'left';
            }
        } else {
            if (deltaY > this.tileSize / 2) {
                direction = 'down';
            } else if (deltaY < -this.tileSize / 2) {
                direction = 'up';
            }
        }

        if (direction) {
            const fromRow = gameObject.gridPosition.row;
            const fromCol = gameObject.gridPosition.col;
            let toRow = fromRow;
            let toCol = fromCol;

            switch (direction) {
                case 'up':
                    toRow -= 1;
                    break;
                case 'down':
                    toRow += 1;
                    break;
                case 'left':
                    toCol -= 1;
                    break;
                case 'right':
                    toCol += 1;
                    break;
            }

            if (toRow >= 0 && toRow < this.rows && toCol >= 0 && toCol < this.cols) {
                const targetTile = this.gridArray[toRow][toCol];
                if (targetTile && targetTile.isMovable) {
                    this.swapTiles(gameObject, targetTile, true);
                } else {
                    this.resetTilePosition(gameObject);
                }
            } else {
                this.resetTilePosition(gameObject);
            }
        } else {
            this.resetTilePosition(gameObject);
        }
    }

    /**
     * swapTiles - Меняет местами два тайла и проверяет совпадения, если ход был игроком.
     * @param {Object} tile1
     * @param {Object} tile2
     * @param {boolean} isPlayerAction - true, если игрок сам инициировал перемещение
     */
    swapTiles(tile1, tile2, isPlayerAction) {
        this.isProcessing = true;

        if (!tile1.isMovable || !tile2.isMovable) {
            this.resetTilePosition(tile1);
            this.isProcessing = false;
            return;
        }

        const tempRow = tile1.gridPosition.row;
        const tempCol = tile1.gridPosition.col;

        this.gridArray[tile1.gridPosition.row][tile1.gridPosition.col] = tile2;
        this.gridArray[tile2.gridPosition.row][tile2.gridPosition.col] = tile1;

        tile1.gridPosition.row = tile2.gridPosition.row;
        tile1.gridPosition.col = tile2.gridPosition.col;
        tile2.gridPosition.row = tempRow;
        tile2.gridPosition.col = tempCol;

        const tileSize = this.tileSize;
        const gridX = this.gridX;
        const gridY = this.gridY;

        this.tweens.add({
            targets: [tile1, tile2],
            x: (target) => target.gridPosition.col * tileSize + gridX + tileSize / 2,
            y: (target) => target.gridPosition.row * tileSize + gridY + tileSize / 2,
            duration: 200,
            onComplete: () => {
                if (isPlayerAction) {
                    if (tile1 instanceof Bomb) {
                        tile1.explode();
                        this.isProcessing = false;
                    } else if (this.matchManager.checkMatches()) {
                        this.matchManager.handleMatches();
                    } else {
                        this.swapTiles(tile1, tile2, false);
                    }
                } else {
                    this.isProcessing = false;
                }
            },
        });
    }

    /**
     * resetTilePosition - Возвращает тайл на исходную позицию, если ход не был успешным.
     * @param {Object} tile
     */
    resetTilePosition(tile) {
        this.tweens.add({
            targets: tile,
            x: tile.gridPosition.col * this.tileSize + this.gridX + this.tileSize / 2,
            y: tile.gridPosition.row * this.tileSize + this.gridY + this.tileSize / 2,
            duration: 200,
        });
    }
}