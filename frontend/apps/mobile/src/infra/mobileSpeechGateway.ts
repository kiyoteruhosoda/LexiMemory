import Tts from "react-native-tts";
import type { SpeechGateway } from "../../../../src/core/speech/speechGateway";

// Initialize default language once at module load
Tts.setDefaultLanguage("en-US");

export const mobileSpeechGateway: SpeechGateway = {
  isAvailable(): boolean {
    return true;
  },
  speakEnglish(text: string): void {
    Tts.stop();
    Tts.speak(text);
  },
};
