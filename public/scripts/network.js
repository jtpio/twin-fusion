'use strict';

define(function () {

    var socket = null,
        queue = [];

    function isConnected () {
        return socket.readyState === WebSocket.OPEN;
    }

    var NetWork = function (host) {
        socket = new WebSocket(host);
    };

    NetWork.prototype.send = function(msg) {
        if (socket && this.isConnected()) {
            if (typeof msg !== 'string') {
                msg = JSON.stringify(msg);
            }
            socket.send(msg);
        } else {
            queue.push(msg);
        }
    };

    NetWork.prototype.isConnected = isConnected;

    NetWork.prototype.on = function(event, callback) {
        switch (event) {
            case 'connect':
                socket.onopen = callback;
                break;
            case 'disconnect':
                socket.onclose = callback;
                break;
            case 'error':
                socket.onerror = callback;
                break;
            case 'message':
                socket.onmessage = function(rawData) {
                if (!isConnected()) return;
                    var data = {};
                    try {
                        data = JSON.parse(rawData.data);
                    } catch (e) {
                        console.error('Error parsing message in onmessage: ', e);
                    }
                    callback(data);
                };
                break;
        }
    };

    return NetWork;

});

