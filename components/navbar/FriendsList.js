import React, { useState } from 'react';
import Link from 'next/link';
import { UserPlus, UserMinus, MessageCircle, UserX } from 'lucide-react';

const FriendStatus = {
    MUTUAL: 'MUTUAL',
    PENDING: 'PENDING',
    REQUEST: 'REQUEST'
};

const FriendsList = ({ following, follower, onClose, onAcceptRequest, onCancelFollow, onMessage }) => {
    const [activeTab, setActiveTab] = useState('all');

    const getFriendStatus = (friend) => {
        const isFollowing = following.some(f => f.email === friend.email);
        const isFollower = follower.some(f => f.email === friend.email);

        if (isFollowing && isFollower) return FriendStatus.MUTUAL;
        if (isFollowing) return FriendStatus.PENDING;
        return FriendStatus.REQUEST;
    };

    const allFriends = [...new Set([...following, ...follower])];

    const filteredFriends = allFriends.filter(friend => {
        const status = getFriendStatus(friend);
        if (activeTab === 'all') return status === FriendStatus.MUTUAL;
        if (activeTab === 'online') return friend.online && status === FriendStatus.MUTUAL;
        if (activeTab === 'pending') return status === FriendStatus.PENDING;
        if (activeTab === 'requests') return status === FriendStatus.REQUEST;
        return false;
    });

    const encodeEmail = (email) => {
        return email.replace('@', '%40');
    };

    return (
        <div className="fixed top-16 left-0 w-80 h-auto max-h-[calc(100vh-4rem)] bg-gray-900 text-white shadow-lg overflow-hidden rounded-br-lg flex flex-col z-[100]">
            <div className="p-4 bg-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold">Friends</h2>
                <button onClick={onClose} className="text-gray-300 hover:text-white focus:outline-none">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div className="flex bg-gray-700">
                {['all', 'online', 'pending', 'requests'].map((tab) => (
                    <button
                        key={tab}
                        className={`flex-1 py-2 px-4 ${activeTab === tab ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>
            <div className="overflow-y-auto flex-grow">
                {filteredFriends.map((friend, index) => {
                    const status = getFriendStatus(friend);
                    return (
                        <div key={index} className="p-4 hover:bg-gray-800 flex items-center justify-between">
                            <Link href={`/myPage/${encodeEmail(friend.email)}`} className="flex items-center space-x-3 flex-grow">
                                <img src={friend.profileImage} alt={friend.nickname} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-semibold text-gray-300 hover:text-white">{friend.nickname}</p>
                                    <p className="text-sm text-gray-400">
                                        {status === FriendStatus.MUTUAL ? 'Friend' :
                                            status === FriendStatus.PENDING ? 'Pending' : 'Request'}
                                    </p>
                                </div>
                            </Link>
                            <div className="flex space-x-2">
                                {status === FriendStatus.MUTUAL && (
                                    <>
                                        <button onClick={() => onMessage(friend)} className="p-1 hover:bg-gray-700 rounded">
                                            <MessageCircle size={20} />
                                        </button>
                                        <button onClick={() => onCancelFollow(friend)} className="p-1 hover:bg-gray-700 rounded">
                                            <UserX size={20} />
                                        </button>
                                    </>
                                )}
                                {status === FriendStatus.PENDING && (
                                    <button onClick={() => onCancelFollow(friend)} className="p-1 hover:bg-gray-700 rounded">
                                        <UserMinus size={20} />
                                    </button>
                                )}
                                {status === FriendStatus.REQUEST && (
                                    <button onClick={() => onAcceptRequest(friend)} className="p-1 hover:bg-gray-700 rounded">
                                        <UserPlus size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FriendsList;

