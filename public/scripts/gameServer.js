'use strict';

define(['./network'], function (Network) {

    var host = 'ws://' + window.location.host + '/ws',
        net = null,
        type = '',
        listeners = {},
        players = {},
        nbPlayers = 0;

    function sendCmd(cmd, id, data) {
        net.send({'cmd': cmd, 'playerID': id, 'data': data || {}});
    }

    var GameServer = function (typeOfClient) {
        type = typeOfClient;

        net = new Network(host);
        net.on('connect', onConnect);
        net.on('disconnect', onDisconnect);
        net.on('message', onMessage);
        net.on('error', console.error);
    };

    GameServer.prototype.addEventListener = function (type, callback) {
        if (!listeners.hasOwnProperty(type)) {
            listeners[type] = callback;
        }
    };

    GameServer.prototype.sendCmd = sendCmd;

    var gameID = function (msg) {
        var gameID = msg.data.gameID;
        sendEvent('gameID', [gameID]);
    };

    var addPlayer = function (msg) {
        var id = msg.playerID;

        if (players[id]) return;

        players[id] = new PlayerConnection(id);
        nbPlayers++;
        sendEvent('playerconnect', [players[id]]);
    };

    var removePlayer = function (msg) {
        var id = msg.playerID;
        var player = players[id];

        if (!player) return;

        player.sendEvent('disconnect', []);
        delete players[id];
        nbPlayers--;
    };

    var updatePlayer = function (msg) {
        var player = players[msg.playerID];

        if (!player) return;

        player.sendEvent(msg.cmd, [msg.data]);
    };

    var handlers = {
        'gameID': gameID,
        'addPlayer': addPlayer,
        'removePlayer': removePlayer,
        'updatePlayer': updatePlayer
    };

    var onConnect = function () {
        net.send(type);
    };

    var onDisconnect = function () {
        sendEvent('disconnect');
        for (var p in players) {
            removePlayer(p);
        }
    };

    var onMessage = function (data) {
        var handler = handlers[data.action];
        if (handler) {
            handler(data.data);
        } else {
            console.error('Unknown message: ', data);
        }
    };

    function sendEvent (type, args) {
        var callback = listeners[type];
        if (callback) {
            callback.apply(callback, args);
        }
    }

    var PlayerConnection = function(id) {
        this.id = id;
        this.handlers = {};
    };

    PlayerConnection.prototype.sendCmd = function(cmd, msg) {
        sendCmd(cmd, this.id, msg || {});
    };

    PlayerConnection.prototype.addEventListener = function(eventType, handler) {
        this.handlers[eventType] = handler;
    };

    PlayerConnection.prototype.removeEventListener = function(eventType) {
        this.handlers[eventType] = undefined;
    };

    PlayerConnection.prototype.removeAllListeners = function() {
        this.handlers = {};
    };

    PlayerConnection.prototype.sendEvent = function(eventType, args) {
        var fn = this.handlers[eventType];
        if (fn) {
            fn.apply(this, args);
        } else {
            console.error('Unknown Event: ' + eventType);
        }
    };

    return GameServer;

});

