import React, { useState, useEffect } from "react";
import { matchSkills } from "./services/nlpService";
import { createRecognizer } from "./services/voiceService";

function App() {
  const [input, setInput] = useState("");
  const [foundSkills, setFoundSkills] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);

  useEffect(() => {
    console.log("System Check: Initializing Recognizer..."); // LOG 1
    const rec = createRecognizer(
      (transcript) => {
        console.log("UI received transcript:", transcript); // LOG 2
        setInput(transcript);
        const matches = matchSkills(transcript);
        setFoundSkills(matches);
      },
      (error) => {
        console.error("UI received error:", error); // LOG 3
        setIsListening(false);
      },
    );

    if (rec) {
      console.log("System Check: Recognizer Created Successfully!"); // LOG 4
      setRecognizer(rec);
    } else {
      console.error("System Check: Recognizer Failed to Create."); // LOG 5
    }
  }, []);

  const toggleListen = () => {
    if (!recognizer) return;

    if (isListening) {
      recognizer.stop();
      setIsListening(false);
    } else {
      // Clear previous results for a fresh start
      setInput("");
      setFoundSkills([]);

      try {
        recognizer.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognizer:", err);
        setIsListening(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          SkillBridge AI
        </h1>
        <p className="text-gray-500 italic">
          "Speak naturally about your work to discover your skills."
        </p>
      </header>

      <div className="w-full max-w-md space-y-6">
        {/* Voice Control Button */}
        <button
          onClick={toggleListen}
          className={`w-full p-6 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-3 ${
            isListening
              ? "bg-red-500 animate-pulse ring-4 ring-red-100"
              : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
          }`}
        >
          {isListening ? (
            <>
              <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
              🛑 Stop & Process
            </>
          ) : (
            "🎤 Start Speaking"
          )}
        </button>

        {/* Real-time Transcript Window */}
        <div className="p-5 bg-white rounded-xl border-2 border-dashed border-gray-200 min-h-[120px] shadow-sm">
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
            Live Transcript
          </label>
          <p className="text-gray-700 leading-relaxed">
            {input || (
              <span className="text-gray-300">
                Click the button and describe your experience...
              </span>
            )}
          </p>
        </div>

        {/* Dynamic Skill Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-700 flex items-center gap-2">
            Identified Professional Skills
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
              {foundSkills.length}
            </span>
          </h2>

          {foundSkills.length > 0 ? (
            <div className="grid gap-3">
              {foundSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500 transform transition-all hover:scale-[1.02]"
                >
                  <p className="font-bold text-slate-800">
                    {skill.professional_title}
                  </p>
                  <p className="text-xs text-blue-500 font-medium uppercase mt-1">
                    {skill.category}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-100 rounded-xl border border-gray-200">
              <p className="text-gray-400 text-sm">Waiting for keywords...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
