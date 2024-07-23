import React, { useState, useEffect } from 'react';
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export default function Tutorial({ isVisible, onClose }) {
    const [animationClass, setAnimationClass] = useState('translate-y-full');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (isVisible) {
            setTimeout(() => setAnimationClass('translate-y-0'), 50);
        } else {
            setAnimationClass('translate-y-full');
        }
    }, [isVisible]);

    const tutorialContent = [
        {
            type: 'text-image',
            text: [
                <>
                    <span className="text-xl text-[#1ba5e0]">Rocki Biki</span>에 오신 것을 환영합니다! ♡⁺◟(●˙▾˙●)◞⁺♡<br></br>
                </>,
                <>
                    📷 모션 인식 기반의 복싱 게임을 즐기기 위해 <span className="text-xl text-[#1ba5e0]">카메라 및 마이크 권한</span>을 허용해 주세요.<br></br>
                </>,
                <>
                    🙆🏻‍♀️ 원활한 게임 진행을 위해 카메라에는 <span className="text-xl text-[#1ba5e0]">플레이어 한 명</span>만 나오도록 해주세요.<br></br>
                </>,
                <>
                    🍀 최적의 인식을 위해 <span className="text-xl text-[#1ba5e0]">상반신</span>이 화면에 잘 보이도록 카메라를 조정해 주세요.<br></br>
                </>,
            ],
            image: "/images/tutorial/tutorial1.jpg"
        },
        {
            type: 'skills',
            text: [
                <>
                    Rocki Biki에는 <span className="text-blue-600">방어</span>, <span className="text-green-600">회복</span>, <span className="text-red-600">공격</span> 세 가지 필살기가 있습니다.
                    <br></br></>,
                <>
                    특정 포즈를 취하고 화면에 나타나는 대사를 읽으면 <span className="text-xl text-[#1ba5e0]">음성 유사도</span>에 따라 스킬 효과가 발동됩니다.
                </>
            ],
            images: [
                { src: "/images/tutorial/shield.jpg", caption: <span className="text-xl text-blue-600 ">방어 스킬</span> },
                { src: "/images/tutorial/heal.jpg", caption: <span className="text-xl text-green-600">회복 스킬</span> },
                { src: "/images/tutorial/attack.jpg", caption: <span className="text-xl text-red-600">공격 스킬</span> }
            ]
        },
        {
            type: 'text-image',
            text: [
                <>
                    마이페이지에서 <span className="text-xl text-[#1ba5e0]">상대방의 피격음</span>을 직접 녹음할 수 있어요.<br></br>
                </>,
                <>
                    나만의 독특한 효과음으로 게임의 재미를 더해보세요! 💥<br></br>
                </>,
            ],
            image: "/images/tutorial/tutorial3.jpg"
        }
    ];

    const nextPage = () => {
        if (currentPage < 3) setCurrentPage(currentPage + 1);
    };

    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    return (
        <div
            className={`absolute inset-x-0 bottom-0 h-full bg-[#DAF7A6] rounded-lg shadow-lg transition-all duration-300 ease-in-out transform ${animationClass}`}>
            <h2 className="text-gray-800 text-3xl text-center font-bold mb-4 mt-4">Welcome to Rocki Biki!!</h2>
            <div className="px-6 pb-6 pt-2 h-[calc(100%-8rem)]">
                <div className="bg-white rounded-lg shadow-inner justify-center p-2 h-full flex flex-col">
                    {tutorialContent[currentPage - 1].type === 'skills' ? (
                        <>
                            <div className="mb-2 text-lg text-neutral-600 font-normal">
                                {tutorialContent[currentPage - 1].text}
                            </div>
                            <div className="flex justify-around items-center flex-grow">
                                {tutorialContent[currentPage - 1].images.map((image, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <img
                                            src={image.src}
                                            alt={typeof image.caption === 'string' ? image.caption : 'Skill image'}
                                            className="w-48 h-48 object-contain mb-2"
                                        />
                                        <p className="text-center text-lg">{image.caption}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center">
                            <div className="w-2/5 pr-1 flex items-center justify-center">
                                <img
                                    src={tutorialContent[currentPage - 1].image}
                                    alt={`Tutorial image ${currentPage}`}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                            <div className="w-3/5 pl-1 flex items-center">
                                <ol className="list-none pl-0 counter-reset-tutorial text-neutral-600 text-lg font-thin">
                                    {Array.isArray(tutorialContent[currentPage - 1].text) ?
                                        tutorialContent[currentPage - 1].text.map((content, index) => (
                                            <li key={index} className="mb-2 pl-4 relative counter-increment-tutorial text-lg">
                                                {content}
                                            </li>
                                        ))
                                        :
                                        <li className="mb-2 pl-4 relative counter-increment-tutorial text-lg">
                                            {tutorialContent[currentPage - 1].text}
                                        </li>
                                    }
                                </ol>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center px-6 py-2">
                <button onClick={prevPage} disabled={currentPage === 1}
                        className="text-white disabled:text-gray-400 focus:outline-none glow-effect">
                    <FontAwesomeIcon icon={faChevronLeft} size="2x"/>
                </button>
                <span>{currentPage} / 3</span>
                <button onClick={nextPage} disabled={currentPage === 3}
                        className="text-white disabled:text-gray-400 focus:outline-none glow-effect">
                    <FontAwesomeIcon icon={faChevronRight} size="2x"/>
                </button>
            </div>
        </div>
    );
}