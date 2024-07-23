import React from 'react';
import useGaugeStore from '@/store/gaugeStore';

const GaugeBar = ({ hand }) => {
  const { hitGauge, maxGauge } = useGaugeStore();
  const gaugeValue = hitGauge[hand];
  const blocks = 10; // 총 블록 수
  const filledBlocks = Math.floor((gaugeValue / maxGauge) * blocks);

  return (
    <div className="flex flex-col-reverse h-[200px] w-8 bg-gray-200 rounded-full overflow-hidden">
      {[...Array(blocks)].map((_, index) => (
        <div
          key={index}
          className={`w-full h-[20px] ${
            index < filledBlocks
              ? hand === 'left' 
                ? 'bg-red-500' 
                : 'bg-blue-500'
              : 'bg-transparent'
          } border-t border-gray-300`}
        />
      ))}
    </div>
  );
};

const GaugeUi = () => {

  return (
    <div className="absolute top-1/2 w-full px-5 flex flex-row justify-between z-50">
      <GaugeBar hand="left" />
      <GaugeBar hand="right" />
    </div>
  );
};

export default GaugeUi;