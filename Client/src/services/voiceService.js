const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const createRecognizer = (onResult, onError) => {
  if (!SpeechRecognition) {
    console.error("Speech Recognition API is not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  
  // Optimized for Real-Time Skill Matching
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    console.log("🎤 SkillBridge AI: Listening...");
  };

  recognition.onresult = (event) => {
    // Efficiently parse the speech fragments into a single string
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join(' ');
    
    onResult(transcript);
  };

  recognition.onerror = (event) => {
    // We keep the error log to help with any future debugging
    console.error("🎤 SkillBridge AI Error:", event.error);
    if (onError) onError(event.error);
  };

  return recognition;
};