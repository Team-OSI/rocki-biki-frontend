import React, { createContext, useContext, useRef, useEffect, useState } from 'react';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState('main');
  const mainBgm = useRef(null);
  const gameBgm = useRef(null);
  const readyBgm = useRef(null);

  useEffect(() => {
    mainBgm.current = new Audio('/sounds/main_bgm.MP3');
    gameBgm.current = new Audio('/sounds/game_bgm.MP3');
    readyBgm.current = new Audio('/sounds/ready_bgm.MP3');
    mainBgm.current.loop = true;
    gameBgm.current.loop = true;
    readyBgm.current.loop = true;

    playCurrentTrack();

    return () => {
      pauseAllTracks();
    };
  }, [currentTrack]);

  const playCurrentTrack = () => {
    pauseAllTracks();
    if (currentTrack === 'main' && mainBgm.current) {
      mainBgm.current.play();
    } else if (currentTrack === 'game' && gameBgm.current) {
      gameBgm.current.play();
    } else if (currentTrack === 'ready' && readyBgm.current) {
      readyBgm.current.play();
    }
  };

  const pauseAllTracks = () => {
    if (mainBgm.current) mainBgm.current.pause();
    if (gameBgm.current) gameBgm.current.pause();
    if (readyBgm.current) readyBgm.current.pause();
  };

  const setVolume = (volume) => {
    if (mainBgm.current) mainBgm.current.volume = volume;
    if (gameBgm.current) gameBgm.current.volume = volume;
    if (readyBgm.current) readyBgm.current.volume = volume;
  };

  const playMainBgm = () => {
    setCurrentTrack('main');
    setVolume(1.0); // 메인 BGM 볼륨 설정
  };

  const playGameBgm = () => {
    setCurrentTrack('game');
    setVolume(0.5); // 게임 BGM 볼륨 설정
  };

  const playReadyBgm = () => {
    setCurrentTrack('ready');
    setVolume(0.17); // 레디 BGM 볼륨 설정
  };

  return (
    <MusicContext.Provider value={{ setVolume, playMainBgm, playGameBgm, playReadyBgm }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
