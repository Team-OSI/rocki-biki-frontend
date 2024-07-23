import React from 'react';

const SkillProgressBar = ({ skillName, cooldown, colorClass, isActive }) => {
  const percentage = ((25 - cooldown) / 25) * 100; // 15초 기준으로 퍼센티지 계산
  const skillImages = {
    Shield: '/images/skill/shield.png',
    Heal: '/images/skill/heal.png',
    Attack: '/images/skill/attack.png'
  };

  return (
    <div className="skill-progress-bar mb-4 relative">
      <div className={`w-16 h-16 border border-black rounded-md overflow-hidden relative`}>
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
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white font-bold">
            {cooldown}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillProgressBar;
