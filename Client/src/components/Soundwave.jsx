import React from 'react';

const Soundwave = ({ isListening }) => {
  if (!isListening) return null;

  return (
    <div className="flex h-7 items-center justify-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 shadow-xs">
      {[...Array(8)].map((_, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-blue-600 animate-soundwave"
          style={{
            height: '100%',
            animationDelay: `${i * 0.09}s`,
            animationDuration: `${0.65 + (i % 4) * 0.15}s`,
            transformOrigin: 'center',
          }}
        />
      ))}
      <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
        Listening
      </span>
    </div>
  );
};

export default Soundwave;
