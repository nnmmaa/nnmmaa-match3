import Tile from './Tile.js';

export default class Bomb extends Tile {
    constructor(scene, x, y, row, col) {
        super(scene, x, y, 'blocks', 'bomb', row, col);
        this.isMovable = true;
        this.canMatch = false;
        this.isDestructible = false; // Бомба не уничтожается другими бомбами

        this.setInteractive({ draggable: true });

        // Устанавливаем размер бомбы
        this.setDisplaySize(32, 24);

        // Добавляем обработчик клика
        this.on('pointerdown', this.onPointerDown, this);

        // Флаг взрыва
        this.isExploded = false;
    }

    onPointerDown() {
        this.explode();
    }

    explode() {
        // Проверяем, чтобы бомба взорвалась только один раз
        if (this.isExploded) return;
        this.isExploded = true;

        // Запуск анимации взрыва
        this.scene.effectsManager.playBombExplosion(this);

        // Удаляем бомбу из сетки
        this.scene.gridArray[this.gridPosition.row][this.gridPosition.col] = null;

        // Уничтожаем соседние плитки
        this.scene.matchManager.destroyAdjacentTiles(this.gridPosition.row, this.gridPosition.col);

        // Обработчик завершения анимации взрыва
        this.on('animationcomplete', () => {
            this.destroy();
        }, this);
    }
}