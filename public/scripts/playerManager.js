'use strict';

define(['./settings', './map'], function (Settings, Map) {

    var game,
        map,
        vfx,
        sound,
        gameIDText,
        nbText;

    var spawns = [
        [200, 200],
        [Settings.WIDTH - 200, Settings.HEIGHT - 200]
    ];

    function randomPos (spawn) {
        return {
            x: game.rnd.integerInRange(spawn[0] - 100, spawn[0] + 100),
            y: game.rnd.integerInRange(spawn[1] - 100, spawn[1] + 100)
        };
    }

    var PlayerManager = function (g, effects, s) {
        game = g;
        vfx = effects;
        sound = s;
        map = this.map = new Map(game);
        this.queue = [];
        this.players = {};
    };

    PlayerManager.prototype.createText = function() {
        nbText = game.add.text(
            50, 50, '',
            { font: '65px monospace', fill: '#ffffff', align: 'center' }
        );
        nbText.anchor.set(0.5);

        // beat it
        game.add.tween(nbText.scale).to({ 'x': 1.3, 'y': 1.3 }, 200, Phaser.Easing.Cubic.In, true, 0, Number.MAX_VALUE, true);

        gameIDText = game.add.text(
            Settings.WIDTH - 150, 50, '',
            { font: '65px monospace', fill: '#ffffff', align: 'center' }
        );
        gameIDText.anchor.set(0.5);
        gameIDText.alpha = 0; // keep it invisible at init
    };

    PlayerManager.prototype.setGameID = function(id) {
        this.gameID = id;
        gameIDText.setText(this.gameID);
        gameIDText.alpha = 1;
    };

    PlayerManager.prototype.setGameIDAlpha = function(alpha) {
        gameIDText.alpha = alpha;
    };

    PlayerManager.prototype.add = function(netPlayer) {
        var self = this;

        if (Object.keys(this.players).length < Settings.MAX_PLAYERS) {
            this.queue.push(netPlayer);
        } else {
            netPlayer.sendCmd('disconnect', {'message': 'too many players!'});
            return;
        }

        netPlayer.addEventListener('disconnect', function () {
            var index = self.queue.indexOf(netPlayer);
            if (index > -1) {
                self.queue.splice(index, 1);
            }
            var player = self.players[netPlayer.id];
            if (!player) return;

            player.left = true;
            if (self.players[player.pair].left) {
                // remove listeners at the same time as the sprite because they can be used to
                // disconnect a player
                netPlayer.removeAllListeners();
                self.players[player.pair].conn.removeEventListener();
                // remove the 2 sprites
                player.sprite.destroy();
                self.players[player.pair].sprite.destroy();
                delete self.players[netPlayer.id];
                delete self.players[player.pair];
            }
        });

        netPlayer.addEventListener('move', function (data) {
            if (AUR.state !== 'PLAY') return;
            var player = self.players[netPlayer.id];
            if (!player || player.winner) return;

            var sprite = player.sprite;
            if (data.x !== 0) sprite.body.velocity.x = data.x * data.speed * Settings.SPEED;
            if (data.y !== 0) sprite.body.velocity.y = data.y * data.speed * Settings.SPEED;
            sprite.animations.play('run');
        });

        netPlayer.addEventListener('stop', function (data) {
            if (AUR.state !== 'PLAY') return;

            var player = self.players[netPlayer.id];
            if (!player) return;

            var sprite = player.sprite;
            sprite.body.velocity.x = 0;
            sprite.body.velocity.y = 0;
            sprite.animations.play('idle');
        });

        if (this.queue.length < 2) {
            return;
        }

        var p1 = this.queue.shift(),
            p2 = this.queue.shift();

        this.setupPlayer(p1);
        this.setupPlayer(p2);
        this.bindPlayers(p1.id, p2.id);
    };

    PlayerManager.prototype.createGroup = function() {
        this.sprites = game.add.group();
        this.walls = game.add.group();
    };

    PlayerManager.prototype.reset = function() {
        var self = this;
        map.reset();
        var players = Object.keys(this.players);
        players.forEach(function (pId) {
            self.resetPlayer(self.players[pId]);
            self.players[pId].conn.sendCmd('connect');
        });
        players = _.shuffle(players);
        for (var i = 0; i < players.length; i += 2) {
            self.bindPlayers(players[i], players[i + 1]);
            // if these 2 players have left, send a disconnect event to remove them
            if (self.players[players[i]].left && self.players[players[i+1]].left) {
                self.players[players[i]].conn.sendEvent('disconnect');
            }
        }
    };

    PlayerManager.prototype.togglePlayers = function(enable) {
        this.sprites.setAll('alpha', enable ? 1 : 0);
    };

    PlayerManager.prototype.resetPlayer = function (p) {
        if (p.oldSprite) {
            p.sprite = p.oldSprite;
        }
        var sprite = p.sprite;
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.scale.x = 0.75;
        sprite.scale.y = 0.75;
        sprite.body.setSize(46, 116 / 2, 0, 116 / 4);
        sprite.body.collideWorldBounds = true;
        sprite.body.bounce.x = 0.8;
        sprite.body.bounce.y = 0.8;
        sprite.body.minBounceVelocity = 0;
        sprite.body.linearDamping = 1;
        sprite.body.mass = 3000;
        sprite.z = 5;
        sprite.revive();

        // removing old properties
        delete p.merged;
        delete p.winner;
        delete p.pair;
        delete p.oldSprite;
    };

    PlayerManager.prototype.bindPlayers = function (id1, id2) {
        var p1 = this.players[id1];
        var p2 = this.players[id2];
        var tint = game.rnd.integerInRange(Settings.COLOR_RANGE.START, Settings.COLOR_RANGE.END);
        p1.tint = p1.sprite.tint = p2.tint = p2.sprite.tint = tint;
        p1.pair = p2.id;
        p2.pair = p1.id;
        var posP1 = randomPos(spawns[0]);
        var posP2 = randomPos(spawns[1]);
        p1.sprite.x = posP1.x;
        p1.sprite.y = posP1.y;
        p2.sprite.x = posP2.x;
        p2.sprite.y = posP2.y;
    };

    PlayerManager.prototype.setupPlayer = function (p1) {
        if (!this.sprites) return;

        // create the sprite only once
        var sprite = this.sprites.create(0, 0, 'spritesheet', 'player0001-idle.png');

        // animation
        sprite.animations.add('idle', Phaser.Animation.generateFrameNames('player', 1, 4, '-idle.png', 4), 7, true);
        sprite.animations.add('run', Phaser.Animation.generateFrameNames('player', 1, 4, '-run.png', 4), 7, true);
        sprite.animations.play('idle');

        game.physics.enable(sprite, Phaser.Physics.ARCADE);
        sprite.body.collideWorldBounds = true;

        this.players[p1.id] = {
            'id': p1.id,
            'sprite': sprite,
            'conn': p1
        };

        sprite.pid = p1.id;
        this.resetPlayer(this.players[p1.id]);
    };

    PlayerManager.prototype.update = function() {
        var n = Object.keys(this.players).length,
            scale = Math.max(0.5, (20 - n / 2) / 20);

        this.togglePlayers(AUR.state === 'PLAY' || AUR.state === 'END');

        nbText.setText(Object.keys(this.players).length + this.queue.length);

        /*game.physics.arcade.collide(this.sprites, this.sprites, function (first, second) {
            var p = this.players[first.pid];
            if (p && p.pair !== second.pid) sound.play('hit0' + game.rnd.integerInRange(2, 4));
        }, null, this);*/

        game.physics.arcade.collide(this.sprites, this.walls, function (player, wall) {
            if (wall.alpha === 0) {
                var show = game.add.tween(wall).to({ 'alpha': 1 }, 300, Phaser.Easing.Cubic.In);
                var hide = game.add.tween(wall).to({ 'alpha': 0 }, 300, Phaser.Easing.Cubic.Out);
                show.chain(hide);
                show.start();
            }
        }, null, this);


        if (AUR.state !== 'PLAY') return;

        for (var p in this.players) {
            var p1 = this.players[p],
                p2 = this.players[p1.pair];

            for(var pp in this.players){
                var p3 = this.players[pp];
                if(p3 != p2){
                    var b1 = p1.sprite.body, b2 = p3.sprite.body;
                    var delta = new Phaser.Point(p1.sprite.x-p3.sprite.x, p1.sprite.y-p3.sprite.y);
                    var d = delta.getMagnitude();
                    if(d > 0 && d < Settings.MERGE_DIST/2){
                        var mtd = delta.multiply(((Settings.MERGE_DIST/2-d)/(d/2)),((Settings.MERGE_DIST/2-d)/(d/2)));
                        var im1 = 1 / b1.mass;
                        var im2 = 1 / b2.mass;
                        p1.sprite.x += mtd.x;
                        p1.sprite.y += mtd.y;
                        p3.sprite.x -= mtd.x;
                        p3.sprite.y -= mtd.y;
                        var v = new Phaser.Point(b1.velocity.x - b2.velocity.x, b1.velocity.y - b2.velocity.y);
                        var vn = v.dot(mtd.normalize());

                        if(vn > 0)continue;

                        var i = -2*vn / (im1+im2);
                        var impulse = mtd.normalize().multiply(i, i);

                        b1.velocity = b1.velocity.add(impulse.x*im1*b1.bounce.x, impulse.y*im1*b1.bounce.y);
                        b2.velocity = b2.velocity.subtract(impulse.x*im2*b2.bounce.x, impulse.y*im2*b2.bounce.y);
                        sound.play('hit0' + game.rnd.integerInRange(2, 4));
                    }
                }
            }

            if (!p2) continue;

            if (!p1.merged && game.physics.arcade.distanceBetween(p1.sprite, p2.sprite) < Settings.MERGE_DIST) {
                p1.merged = p2.merged = true;

                sound.play('merge01');

                var merge = game.add.tween(p2.sprite);
                merge.to({ 'x': p1.sprite.x, 'y': p1.sprite.y }, 200, Phaser.Easing.Quadratic.In);

                scale = game.add.tween(p2.sprite.scale).to({x: 1.5, y: 1.5}, 100, Phaser.Easing.Quadratic.Out);

                (function (playerToRemove, playerToMergeWith) {
                    scale.onComplete.add(function () {
                        playerToRemove.oldSprite = playerToRemove.sprite;
                        playerToRemove.oldSprite.kill();
                        playerToRemove.sprite = playerToMergeWith.sprite;
                        playerToMergeWith.sprite.scale.x = 1.2;
                        playerToMergeWith.sprite.scale.y = 1.2;
                    });
                }(p2, p1));

                merge.chain(scale);
                merge.start();

                map.generateExit(p1.sprite);
            }

        }

        var winners = map.checkForWinners(this.players);

        if (winners && (winners.p1 || winners.p2)) {
            AUR.state = 'END';
            vfx.winners(winners.p1, winners.p2);
            this.sprites.setAll('body.velocity.x', 0);
            this.sprites.setAll('body.velocity.y', 0);
        }

    };

    PlayerManager.prototype.debug = function() {
        for (var p in this.players) {
            game.debug.body(this.players[p].sprite);
        }

        this.walls.forEach(function (wall) {
            game.debug.body(wall);
        }.bind(this));
    };

    return PlayerManager;

});

