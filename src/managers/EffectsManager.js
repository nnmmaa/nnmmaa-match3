import {GAME_CONFIG} from '../config.js';

export default class EffectsManager {
    constructor(scene) {
        this.scene = scene;

        this.bombAudio = this.scene.sound.addAudioSprite('kyobi');
        this.removeAudio = this.scene.sound.addAudioSprite('kyobi');
    }

    playBombExplosionSound() {
        this.bombAudio.play(GAME_CONFIG.AUDIO.EXPLOSION_SOUND, {
            volume: GAME_CONFIG.AUDIO.Bomb_Explosion
        });
    }

    playRemoveSound() {
        this.removeAudio.play(GAME_CONFIG.AUDIO.REMOVE_SOUND, {
            volume: GAME_CONFIG.AUDIO.Remove_Diamonds
        });
    }


    playBombExplosion(bomb) {

        this.playBombExplosionSound();

        const explosionSprite = this.scene.add.sprite(bomb.x, bomb.y, 'explosion');
        explosionSprite.play('explode');
        explosionSprite.on('animationcomplete', () => {
            explosionSprite.destroy();
            bomb.destroy();
        }, this);
    }


    playTileExplosion(tile) {

        this.playRemoveSound();

        const explosionSprite = this.scene.add.sprite(tile.x, tile.y, 'explosion');
        explosionSprite.play('explode');
        explosionSprite.on('animationcomplete', () => {
            explosionSprite.destroy();
            tile.destroy();
        }, this);
    }

    playParticleEffect() {
        const startX = this.scene.gridX + (this.scene.cols * this.scene.tileSize) / 2;
        const startY = this.scene.gridY;
        const targetX = this.scene.scoreText.x + this.scene.scoreText.width / 2;
        const targetY = this.scene.scoreText.y + this.scene.scoreText.height / 2;

        const emitter = this.scene.add
            .particles(0, 0, 'coin', {
                frame: 'Match3_Icon_28',
                x: {start: startX, end: targetX, ease: 'Power1'},
                y: {start: startY, end: targetY},
                lifespan: 400,
                frequency: 200,
                quantity: 1,
                emitting: true,
                stopAfter: 6,
                scale: {start: 0.2, end: 0.1},
            })
            .setDepth(1);

        emitter.once('emittercomplete', () => {
            emitter.destroy();
        });
    }
}