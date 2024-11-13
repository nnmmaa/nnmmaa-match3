// /src/objects/Diamond.js

import Phaser from 'phaser';

export default class Diamond extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, frame, row, col) {
        super(scene, x, y, 'diamonds', frame);
        this.scene = scene;
        this.gridPosition = { row, col };
        this.setInteractive({ draggable: true });
        scene.add.existing(this);
    }

}