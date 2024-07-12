import React, { useState } from 'react';
import { setNickname, } from '@/api/user/api';

export default function NicknameModal({ onClose, onSubmit }) {
  const [userNickname, setUserNickname] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (userNickname.trim() !== '' && selectedFile) {
      try {
        await setNickname(userNickname, selectedFile);
        onSubmit(userNickname);
        onClose();
      } catch (error) {
        console.error('Failed to set nickname:', error);
        alert('닉네임 설정에 실패했습니다. 다시 시도해주세요.');
      }
    } else {
      alert('닉네임과 이미지를 입력하세요.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4">닉네임 설정</h2>
        <input
          type="text"
          className="border border-gray-300 p-2 rounded-lg w-full mb-4"
          placeholder="닉네임을 입력하세요"
          value={userNickname}
          onChange={(e) => setUserNickname(e.target.value)}
        />
        <input
          type="file"
          className="border border-gray-300 p-2 rounded-lg w-full mb-4"
          onChange={handleFileChange}
        />
        <button
          className="bg-blue-500 text-white p-2 rounded-lg w-full"
          onClick={handleSubmit}
        >
          확인
        </button>
      </div>
    </div>
  );
}
