import React from 'react';

const Soundwave = ({ isListening }) => {
  if (!isListening) return null;

  return (
    <div className="flex items-center justify-center gap-[4px] h-6 px-4 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
      {[...Array(9)].map((_, i) => (
        <span
          key={i}
          className="w-[3px] bg-gradient-to-t from-blue-500 to-indigo-400 rounded-full animate-soundwave"
          style={{
            height: '100%',
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.6 + (i % 3) * 0.2}s`,
            transformOrigin: 'center',
          }}
        />
      ))}
      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-2 animate-pulse">
        Listening
      </span>
    </div>
  );
};

export default Soundwave;
