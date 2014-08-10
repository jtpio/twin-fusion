'use strict';

var AUR = AUR || {};

require.config({
  shim: {
    'socketio': {
      exports: 'io'
    }
  },
  paths: {
    socketio: 'https://cdn.socket.io/socket.io-1.0.6'
  }
});

requirejs([
    './gameServer',
    './playerManager',
    './effects',
    './settings',
    './soundManager',
    './speechMode'
], function (GameServer, PlayerManager, Effects, Settings, SoundManager, SpeechMode) {

    var game = new Phaser.Game(Settings.WIDTH, Settings.HEIGHT, Phaser.AUTO, '', {preload: preload, create: create, update: update, render: render}),
        sound = new SoundManager(game),
        vfx = new Effects(game, sound),
        playerManager = new PlayerManager(game, vfx, sound),
        speech = new SpeechMode(game, playerManager);

    function setupServer () {
        // setup server connection when assets are ready
        var server = new GameServer('server');

        // listeners
        server.addEventListener('playerconnect', function (netPlayer) {
            playerManager.add(netPlayer);
        });

        server.addEventListener('gameID', function (id) {
            playerManager.setGameID(id);
        });
    }

    function preload () {
        game.stage.disableVisibilityChange = true;

        game.load.image('playfield', 'assets/img/playfield.png');
        game.load.image('logo', 'assets/img/logo.png');
        game.load.image('startButton', 'assets/img/guiStartButton.png');
        game.load.image('credits', 'assets/img/credits.png');
        game.load.image('wall', 'assets/img/wall.png');
        game.load.atlas('spritesheet', 'assets/img/spritesheet.png', 'assets/img/spritesheet.json');

        // audio
        game.load.audio('hit02', ['assets/sound/hit02.mp3']);
        game.load.audio('hit03', ['assets/sound/hit03.mp3']);
        game.load.audio('hit04', ['assets/sound/hit04.mp3']);
        game.load.audio('merge01', ['assets/sound/merge01.mp3']);
        game.load.audio('winning', ['assets/sound/winning.mp3']);
        game.load.audio('music', ['assets/sound/music01.mp3']);

    }

    function create () {
        game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.add.image(0, 0, 'playfield');
        playerManager.createGroup();
        vfx.createClouds();
        playerManager.createText();

        sound.loadSounds('hit02', 1, false);
        sound.loadSounds('hit03', 1, false);
        sound.loadSounds('hit04', 1, false);
        sound.loadSounds('merge01', 1, false);
        sound.loadSounds('winning', 1, true);
        sound.loadSounds('music', 0.4, true);

        if (Settings.ENABLE_MUSIC) sound.play('music');

        var logo = game.add.sprite(game.world.centerX, 240, 'logo');
        logo.anchor.set(0.5);
        logo.scale.set(0.8);

        var startButton = game.add.sprite(game.world.centerX, game.world.centerY + 160, 'startButton');
        startButton.anchor.set(0.5);
        startButton.inputEnabled = true;
        startButton.events.onInputUp.add(function () {
            var startTween = game.add.tween(startButton).to({ 'alpha': 0 }, 600, Phaser.Easing.Quadratic.In, true);
            startTween.onComplete.add(function () {
                AUR.state = 'PLAY';
                logo.alpha = 0;
                playerManager.setGameIDAlpha(0.5);
            });
        });

        AUR.credits = game.add.sprite(0, 0, 'credits');
        AUR.credits.alpha = 0;

        // SPEECH!
        if (Settings.ENABLE_SPEECH) speech.defineListeners();

        setupServer();

    }

    function update () {
        playerManager.update();
    }

    function render () {
        // playerManager.debug();
    }

});