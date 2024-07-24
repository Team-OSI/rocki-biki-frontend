'use client'
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import useSocketStore from '@/store/socketStore';
import useUserStore from '@/store/userStore';
import { useTitle } from "@/app/contexts/TitleContext";
import {getNickname, getUserEmail} from "@/api/user/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons";
import Tutorial from "@/components/lobby/Tutorial";

const Room = dynamic(() => import('@/components/lobby/Room'));
const RoomButton = dynamic(() => import('@/components/lobby/RoomButton'));
const NicknameModal = dynamic(() => import('@/components/lobby/NicknameModal'));

export default function Lobby() {
  const router = useRouter();
  const { initSocket, closeSocket, rooms, addRoom, joinRoom } = useSocketStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const { setSocketId, setMyNickname } = useUserStore();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [userProfileImage, setUserProfileImage] = useState('');
  const { setTitle } = useTitle();

  useEffect(() => {
    const initializeUser = async () => {
      const email = await getUserEmail();

      if (email) {
        setUserEmail(email);
        try {
          const response = await getNickname(email);
          setUserProfileImage(response.profileImage);
          setUserNickname(response.nickname);
        } catch (err) {
          console.error("Error fetching user data:", err);
          setShowNicknameModal(true);
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

  const handleCreateRoom = () => {
    if (newRoomTitle.trim()) {
      addRoom({ title: newRoomTitle }, (newRoom) => {
        goGame(newRoom);
      });
      setNewRoomTitle('');
    }
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

  const handleTutorialClick = () => {
    setShowTutorial(prev => !prev);
  };

  useEffect(() => {
    if (showTutorial) {
      setIsTutorialVisible(true);
    } else {
      const timer = setTimeout(() => setIsTutorialVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showTutorial]);

  return (
      <div
          className="relative flex flex-col items-center justify-items-center justify-center min-h-screen px-6 pb-4 bg-cover bg-center"
          style={{backgroundImage: "url('/images/background.png')"}}>
        <div className="mt-16 px-7 gap-3 flex w-full max-w-screen-xl mb-4">
          {/* 왼쪽 패널: 방 만들기 및 튜토리얼 */}
          <div className="w-1/3 flex flex-col gap-4 overflow-y-auto mb-1">
            {/* 상단 부분: 방 만들기 */}
            <div className="p-6 bg-gray-100 bg-opacity-85 rounded-lg shadow-lg">
              <h2 className="text-gray-800 text-3xl text-center font-bold mb-4">Create a room</h2>
              <h3 className="text-gray-800 text-xl text-center font-bold mb-4">Name Your Room</h3>
              <input
                  className="border border-gray-300 py-2 px-2 rounded-lg w-full h-12 mb-4"
                  placeholder="Room Title"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
              />
              <div className="flex justify-center w-full">
                <RoomButton onClick={handleCreateRoom}/>
              </div>
            </div>

            {/* 하단 부분: 튜토리얼 버튼 */}
            <div className="p-6 bg-gray-100 bg-opacity-85 rounded-lg shadow-lg h-1/2">
              <h2 className="text-gray-800 text-3xl text-center font-bold mt-2 mb-3">New to the game?</h2>
              <button
                  className={`py-3 w-full text-xl text-white font-bold rounded-full shadow-md hover:scale-105 transition duration-300 mt-7 ${
                      showTutorial
                          ? "bg-[#bd1439]"
                          : "bg-[#1ba5e0]"
                  }`}
                  onClick={handleTutorialClick}
              >
                {showTutorial ? "Close Tutorial" : "Watch Tutorial"}
              </button>
            </div>
          </div>

          {/* 오른쪽 패널: 방 검색 및 목록 또는 튜토리얼 */}
          <div
              className="w-2/3 p-6 bg-gray-100 bg-opacity-85 rounded-lg shadow-lg h-[calc(100vh-12rem)] overflow-hidden relative">
            <h2 className="text-gray-800 text-3xl text-center font-bold mb-4">Find rooms</h2>
            <div className="relative mb-4 w-full">
              <input
                  className="border border-gray-300 text-gray-800 py-2 pl-3 pr-10 rounded-lg w-full h-12"
                  placeholder="Type here..."
                  value={searchTerm}
                  onChange={handleSearchChange}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400"/>
              </div>
            </div>
            <div className="max-h-[calc(100%-10rem)] overflow-y-auto">
              {filteredRooms.map(([roomId, room]) => (
                  <Room
                      key={roomId}
                      title={room.title}
                      player1={room.playerInfo[0] ? room.playerInfo[0].nickname : ''}
                      player2={room.playerInfo[1] ? room.playerInfo[1].nickname : ''}
                      status={room.players.length < 2 ? false : true}
                      onClick={() => goGame(roomId)}
                  />
              ))}
            </div>
            {isTutorialVisible && <Tutorial isVisible={showTutorial} onClose={() => setShowTutorial(false)} />}
          </div>
        </div>

        {showNicknameModal && (
            <NicknameModal
                onClose={() => setShowNicknameModal(false)}
                onSubmit={handleNicknameSubmit}
            />
        )}
      </div>
  );
}