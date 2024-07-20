'use client'
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Room = dynamic(() => import('@/components/lobby/Room'));
const RoomButton = dynamic(() => import('@/components/lobby/RoomButton'));
const RoomModal = dynamic(() => import('@/components/lobby/RoomModal'));
const NicknameModal = dynamic(() => import('@/components/lobby/NicknameModal'));
// import Room from '@/components/lobby/Room';
// import RoomButton from '@/components/lobby/RoomButton';
// import RoomModal from '@/components/lobby/RoomModal';
// import NicknameModal from '@/components/lobby/NicknameModal';
import useSocketStore from '@/store/socketStore';
import useUserStore from '@/store/userStore';
import { useTitle } from "@/app/contexts/TitleContext";
import {getNickname, getUserEmail} from "@/api/user/api";

export default function Lobby() {
  const router = useRouter();
  const { initSocket, closeSocket, rooms, addRoom, joinRoom } = useSocketStore();
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);
  const { setSocketId, setMyNickname } = useUserStore();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [userProfileImage, setUserProfileImage] = useState('');
  const { setTitle } = useTitle();

  useEffect(() => {
    const initializeUser = async () => {
      const email = await getUserEmail();
      setUserEmail(email);

      if (email) {
        try {
          const response = await getNickname(email);
          setUserProfileImage(response.profileImage);
          setUserNickname(response.nickname);
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        console.error("No user email found");
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    const socket = initSocket(process.env.NEXT_PUBLIC_NODE_SERVER || 'http://localhost:7777');

    socket.on('connect', () => {
      setSocketId(socket.id);
      setUserNickname('123');
    });
    return () => closeSocket;
  },[initSocket, closeSocket, setSocketId]);

  useEffect(() => {
    setTitle("Lobby")
  }, [setTitle]);

  
  const goGame = (roomId) => {
    joinRoom(roomId, userEmail, userNickname, userProfileImage);
    router.push(`/game?roomId=${roomId}`);
  };
  
  const handleCreateRoom = (roomData) => {
    addRoom(roomData, (newRoom) => {
      goGame(newRoom);
    });
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const filterRooms = useCallback(() => {
    const filtered = Object.entries(rooms).filter(([roomId, room]) =>
      room.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  setFilteredRooms(filtered);
}, [rooms, searchTerm]);

useEffect(() => {
  filterRooms();
}, [filterRooms]);

  const handleNicknameSubmit = async (nickname) => {
    try {
      setUserNickname(nickname);
      setShowNicknameModal(false);
    } catch (err) {
      alert('Failed to set nickname');
    }
  };

  return (
      <div className="relative flex flex-col items-center justify-between min-h-screen p-6 bg-cover bg-center" style={{ backgroundImage: "url('/images/ring.jpg')" }}>
        <div className="mt-32 flex flex-col items-center w-full max-w-screen-md">
          <div className="w-full p-6 bg-blue-100 rounded-lg shadow-lg">
            <div className="flex justify-center items-center mb-6">
              <input
                  className="border border-gray-300 py-2 px-2 rounded-lg max-w-xs w-1/2 h-12"
                  placeholder="방 제목"
                  value={searchTerm}
                  onChange={handleSearchChange}
              />
              <div className="ml-8 h-20">
                <RoomButton onClick={() => setShowRoomModal(true)} />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredRooms.map(([roomId, room]) => (
                  <Room
                      key={roomId}
                      title={room.title}
                      player1={room.players[0]}
                      player2={room.players[1]}
                      status={room.players.length < 2 ? false : true}
                      onClick={() => goGame(roomId)}
                  />
              ))}
            </div>
          </div>
        </div>
        {showRoomModal && (
            <RoomModal
                onClose={() => setShowRoomModal(false)}
                onCreate={handleCreateRoom}
            />
        )}
        {showNicknameModal && (
            <NicknameModal
                onClose={() => setShowNicknameModal(false)}
                onSubmit={handleNicknameSubmit}
            />
        )}
      </div>
  );
}