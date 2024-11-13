import Phaser from 'phaser';
import Diamond from '../objects/Diamond.js';
import Grid from '../objects/Grid.js';
import MatchManager from '../managers/MatchManager.js';
import bg from '../assets/images/sky.png';
import matchImg from '../assets/images/match3.png';
import matchJson from '../assets/images/match3.json';
import diamondsImage from '../assets/images/diamonds.png';
import kyobiMP3 from '../assets/audio/kyobi.mp3';
import kyobiOGG from '../assets/audio/kyobi.ogg';
import kyobiM4A from '../assets/audio/kyobi.m4a';
import kyobiJson from '../assets/audio/kyobi.json';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.isProcessing = false; // Флаг для контроля взаимодействия
        this.matchManager = null;
    }

    preload() {
        this.load.image('bg', bg);
        this.load.atlas('coin', matchImg, matchJson);
        this.load.spritesheet('diamonds', diamondsImage, {
            frameWidth: 32,
            frameHeight: 24,
        });
        this.load.audioSprite('kyobi', kyobiJson, [kyobiOGG, kyobiMP3, kyobiM4A]);
    }

    create() {
        this.add.image(0, 0, 'bg').setOrigin(0);

        const backgroundMusic = this.sound.addAudioSprite('kyobi');
        backgroundMusic.play('title', {
            loop: true,
            volume: 0.1,
        });

        const removeSound = this.sound.addAudioSprite('kyobi');

        // Параметры сетки
        this.tileSize = 40;
        this.rows = 8;
        this.cols = 10;
        this.gridX = (this.sys.game.config.width - this.cols * this.tileSize) / 2;
        this.gridY = 150;

        // Создание сетки
        this.grid = new Grid(this, {
            tileSize: this.tileSize,
            rows: this.rows,
            cols: this.cols,
            x: this.gridX,
            y: this.gridY,
            lineColor: 0x00ff00,
            lineAlpha: 0.5,
        });

        // Заполнение сетки кристаллами
        this.createDiamonds(removeSound);

        // Обработчики перетаскивания
        this.input.on('dragstart', this.onDragStart, this);
        this.input.on('drag', this.onDrag, this);
        this.input.on('dragend', this.onDragEnd, this);

        this.matches = [];
        this.score = 0;

        this.scoreText = this.add.text(20, 20, 'Счет: 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        });

        const installButton = this.add
            .text(
                this.sys.game.config.width / 2,
                this.sys.game.config.height - 50,
                'Установить полную версию',
                {
                    fontSize: '20px',
                    color: '#ffffff',
                    backgroundColor: '#ff0000',
                    padding: { x: 10, y: 5 },
                    align: 'center',
                }
            )
            .setOrigin(0.5);

        installButton.setInteractive();
        installButton.on('pointerdown', () => {
            this.installFullVersion();
        });
    }

    installFullVersion() {
        const url = 'https://link-to-full-game.com'; // Замените на реальный URL
        if (window.mraid) {
            mraid.open(url);
        } else {
            window.open(url, '_blank');
        }
    }

    createDiamonds(removeSound) {
        this.diamonds = [];
        for (let row = 0; row < this.rows; row++) {
            this.diamonds[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const x = this.gridX + col * this.tileSize + this.tileSize / 2;
                const y = this.gridY + row * this.tileSize + this.tileSize / 2;

                const possibleFrames = [0, 1, 2, 3, 4];
                if (col >= 2) {
                    const frame1 = this.diamonds[row][col - 1].frame.name;
                    const frame2 = this.diamonds[row][col - 2].frame.name;
                    if (frame1 === frame2) {
                        const index = possibleFrames.indexOf(frame1);
                        if (index !== -1) {
                            possibleFrames.splice(index, 1);
                        }
                    }
                }

                if (row >= 2) {
                    const frame1 = this.diamonds[row - 1][col].frame.name;
                    const frame2 = this.diamonds[row - 2][col].frame.name;
                    if (frame1 === frame2) {
                        const index = possibleFrames.indexOf(frame1);
                        if (index !== -1) {
                            possibleFrames.splice(index, 1);
                        }
                    }
                }

                const frame = Phaser.Utils.Array.GetRandom(possibleFrames);
                const diamond = new Diamond(this, x, y, frame, row, col);

                this.diamonds[row][col] = diamond;
            }
        }

        this.matchManager = new MatchManager(this, this.diamonds, removeSound);
        if (this.matchManager.checkMatches()) {
            this.matchManager.handleMatches();
        }
    }

    onDragStart(pointer, gameObject) {
        if (this.isProcessing) return;
        gameObject.startX = gameObject.x;
        gameObject.startY = gameObject.y;
    }

    onDrag(pointer, gameObject, dragX, dragY) {
        if (this.isProcessing) return;

        const startX = gameObject.startX;
        const startY = gameObject.startY;
        const deltaX = dragX - startX;
        const deltaY = dragY - startY;
        const maxDelta = this.tileSize;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                gameObject.x = Math.min(startX + maxDelta, dragX);
            } else {
                gameObject.x = Math.max(startX - maxDelta, dragX);
            }
            gameObject.y = startY;
        } else {
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

        const deltaX = gameObject.x - gameObject.startX;
        const deltaY = gameObject.y - gameObject.startY;
        let direction = null;

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
                case 'up': toRow -= 1; break;
                case 'down': toRow += 1; break;
                case 'left': toCol -= 1; break;
                case 'right': toCol += 1; break;
            }

            if (toRow >= 0 && toRow < this.rows && toCol >= 0 && toCol < this.cols) {
                const targetTile = this.diamonds[toRow][toCol];
                this.swapTiles(gameObject, targetTile, true);
            } else {
                this.resetTilePosition(gameObject);
            }
        } else {
            this.resetTilePosition(gameObject);
        }
    }

    swapTiles(tile1, tile2, isPlayerAction) {
        this.isProcessing = true;

        const tempRow = tile1.gridPosition.row;
        const tempCol = tile1.gridPosition.col;

        this.diamonds[tile1.gridPosition.row][tile1.gridPosition.col] = tile2;
        this.diamonds[tile2.gridPosition.row][tile2.gridPosition.col] = tile1;

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
                    if (!this.matchManager.checkMatches()) {
                        // Обратный обмен, если нет совпадений
                        this.swapTiles(tile1, tile2, false);
                    } else {
                        // Обрабатываем совпадения
                        this.matchManager.handleMatches();
                    }
                } else {
                    this.isProcessing = false;
                }
            },
        });
    }

    resetTilePosition(tile) {
        this.tweens.add({
            targets: tile,
            x: tile.gridPosition.col * this.tileSize + this.gridX + this.tileSize / 2,
            y: tile.gridPosition.row * this.tileSize + this.gridY + this.tileSize / 2,
            duration: 200,
        });
    }
}