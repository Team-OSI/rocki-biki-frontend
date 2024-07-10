import useGameStore from '../../store/gameStore'

export default function StateBar() {
  const { opponentHealth, playerHealth } = useGameStore();

  return (
    <div className='absolute z-50 top-1 w-full h-full'>
      <div className='absolute flex flex-row justify-between w-full h-full px-4'>
        <div className="w-2/5 bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full dark:bg-blue-500" 
            style={{width: `${opponentHealth}%`}}
          ></div>
        </div>
        <div className="w-2/5 bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
          <div 
            className="bg-red-600 h-2.5 rounded-full dark:bg-red-500" 
            style={{width: `${playerHealth}%`}}
          ></div>
        </div>
      </div>
    </div>
  )
}