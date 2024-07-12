import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 fixed w-full top-0 left-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-gray-300 hover:text-white">
          Home
        </Link>
        <div className="text-white text-lg font-bold flex-grow text-center">
          MyApp
        </div>
        <div className="flex space-x-4">
          <Link href="/lobby" className="text-gray-300 hover:text-white">
            Lobby
          </Link>
          <Link href="/game" className="text-gray-300 hover:text-white">
            Game
          </Link>
        </div>
      </div>
    </nav>
  );
}
