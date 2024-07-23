import React from 'react';

const SkillProgressBar = ({ skillName, cooldown, colorClass }) => {
  const percentage = (cooldown / 10) * 100; // 10초 기준으로 퍼센티지 계산

  return (
    <div className="skill-progress-bar mb-4">
      <div className="w-40 h-6 border border-black rounded-full bg-gray-300 overflow-hidden relative">
        <div
          className={`h-full ${colorClass} transition-width duration-500 ease-in-out`}
          style={{ width: `${percentage}%` }}
        ></div>
        <div className="absolute inset-0 flex justify-center items-center">
          <span className="font-bold text-white">{skillName}</span>
        </div>
      </div>
    </div>
  );
};

export default SkillProgressBar;