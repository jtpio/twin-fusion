'use strict';

define(['./settings'], function (Settings) {

    var sounds = {},
        game;

    var SoundManager = function (g) {
        game = g;
    };

    SoundManager.prototype.loadSounds = function(name, volume, loop) {
        sounds[name] = game.add.audio(name, volume, loop);
    };

    SoundManager.prototype.play = function(name) {
        sounds[name].play();
    };

    SoundManager.prototype.stop = function(name) {
        sounds[name].stop();
    };
    SoundManager.prototype.isPlaying = function(name){
        return !sounds[name].paused;
    }
    SoundManager.prototype.toggleSound = function(name){
        if(!sounds[name].paused){
            sounds[name].pause();
        }else{
            sounds[name].resume();
        }
    }

    return SoundManager;

});

