import Diamond from '../objects/Diamond.js';

export default class MatchManager {
    constructor(scene, diamonds, removeSound) {
        this.scene = scene;
        this.diamonds = diamonds;
        this.removeSound = removeSound;
        this.matches = [];
    }

    checkMatches() {
        this.matches = [];

        // Проверка по горизонтали
        for (let row = 0; row < this.scene.rows; row++) {
            let matchLength = 1;
            for (let col = 0; col < this.scene.cols; col++) {
                let checkMatch = false;
                let currentTile = this.diamonds[row][col];
                let nextTile = col < this.scene.cols - 1 ? this.diamonds[row][col + 1] : null;

                if (currentTile === null) {
                    matchLength = 1;
                    continue;
                }

                if (col === this.scene.cols - 1 || nextTile === null || nextTile === undefined) {
                    checkMatch = true;
                } else {
                    const currentFrame = currentTile.frame.name;
                    const nextFrame = nextTile.frame.name;
                    if (currentFrame === nextFrame) {
                        matchLength++;
                    } else {
                        checkMatch = true;
                    }
                }

                if (checkMatch) {
                    if (matchLength >= 3) {
                        for (let i = 0; i < matchLength; i++) {
                            const matchedTile = this.diamonds[row][col - i];
                            if (matchedTile && !this.matches.includes(matchedTile)) {
                                this.matches.push(matchedTile);
                            }
                        }
                    }
                    matchLength = 1;
                }
            }
        }

        // Проверка по вертикали
        for (let col = 0; col < this.scene.cols; col++) {
            let matchLength = 1;
            for (let row = 0; row < this.scene.rows; row++) {
                let checkMatch = false;
                let currentTile = this.diamonds[row][col];
                let nextTile = row < this.scene.rows - 1 ? this.diamonds[row + 1][col] : null;

                if (currentTile === null) {
                    matchLength = 1;
                    continue;
                }

                if (row === this.scene.rows - 1 || nextTile === null || nextTile === undefined) {
                    checkMatch = true;
                } else {
                    const currentFrame = currentTile.frame.name;
                    const nextFrame = nextTile.frame.name;
                    if (currentFrame === nextFrame) {
                        matchLength++;
                    } else {
                        checkMatch = true;
                    }
                }

                if (checkMatch) {
                    if (matchLength >= 3) {
                        for (let i = 0; i < matchLength; i++) {
                            const matchedTile = this.diamonds[row - i][col];
                            if (matchedTile && !this.matches.includes(matchedTile)) {
                                this.matches.push(matchedTile);
                            }
                        }
                    }
                    matchLength = 1;
                }
            }
        }

        return this.matches.length > 0;
    }

    handleMatches() {
        const matchesCount = this.matches.length;

        if (matchesCount > 0) {
            // Увеличиваем счёт
            this.scene.score += matchesCount;
            this.scene.scoreText.setText('Счёт: ' + this.scene.score);

            if (this.removeSound) {
                this.removeSound.play('match3', { volume: 0.5 });
            }

            // Удаляем совпавшие кристаллы
            this.matches.forEach((tile) => {
                if (tile) {
                    this.diamonds[tile.gridPosition.row][tile.gridPosition.col] = null;
                    this.scene.tweens.add({
                        targets: tile,
                        alpha: 0,
                        duration: 150,
                        onComplete: () => {
                            tile.destroy();
                        },
                    });
                }
            });

            this.matches = [];

            // Создаем частицы
            this.createParticles();

            // Заполняем пустые места после задержки
            this.scene.time.delayedCall(250, () => {
                this.fillEmptySpaces();
            });
        }
    }

    createParticles() {
        const startX = this.scene.gridX + (this.scene.cols * this.scene.tileSize) / 2;
        const startY = this.scene.gridY;
        const targetX = this.scene.scoreText.x + this.scene.scoreText.width / 2;
        const targetY = this.scene.scoreText.y + this.scene.scoreText.height / 2;

        const emitter = this.scene.add
            .particles(0, 0, 'coin', {
                frame: 'Match3_Icon_28',
                x: { start: startX, end: targetX, ease: 'Power1' },
                y: { start: startY, end: targetY },
                lifespan: 400,
                frequency: 100,
                quantity: 1,
                emitting: true,
                stopAfter: 6,
                scale: { start: 0.2, end: 0.1 },
            })
            .setDepth(1);

        emitter.once('emittercomplete', () => {
            emitter.destroy();
        });
    }

    fillEmptySpaces() {
        for (let col = 0; col < this.scene.cols; col++) {
            let emptySpots = 0;
            for (let row = this.scene.rows - 1; row >= 0; row--) {
                if (this.diamonds[row][col] === null) {
                    emptySpots++;
                } else if (emptySpots > 0) {
                    const tile = this.diamonds[row][col];
                    this.diamonds[row + emptySpots][col] = tile;
                    tile.gridPosition.row += emptySpots;
                    this.diamonds[row][col] = null;

                    this.scene.tweens.add({
                        targets: tile,
                        y: tile.gridPosition.row * this.scene.tileSize + this.scene.gridY + this.scene.tileSize / 2,
                        duration: 200,
                    });
                }
            }

            for (let i = 0; i < emptySpots; i++) {
                const x = col * this.scene.tileSize + this.scene.gridX + this.scene.tileSize / 2;
                const y = -(i + 1) * this.scene.tileSize + this.scene.gridY + this.scene.tileSize / 2;
                const frame = Phaser.Math.Between(0, 4); // Случайный кадр
                const diamond = new Diamond(this.scene, x, y, frame, i, col);

                this.diamonds[i][col] = diamond;

                this.scene.tweens.add({
                    targets: diamond,
                    y: diamond.gridPosition.row * this.scene.tileSize + this.scene.gridY + this.scene.tileSize / 2,
                    duration: 200,
                });
            }
        }

        this.scene.time.delayedCall(200, () => {
            if (this.checkMatches()) {
                this.handleMatches();
            } else {
                this.scene.isProcessing = false;
            }
        });
    }
}