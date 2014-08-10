'use strict';

define(function () {

    var host = 'ws://' + window.location.host + '/ws',
        socket = null,
        connected = false,
        type = '',
        queue = [],
        listeners = {};

    function send(msg) {
        if (connected && socket) {
            if (typeof msg !== 'string') {
                msg = JSON.stringify(msg);
            }
            socket.send(msg);
            console.log('sent message: ', msg);
        } else {
            queue.push(msg);
        }
    }

    var GameServer = function (typeOfClient) {
        type = typeOfClient;

        socket = new WebSocket(host);

        socket.onopen = onConnect;
        socket.onclose = onDisconnect;
        socket.onmessage = onMessage;
        socket.onerror = console.error;

    };

    GameServer.prototype.addEventListener = function (type, callback) {
        if (!listeners.hasOwnProperty(type)) {
            listeners[type] = callback;
        }
    };

    GameServer.prototype.sendCmd = function (cmd, data) {
        send({'cmd': cmd, 'data': data || {}});
    };

    // actions
    var connect = function () {
        sendEvent('connect');
    };

    var update = function (msg) {
        sendEvent(msg.cmd, [msg.data]);
    };

    var handlers = {
        'connect': connect,
        'update': update
    };

    // listeners
    var onConnect = function () {
        connected = true;
        console.log('Web browser connected!');
        send(type);
    };

    var onDisconnect = function () {
        console.error('DISCONNECTED');
        connected = false;
        sendEvent('disconnect');
    };

    var onMessage = function (rawData) {
        var data = {};
        try {
            data = JSON.parse(rawData.data);
        } catch (e) {
            console.error('Error parsing message in onMessage: ', e);
        }
        if (!connected) return;

        var handler = handlers[data.action];
        if (handler) {
            handler(data.data);
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

