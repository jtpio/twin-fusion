'use strict';

define(function() {

    var PlayerConnection = function(server, id) {
        this.server = server;
        this.id = id;
        this.handlers = {};
    };

    PlayerConnection.prototype.sendCommand = function(cmd, msg) {
        this.server.sendCommand('client', this.id, { cmd: cmd, data: msg || {} });
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

    return PlayerConnection;

});

