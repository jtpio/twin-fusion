"use strict";

define(['./settings'], function (Settings) {

    var sounds = {},
        game;

    var SoundManager = function (g) {
        game = g;
    }

    SoundManager.prototype.loadSounds = function(name, volume, loop) {
        sounds[name] = game.add.audio(name, volume, loop);
    };

    SoundManager.prototype.play = function(name) {
        sounds[name].play();
    };

    return SoundManager;

});

