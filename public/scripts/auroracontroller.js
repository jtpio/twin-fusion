'use strict';

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

var main = function(GameClient) {
    var gameClient;

    var Game = (function () {
      function Game (gameControls, sound) {
        this.sound = sound;
        this.gameControls = gameControls;
        this.gameControls.sound = sound;
        this.speechRecognition = null;
      }

      Game.prototype.initialize = function () {
          this.gameControls.attachGameControls();
      };

      Game.prototype.addListener = function (listener, callback) {
          gameClient.addEventListener(listener, callback);
      };

      Game.prototype.end = function (data) {
          var winnerBackgroundColor = data.color.toString(16);
          $('body').css('backgroundColor', '#' + winnerBackgroundColor);
          $('body').css('background-image', 'none');
          $('#outerGamePad').hide();
          var victoryPannel = document.getElementById('victoryPannel');
          victoryPannel.style.display = 'flex';
          new Sound().startSound('assets/winning.mp3', true);
      };

      Game.prototype.start = function () {
        this.initialize();

        gameClient = new GameClient('player');

        $('#outerGamePad').hide();

        this.addListener ('connect', function () {
          $('#loadingPannel').fadeOut();
          $('#gameIDInput').fadeOut();
          $('#gamePadWheel').fadeIn();
          $('#outerGamePad').show();
          console.log ('player connected');
        });

        this.addListener('winner', this.end);

        this.addListener('disconnect', function () {
            alert ("You cannot connect. Please try next game :)");
        });
      }
      return Game;
    })();

    var GameControls = (function () {
        function GameControls() {
          var currentAction = null;
        }

        GameControls.prototype.attachUpEvent = function () {
          var _self = this;
            $("#up").on( "touchstart vmousedown", function () {
                $("#upPressed").show();
                gameClient.sendCmd('move', { x: 0, y: -1, speed: 5 });
                _self.sound.startSound("assets/button.mp3");

                _self.currentAction = "up";
            });
        };

        GameControls.prototype.attachDownEvent = function () {
            var _self = this;
            $("#down").on( "touchstart vmousedown", function () {
                $("#downPressed").show();
                gameClient.sendCmd('move', {x: 0, y: 1, speed: 5 });
                _self.sound.startSound("assets/button.mp3");

                _self.currentAction = "down";
            });
        };

        GameControls.prototype.attachLeftEvent = function () {
            var _self = this;
            $("#left").on( "touchstart vmousedown", function () {
                $("#leftPressed").show();
                gameClient.sendCmd('move', {x: -1, y: 0, speed: 5 });
                _self.sound.startSound("assets/button.mp3");

                _self.currentAction = "left";
            });
        };

        GameControls.prototype.attachRightEvent = function () {
            var _self = this;
            $("#right").on( "touchstart vmousedown", function () {
                $("#rightPressed").show();
                gameClient.sendCmd('move', {x: 1, y: 0, speed: 5 });
                _self.sound.startSound("assets/button.mp3");

                _self.currentAction = "right";
            });
        };

        GameControls.prototype.attachStopEvent = function () {
            var _self = this;
            $("#outerGamePad").on( "touchend vmouseup", function (event) {
                $("#" + event.target.id + "Pressed").hide();
                if (event.target.id.slice(-7) === "Pressed") {
                    $("#" + event.target.id).hide();
                }

                if (_self.currentAction === event.target.id.slice(-7) ||
                  _self.currentAction === event.target.id) {
                  gameClient.sendCmd('stop', { speed: 0 });
                  _self.currentAction = "";
                }

                if (!($("#upPressed").is(':hidden'))) {
                  gameClient.sendCmd('move', { x: 0, y: -1, speed: 5 });
                  _self.currentAction = "up";
                }

                if (!($("#downPressed").is(':hidden'))) {
                  gameClient.sendCmd('move', { x: 0, y: 1, speed: 5 });
                  _self.currentAction = "down";
                }

                if (!($("#leftPressed").is(':hidden'))) {
                  gameClient.sendCmd('move', { x: -1, y: 0, speed: 5 });
                  _self.currentAction = "left";
                }

                if (!($("#rightPressed").is(':hidden'))) {
                  gameClient.sendCmd('move', { x: 1, y: 0, speed: 5 });
                  _self.currentAction = "right";
                }
            });
        }

        GameControls.prototype.attachEnterKey = function () {
            var _self = this;
            $('#joinGame').click(function (e) {
              gameClient.sendCmd('gameID', { gameID: $('#gameID').val().toUpperCase() });
            });
        };

        GameControls.prototype.attachGameControls = function () {
            this.attachUpEvent();
            this.attachDownEvent();
            this.attachLeftEvent();
            this.attachRightEvent();
            this.attachStopEvent();
            this.attachEnterKey();
        };
        return GameControls;
    })();

    var game = new Game(new GameControls(), new Sound());
    game.start();
};

// Start the main app logic.
requirejs([
  './gameClient'
], main);