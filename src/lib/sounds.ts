const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

export const sounds = {
  click: () => {
    playTone(800, 0.1, 'sine', 0.2);
  },


  playerJoin: () => {
    playTone(523.25, 0.15, 'sine', 0.3);
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.3), 100);
  },


  gameStart: () => {
    playTone(523.25, 0.2, 'sine', 0.4);
    setTimeout(() => playTone(659.25, 0.2, 'sine', 0.4), 150);
    setTimeout(() => playTone(783.99, 0.3, 'sine', 0.4), 300);
  },


  reveal: () => {
    playTone(392, 0.3, 'triangle', 0.35);
    setTimeout(() => playTone(493.88, 0.3, 'triangle', 0.35), 200);
    setTimeout(() => playTone(587.33, 0.4, 'triangle', 0.35), 400);
  },


  error: () => {
    playTone(200, 0.2, 'sawtooth', 0.3);
  },


  success: () => {
    playTone(659.25, 0.15, 'sine', 0.3);
    setTimeout(() => playTone(783.99, 0.2, 'sine', 0.3), 150);
  },

  vote: () => {
    playTone(440, 0.1, 'sine', 0.25);
    setTimeout(() => playTone(554.37, 0.15, 'sine', 0.25), 80);
  },

  timerTick: () => {
    playTone(1000, 0.05, 'sine', 0.15);
  },

  timerWarning: () => {
    playTone(600, 0.15, 'square', 0.2);
    setTimeout(() => playTone(600, 0.15, 'square', 0.2), 200);
  },

  caught: () => {
    playTone(523.25, 0.15, 'sine', 0.4);
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.4), 120);
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.4), 240);
    setTimeout(() => playTone(1046.5, 0.3, 'sine', 0.4), 360);
  },

  escaped: () => {
    playTone(392, 0.2, 'sawtooth', 0.3);
    setTimeout(() => playTone(311.13, 0.2, 'sawtooth', 0.3), 200);
    setTimeout(() => playTone(261.63, 0.4, 'sawtooth', 0.3), 400);
  },

  nextTurn: () => {
    playTone(660, 0.1, 'triangle', 0.2);
  },
};
