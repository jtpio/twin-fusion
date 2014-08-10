function Sound () {
  this.arraybuffer = null;
  if (!window.context) {
      try {
        window.context = new webkitAudioContext();
      }
      catch(e) {
      }     
  }
};

Sound.prototype.playSound = function (audioBuffer, repeat) {
    var gainNode = context.createGain();
    gainNode.connect(context.destination);
    gainNode.gain.value = 0.5;
    var source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    source.loop = repeat;
    source.start(0);
}

Sound.prototype.startSound = function (url, repeat) {
    var myAudioBuffer = null;
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
      context.decodeAudioData(request.response, function(buffer) {
        myAudioBuffer = buffer;
          (new Sound).playSound(myAudioBuffer, repeat);
      });
    }
    request.send();
}

Sound.prototype.stopSound = function () {
    if (source) {
      source.stop();
    } 
}