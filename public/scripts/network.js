'use strict';

define(['socketio', './playerConnection'], function (SocketIO, PlayerConnection) {

    var socket = null,
        connected = false,
        listeners = {},
        players = {},
        nbPlayers = 0;

    function send(msg) {
        if (socket) socket.emit('message', msg);
    }

    var GameServer = function () {

        socket = new SocketIO('http://' + window.location.host);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('message', onMessage);
        socket.on('error', console.error);

    };

    GameServer.prototype.sayHi = function (type) {
        if (socket) this.sendCmd('hi', -1, { 'type': type });
    };

    GameServer.prototype.addEventListener = function (type, callback) {
        if (!listeners.hasOwnProperty(type)) {
            listeners[type] = callback;
        }
    };

    GameServer.prototype.sendCmd = function (cmd, id, data) {
        send({'cmd': cmd, 'id': id, 'data': data || {}});
    };

    // actions
    var gameID = function (data) {
        var gameID = data.gameID;

        sendEvent('gameID', [gameID]);
    };

    var addPlayer = function (data) {
        var id = data.id;

        if (players[id]) {
            return;
        }

        players[id] = new PlayerConnection(this, id);
        nbPlayers++;
        sendEvent('playerconnect', [players[id]]);
    };

    var removePlayer = function (data) {
        var id = data.id;
        var player = players[id];
        if (player) {
            player.sendEvent('disconnect', []);
            delete players[id];
            nbPlayers--;
        }
    };

    var updatePlayer = function (msg) {
        var player = players[msg.id];
        if (player) {
            player.sendEvent(msg.data.cmd, [msg.data.data]);
        }
    };

    var handlers = {
        'gameID': gameID,
        'addPlayer': addPlayer,
        'removePlayer': removePlayer,
        'updatePlayer': updatePlayer
    };

    // listeners
    var onConnect = function () {
        connected = true;
        console.log('Web browser connected!');
    };

    var onDisconnect = function () {
        console.error('DISCONNECTED');
        connected = false;
        sendEvent('disconnect');
        for (var p in players) {
            removePlayer(p);
        }
    };

    var onMessage = function (data) {
        if (!connected) return;

        var handler = handlers[data.type];
        if (handler) {
            handler(data);
        } else {
            console.error('Unknown message: ', data);
        }
    };

    // call listener
    function sendEvent (type, args) {
        var callback = listeners[type];
        if (callback) {
            callback.apply(callback, args);
        }
    }

    return GameServer;

});

