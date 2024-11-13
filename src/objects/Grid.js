// /src/objects/Grid.js

export default class Grid {
    constructor(scene, options) {
        this.scene = scene;
        this.tileSize = options.tileSize || 32;
        this.rows = options.rows || 8;
        this.cols = options.cols || 8;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.lineColor = options.lineColor || 0xffffff;
        this.lineAlpha = options.lineAlpha || 0.2;

        this.createGrid();
    }

    createGrid() {
        const gridWidth = this.cols * this.tileSize;
        const gridHeight = this.rows * this.tileSize;

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(1, this.lineColor, this.lineAlpha);

        for (let i = 0; i <= this.cols; i++) {
            const x = this.x + i * this.tileSize;
            graphics.moveTo(x, this.y);
            graphics.lineTo(x, this.y + gridHeight);
        }

        for (let j = 0; j <= this.rows; j++) {
            const y = this.y + j * this.tileSize;
            graphics.moveTo(this.x, y);
            graphics.lineTo(this.x + gridWidth, y);
        }

        graphics.strokePath();
    }
}