import React from 'react';
import useGaugeStore from '@/store/gaugeStore';
import Image from 'next/image';

const GaugeBar = ({ hand }) => {
  const { hitGauge, maxGauge } = useGaugeStore();
  const gaugeValue = hitGauge[hand];
  const blocks = 10; // 총 블록 수
  const filledBlocks = Math.floor((gaugeValue / maxGauge) * blocks);

  return (
    <div className={`relative ${hand === 'right' ? 'flex justify-end' : ''}`}>
      <Image
        src={`/images/${hand}_ui.webp`}
        alt={`${hand} UI background`}
        width={180}
        height={350}
        sizes="(max-width: 768px) 100vw, 50vw"
        className={`absolute top-0 ${hand === 'left' ? 'left-0' : 'right-0'} z-0`}
      />
      <div className="flex flex-col-reverse border-5 border-zinc-500 h-[250px] w-8 mt-[85px] mx-3 bg-gray-200 rounded-full overflow-hidden relative z-30">
        {[...Array(blocks)].map((_, index) => (
          <div
            key={index}
            className={`w-full h-[25px] ${
              index < filledBlocks
                ? hand === 'left' 
                  ? 'bg-red-500' 
                  : 'bg-blue-500'
                : 'bg-transparent'
            } border-t border-gray-300`}
          />
        ))}
      </div>
    </div>
  );
};

const GaugeUi = () => {
  return (
    <div className="absolute top-1/2 w-full flex flex-row justify-between z-50">
      <GaugeBar hand="left" />
      <GaugeBar hand="right" />
    </div>
  );
};

export default GaugeUi;