'use strict';

define(['./network'], function (Network) {

    var host = 'ws://' + window.location.host + '/ws',
        type = '',
        net = null,
        listeners = {};

    function sendCmd(cmd, data) {
        net.send({'cmd': cmd, 'data': data || {}});
    }

    var GameClient = function (typeOfClient) {
        type = typeOfClient;

        net = new Network(host);
        net.on('connect', onConnect);
        net.on('disconnect', onDisconnect);
        net.on('message', onMessage);
        net.on('error', console.error);
    };

    GameClient.prototype.addEventListener = function (type, callback) {
        if (!listeners.hasOwnProperty(type)) {
            listeners[type] = callback;
        }
    };

    GameClient.prototype.sendCmd = sendCmd;

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

    var onConnect = function () {
        net.send(type);
    };

    var onDisconnect = function () {
        sendEvent('disconnect');
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

    return GameClient;

});

