import React from "react";

const Home = () => {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="text-center p-10">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
          Welcome to SkillBridge
        </h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium">
          Your intelligent companion for skill identification and career connection.
        </p>
      </div>
    </div>
  );
};

export default Home;
