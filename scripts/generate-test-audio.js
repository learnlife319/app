// Create an AudioContext
const audioContext = new AudioContext();

// Create an oscillator
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

// Configure the oscillator
oscillator.type = 'sine';
oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 440 Hz
gainNode.gain.setValueAtTime(1, audioContext.currentTime);

// Connect the nodes
oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

// Start and stop the oscillator
oscillator.start();
setTimeout(() => {
  oscillator.stop();
  // Export as MP3
  // Note: In a real environment, we'd use a library like lamejs to encode to MP3
}, 1000);
