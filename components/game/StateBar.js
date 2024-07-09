// nickname, hp, 
export default function StateBar({player}) {
  return (
  <div>
    <div class="mb-1 text-base font-medium text-white">{}</div>
    <div class="    bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
      <div class="bg-red-600 h-2.5 rounded-full dark:bg-red-500" style="width: 45%"></div>
    </div>
  </div>
  )
}