"use strict";

define(['./settings'], function (Settings) {

    var game,
        playerManager,
        final_transcript = '',
        two_line = /\n\n/g,
        one_line = /\n/g,
        first_char = /\S/;

    var magic = Settings.MAGIC,
        q;

    function linebreak(s) {
        return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
    }

    function capitalize(s) {
        return s.replace(first_char, function(m) { return m.toUpperCase(); });
    }

    var SpeechMode = function (g, pm) {
        game = g;
        playerManager = pm;
        if (!('webkitSpeechRecognition' in window)) {
          alert('can not start webkitSpeechRecognition');
        } else {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
        }

        q = this.queue = [];
    }

    SpeechMode.prototype.defineListeners = function() {
        var self = this;

        this.recognition.onstart = function() {
            console.log('recognition onstart');
        };

        this.recognition.onerror = function(event) {
            console.error(event.error);
            self.recognition.stop();
            self.recognition.start();
        };

        this.recognition.onend = function() {
            console.log('onend');
            self.recognition.stop();
            self.recognition.start();
        };

        this.recognition.onresult = function(event) {
            var interim_transcript = '';
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    var res = event.results[i][0].transcript;
                    if (res.indexOf(magic) > -1) {
                        self.addWalls();
                    }
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
        };

        this.recognition.lang = 'en-US';
        this.recognition.start();
    };

    SpeechMode.prototype.addWalls = function() {
        var x = game.rnd.integerInRange(Settings.MARGIN, Settings.WIDTH - Settings.MARGIN),
            y = game.rnd.integerInRange(Settings.MARGIN, Settings.HEIGHT - Settings.MARGIN);

        var sprite = game.add.sprite(x, y, 'wall');
        sprite.anchor.set(0.5);
        sprite.scale.set(0);

        var scaleX = game.rnd.realInRange(0.2, 0.6),
            scaleY = game.rnd.realInRange(1, 2);

        if (Math.random() > 0.5) {
            var tmp = scaleX;
            scaleX = scaleY;
            scaleY = tmp;
        }

        var scaleUp = game.add.tween(sprite.scale).to({ 'x': scaleX, 'y': scaleY }, 500, Phaser.Easing.Cubic.In);
        var hide = game.add.tween(sprite).to({ 'alpha': 0 }, 300, Phaser.Easing.Cubic.Out, false, 1000);

        scaleUp.chain(hide);
        scaleUp.start();

        game.physics.enable(sprite, Phaser.Physics.ARCADE);
        sprite.body.immovable = true;

        playerManager.walls.add(sprite);
    };

    return SpeechMode;

});

