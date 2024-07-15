// components/myPage/ProfileEditModal.js
import { useState, useEffect } from 'react';
import Image from 'next/image';

const DEFAULT_PROFILE_IMAGE = '/default-profile.jpg'; // 기본 프로필 이미지 경로

export default function ProfileEditModal({ isOpen, onClose, onSubmit, currentNickname, currentProfileImage }) {
    const [nickname, setNickname] = useState(currentNickname);
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(currentProfileImage || DEFAULT_PROFILE_IMAGE);

    useEffect(() => {
        if (isOpen) {
            setNickname(currentNickname);
            setPreviewImage(currentProfileImage || DEFAULT_PROFILE_IMAGE);
            setProfileImage(null);
        }
    }, [isOpen, currentNickname, currentProfileImage]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setProfileImage(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        onSubmit(nickname, profileImage);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">프로필 수정</h2>
                <div className="mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-2">
                        <Image
                            src={previewImage}
                            alt="Profile Preview"
                            width={128}
                            height={128}
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <input type="file" onChange={handleImageChange} accept="image/*" className="mb-2" />
                </div>
                <div className="mb-4">
                    <label className="block mb-2">닉네임:</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="flex justify-end">
                    <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded">취소</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded">수정</button>
                </div>
            </div>
        </div>
    );
}
