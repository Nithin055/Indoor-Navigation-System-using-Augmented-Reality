import * as Speech from 'expo-speech';

class VoiceService {
  private isEnabled: boolean = true;

  async speak(text: string) {
    if (!this.isEnabled) return;
    
    try {
            const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
      
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }

  async stop() {
    await Speech.stop();
  }
  
  setEnabled(enabled: boolean) {
      this.isEnabled = enabled;
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }
}

export default new VoiceService();
