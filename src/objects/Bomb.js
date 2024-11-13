import Phaser from 'phaser';


export default class Bomb extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, row, col) {
        super(scene, x, y, 'bombs');
        this.scene = scene;
        this.gridPosition = { row, col };
        this.setInteractive();
        this.scene.input.setDraggable(this);

        // Добавляем бомбу на сцену
        scene.add.existing(this);
    }

    activate() {
        if (!this.scene.matchManager) {
            console.error('MatchManager не инициализирован в GameScene.');
            return;
        }
        this.emit('bombActivated', this.gridPosition);
        const row = this.gridPosition.row;
        const col = this.gridPosition.col;
        const diamonds = this.scene.matchManager.diamonds;

        // Координаты соседних плиток
        const positions = [
            { row: row - 1, col: col },     // Верх
            { row: row + 1, col: col },     // Низ
            { row: row, col: col - 1 },     // Лево
            { row: row, col: col + 1 },     // Право
            { row: row - 1, col: col - 1 }, // Верх-лево
            { row: row - 1, col: col + 1 }, // Верх-право
            { row: row + 1, col: col - 1 }, // Низ-лево
            { row: row + 1, col: col + 1 }, // Низ-право
        ];

        positions.forEach((pos) => {
            if (
                pos.row >= 0 &&
                pos.row < this.scene.rows &&
                pos.col >= 0 &&
                pos.col < this.scene.cols
            ) {
                const tile = diamonds[pos.row][pos.col];
                if (tile && tile !== this) {
                    diamonds[pos.row][pos.col] = null;
                    tile.destroy();
                }
            }
        });

        // Анимация взрыва
        const explosion = this.scene.add.sprite(this.x, this.y, 'explosion');
        explosion.play('explode');
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });

        // Удаляем саму бомбу
        diamonds[row][col] = null;
        this.destroy();

        // Заполняем пустые места
        this.scene.matchManager.fillEmptySpaces();
    }
}