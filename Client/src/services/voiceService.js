const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const createRecognizer = (onResult, onEnd, onError) => {
  if (!SpeechRecognition) {
    console.error("Speech Recognition API is not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    console.log("🎤 SkillBridge AI: Listening...");
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join(' ');
    
    onResult(transcript);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  recognition.onerror = (event) => {
    console.error("🎤 SkillBridge AI Error:", event.error);
    if (onError) onError(event.error);
  };

  return recognition;
};