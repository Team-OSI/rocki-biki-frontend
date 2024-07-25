import React from 'react';
import Image from 'next/image';
import { videoContainerStyle, videoStyle, overlayStyle, nicknameStyle } from './VideoStyles';
import VideoProcessor from "@/components/video/VideoProcessor";

const VideoComponent = ({
                            isLocal,
                            isOpponentUsingSkill,
                            gameStatus,
                            ready,
                            nickname,
                            videoRef,
                            connectionState,
                            handleLandmarksUpdate
                        }) => {
    return (
        <div style={videoContainerStyle(isLocal, isOpponentUsingSkill, gameStatus)}>
            <div className="relative w-full h-full">
                {isLocal ? (
                    <VideoProcessor
                        ref={videoRef}
                        onLandmarksUpdate={handleLandmarksUpdate}
                        style={videoStyle}
                        gameStatus={gameStatus}
                    />
                ) : (
                    <>
                        {connectionState !== 'connected' && (
                            <div
                                className="bg-slate-400 mt-5 opacity-80 flex items-center justify-center text-white"
                                style={videoStyle}
                            >
                                연결 대기 중...
                            </div>
                        )}
                        <video
                            className={`scale-x-[-1] opacity-80 mt-5 transition-transform ${
                                (ready && !['playing', 'finished', 'skillTime'].includes(gameStatus)) ? 'ring-green-400 ring-8' : ''
                            }`}
                            ref={videoRef}
                            style={videoStyle}
                            autoPlay
                            playsInline
                        />
                    </>
                )}
                {!ready && (
                    <Image
                        src="/images/ready_pose.webp"
                        alt="Ready Pose"
                        layout="fill"
                        objectFit="cover"
                        style={overlayStyle}
                    />
                )}
                {(ready && (gameStatus === 'waiting' || gameStatus === 'bothReady')) && (
                    <img src="/images/ready_logo.png" className="absolute top-[-124px] right-0 transform -translate-x-1/2 w-1/2 h-auto" alt="Ready Logo" />
                )}
                <div style={nicknameStyle}>{nickname}</div>
            </div>
        </div>
    );
};

export default VideoComponent;
