"use strict";

define(['./settings'], function (Settings) {

    var game,
        sound,
        winnerText,
        emitter,
        clouds = [];

    var Effects = function (g, s) {
        game = g;
        sound = s;
    }

    Effects.prototype.createClouds = function() {
        for (var i = 1; i <= 3; i++) {
            (function (n) {
                var sprite = game.add.sprite(game.rnd.integerInRange(0, game.world.width), game.rnd.integerInRange(0, game.world.height), 'spritesheet', 'cloud000' + n + '-idle.png')
                var destX = -sprite.width;
                var destY = sprite.y;
                var tween = game.add.tween(sprite).to({ 'x': destX, 'y': destY}, game.rnd.integerInRange(20000, 30000), Phaser.Easing.Linear.None, true).loop();
                tween.onComplete.add(function () {
                    sprite.x = game.world.width + sprite.width;
                });
                clouds.push(sprite);
            }(i));
        }
    };

    Effects.prototype.winners = function(p1, p2) {
        AUR.credits.bringToTop();

        winnerText = game.add.text(game.world.centerX / 2, 140, "WINNERS!");
        winnerText.anchor.set(0.5);
        winnerText.align = 'center';

        winnerText.font = 'Arial';
        winnerText.fontWeight = 'bold';
        winnerText.fontSize = 70;
        winnerText.fill = '#ffffff';

        game.add.tween(winnerText.scale).to({ 'x': 1.3, 'y': 1.3 }, 300, Phaser.Easing.Cubic.In, true, 0, Number.MAX_VALUE, true);

        // move winner to the middle, disable control by removing listeners
        if (!p1 && !p2) return;
        var winnerSprite = p1.sprite || p2.sprite;
        if (!winnerSprite) return;

        winnerSprite.animations.play('idle');
        winnerSprite.body.velocity.x = 0;
        winnerSprite.body.velocity.y = 0;
        winnerSprite.z = -10000;

        game.add.tween(winnerSprite).to({ 'x': game.world.centerX / 2, 'y': game.world.centerY }, 2000, Phaser.Easing.Cubic.Out, true);
        game.add.tween(winnerSprite.scale).to({ 'x': 3, 'y': 3 }, 1000, Phaser.Easing.Cubic.In, true, 1000);

        game.add.tween(AUR.credits).to({ 'alpha': 1 }, 2000, Phaser.Easing.Quadratic.In, true);

        winnerSprite.bringToTop();

        var winnerGroup = game.add.group();
        winnerGroup.add(winnerSprite);

        sound.play('winning');
    };

    Effects.prototype.update = function() {
    };

    return Effects;

});

