import React, { useState } from "react";
import { matchSkills } from "./services/nlpService";
import skillsData from "./data/skills.json";
 
console.log(matchSkills);
function App() {
  const [input, setInput] = useState("");
  const [foundSkills, setFoundSkills] = useState([]);

  const handleSearch = (e) => {
    const text = e.target.value;
    setInput(text);
    const matches = matchSkills(text);
    setFoundSkills(matches);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        SkillBridge AI - Logic Test
      </h1>

      <div className="w-full max-w-md">
        <input
          type="text"
          placeholder="Describe your work (e.g., 'I fix pipes and paint walls')"
          className="w-full p-4 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={input}
          onChange={handleSearch}
        />

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-700">
            Identified Skills:
          </h2>
          {foundSkills.length > 0 ? (
            foundSkills.map((skill) => (
              <div
                key={skill.id}
                className="p-4 bg-white rounded-md shadow-sm border-l-4 border-blue-500"
              >
                <p className="font-bold text-blue-700">
                  {skill.professional_title}
                </p>
                <p className="text-sm text-gray-500 uppercase tracking-wide">
                  {skill.category}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic">
              No skills identified yet. Start typing keywords from your
              database...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
