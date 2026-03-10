// Audio Service for SOS sounds
class AudioService {
  constructor() {
    this.sosSound = null;
    this.isPlaying = false;
  }

  // Initialize the SOS sound
  init() {
    if (!this.sosSound) {
      this.sosSound = new Audio("/sounds/sos-alarm.mp3");
      this.sosSound.loop = true;
      this.sosSound.volume = 1.0;
    }
  }

  // Play SOS alarm
  playSOS() {
    this.init();
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.sosSound.play().catch((err) => {
        console.error("Error playing SOS sound:", err);
        // Try playing a generated beep if audio file fails
        this.playBeepAlarm();
      });
    }
  }

  // Stop SOS alarm
  stopSOS() {
    if (this.sosSound) {
      this.sosSound.pause();
      this.sosSound.currentTime = 0;
      this.isPlaying = false;
    }
  }

  // Generate a beep alarm using Web Audio API as fallback
  playBeepAlarm() {
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      let beepCount = 0;
      const maxBeeps = 10;

      const playBeep = () => {
        if (beepCount >= maxBeeps || !this.isPlaying) {
          return;
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 880; // A5 note
        oscillator.type = "square";

        gainNode.gain.value = 0.5;

        oscillator.start();

        setTimeout(() => {
          oscillator.stop();
          beepCount++;
          if (this.isPlaying) {
            setTimeout(playBeep, 200);
          }
        }, 300);
      };

      playBeep();
    } catch (error) {
      console.error("Web Audio API not supported:", error);
    }
  }

  // Play a short notification sound
  playNotification() {
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 523.25; // C5 note
      oscillator.type = "sine";

      gainNode.gain.value = 0.3;
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5,
      );

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("Could not play notification sound:", error);
    }
  }
}

export const audioService = new AudioService();
export default audioService;
