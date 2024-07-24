import React from 'react';

const SkillProgressBar = ({ skillName, cooldown, colorClass, isActive }) => {
  const percentage = ((25 - cooldown) / 25) * 100; 
  const skillImages = {
    Shield: '/images/skill/speed.png',
    Heal: '/images/skill/heal.png',
    Attack: '/images/skill/attack.png'
  };

  return (
    <div className="skill-progress-bar mb-4 relative">
      <div className={`w-24 h-24 rounded-full overflow-hidden relative`}> {/* Increased size */}
        <img 
          src={skillImages[skillName]} 
          alt={skillName} 
          className={`w-full h-full object-cover ${isActive ? 'opacity-50' : ''}`} 
        />
        {isActive && (
          <div className="absolute inset-0 bg-blue-200 opacity-50"></div>
        )}
        <div
          className={`absolute bottom-0 left-0 right-0 ${colorClass} transition-all duration-500 ease-in-out`}
          style={{ height: `${percentage}%` }}
        ></div>
        {cooldown > 0 && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white font-bold text-6xl">
            {cooldown}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillProgressBar;
