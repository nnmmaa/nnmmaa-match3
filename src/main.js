import { AUTO, Game } from 'phaser';
import GameScene from './scenes/GameScene';

const config = {
    type: AUTO,
    width: 480,
    height: 800,
    backgroundColor: '#FFF',
    parent: 'game-container',
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};

const game = new Game(config);