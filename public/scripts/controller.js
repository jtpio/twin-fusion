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
          $('body').css('margin', 0);
          $('body').css('background-image', 'none');
          $('#outerGamePad').hide();
          $('#victoryPannel').fadeIn();
          document.getElementById('victoryPannel').style.display = 'flex';
          newSound().startSound('assets/winning.mp3');
      };

      Game.prototype.start = function () {
        this.initialize();

        gameClient = new GameClient('player');

        $('#outerGamePad').hide();

        this.addListener ('connect', function () {
          $('body').css('backgroundColor', '');
          $('body').css('background-image', 'url(../assets/img/background.png)');
          $('#victoryPannel').hide();
          $('#loadingPannel').hide();
          $('#gameIDInput').fadeOut();
          $('#outerGamePad').fadeIn();
          console.log ('player connected');
        });

        this.addListener('winner', this.end);

        this.addListener('disconnect', function () {
            alert ('You cannot connect. Please try next game :)');
        });
      };
      return Game;
    })();
     //=============================================== PIXI.JS CONTROLLER ===============================================
    var stage = new PIXI.Stage(0x000000, true);
    var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, null, true);
    document.getElementById("outerGamePad").appendChild(renderer.view);

    var ua = PIXI.Texture.fromImage('assets/img/upArrow.png'),
        da = PIXI.Texture.fromImage('assets/img/downArrow.png'),
        la = PIXI.Texture.fromImage('assets/img/leftArrow.png'),
        ra = PIXI.Texture.fromImage('assets/img/rightArrow.png'),
        uap = PIXI.Texture.fromImage('assets/img/upArrowPressed.png'),
        dap = PIXI.Texture.fromImage('assets/img/downArrowPressed.png'),
        lap = PIXI.Texture.fromImage('assets/img/leftArrowPressed.png'),
        rap = PIXI.Texture.fromImage('assets/img/rightArrowPressed.png'),
        pad = PIXI.Texture.fromImage('assets/img/gamePad.png'),
        buttons = [], dx = [0, 0, -1, 1], dy = [-1, 1, 0, 0],
        dir;

    var Button = function(x, y, a, ap, isStatic, dir, sound){
        var button = new PIXI.Sprite(a);
        button.anchor.x = 0.5;
        button.anchor.y = 0.5;
        button.position.x = x;
        button.position.y = y;
        button.setInteractive(true);

        button.mousedown = button.touchstart = function(data){
            this.isdown = true;
            this.setTexture(ap);
            this.alpha = 1;
            if(!isStatic){this.width = this.isOver?90:100; this.height = this.isOver?90:100;}
            if(!this.isOver)this.setTexture(a);
        }    
        button.mouseup = button.touchend = function(data){
            this.isdown = false;
            this.setTexture(a);
            if(!isStatic){this.width = this.isOver?100:90; this.height = this.isOver?100:90;}
        }
        button.mouseover = function(data){
            this.isOver = true;
            if(this.isdown)return;
            this.setTexture(a);
            if(!isStatic){this.width = this.isOver?100:90; this.height = this.isOver?100:90;}
        }
        button.mouseout = function(data){
            this.isOver = false;
            this.setTexture(a);
            if(!isStatic){
                this.width = this.isOver?100:90; this.height = this.isOver?100:90;
                if(this.isdown)sound.startSound('assets/button.mp3');
            }
        }
        button.click = button.tap = function(data){
            if(!isStatic){
                gameClient.sendCmd('move', {x: dx[dir], y: dy[dir], speed: 5 });
                sound.startSound('assets/button.mp3');
            }
        }
        return button;
    }
    var sx = window.innerWidth;
    var sy = window.innerHeight;
    buttons.push(Button(sx/2, sy/2, pad, pad, true, null, new Sound()));
    buttons.push(Button(sx/2, sy/2 - 100, ua, uap, false, 0, new Sound()));
    buttons.push(Button(sx/2, sy/2 + 100, da, dap, false, 1, new Sound()));
    buttons.push(Button(sx/2 - 100, sy/2, la, lap, false, 2, new Sound()));
    buttons.push(Button(sx/2 + 100, sy/2, ra, rap, false, 3, new Sound()));

    for(var i = 0; i < buttons.length; i++)stage.addChild(buttons[i]);

    
    requestAnimFrame(animate);
    function animate(){
        stage.width = window.innerWidth;
        stage.height = window.innerHeight;
        requestAnimFrame(animate);
        for(var i = 0; i < buttons.length; i++){
            buttons[i].scale.x = sx/window.innerWidth;
            buttons[i].scale.y = sy/window.innerHeight;
            if(i > 0){
                buttons[i].position.x = sx/2+100*(sx/window.innerWidth)*dx[i-1];
                buttons[i].position.y = sy/2+100*(sy/window.innerHeight)*dy[i-1];
            }
        }
        renderer.render(stage);
    }

    var GameControls = (function () {
        function GameControls() {}
        GameControls.prototype.attachGameControls = function () {
            $('#joinGame').click(function (e) {
              gameClient.sendCmd('gameID', { gameID: $('#gameID').val().toUpperCase() });
            });
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