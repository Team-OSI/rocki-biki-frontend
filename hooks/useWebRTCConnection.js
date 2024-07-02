import { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useWebRTCConnection = (onDataReceived, getLandmarks, remoteVideoRef, roomId) => {
  const peerConnection = useRef();
  const socket = useRef();
  const localStream = useRef();
  const dataChannel = useRef();
  const intervalId = useRef();

  const [connectionState, setConnectionsState] = useState('disconnected')

  useEffect(() => {
    socket.current = io('http://localhost:7777');
    socket.current.emit('join room', roomId);

    socket.current.on('offer', (data) => handleOffer(data.offer));
    socket.current.on('answer', (data) => handleAnswer(data.answer));
    socket.current.on('candidate', (data) => handleCandidate(data.candidate));

    // 미디어 스트림 얻기
    // navigator : window.navigator 읽기 전용 속성으로 접근할 수 있다.
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          // 스트림을 가져온다.
          localStream.current = stream;
          // RTCPeerConnection 생성
          startCall();
        })
        .catch(error => {
          console.error('Error accessing media devices.', error);
          setConnectionsState('error');
        });
    } else {
      console.error('getUserMedia not supported on this browser!');
      setConnectionsState('error');
    }
    return () => {
      socket.current.disconnect();
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [roomId]);

  const createPeerConnection = () => {
    // peerConnection 객체생성
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    dataChannel.current = pc.createDataChannel('dataChannel');
    dataChannel.current.onopen = startSendingData;
    dataChannel.current.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      onDataReceived(receivedData);
    };

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onopen = () => {
        console.log('Data channel opened:', channel);
        setConnectionsState('connected')
      };
      channel.onmessage = (event) => {
        const receivedData = JSON.parse(event.data);
        onDataReceived(receivedData);
      };
    };
    // ICE candidate 처리
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // candidate를 시그널링 서버를 통해 상대방에게 전송
        socket.current.emit('candidate', { roomId, candidate: event.candidate});
      }
    };
    // 원격 스트림 처리
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionsState('connected')
      }
    };

    return pc;
  };

  const handleOffer = async (offer) => {
    if (!peerConnection.current) {
      peerConnection.current = createPeerConnection();
    }
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    socket.current.emit('answer', {roomId, answer});
  };

  const handleAnswer = async (answer) => {
    if (peerConnection.current.signalingState === 'have-local-offer') {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleCandidate = async (candidate) => {
    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding received ice candidate', error);
    }
  };

  const startCall = async () => {
    peerConnection.current = createPeerConnection();
    const stream = localStream.current;
    if (stream) {
      stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.current.emit('offer', {roomId, offer});
    }
  };

  const startSendingData = () => {
    intervalId.current = setInterval(() => {
      if (dataChannel.current && dataChannel.current.readyState === 'open') {
        const landmarks = getLandmarks();
        if (landmarks) {
          const message = {
            type: 'pose',
            timestamp: new Date().toISOString(),
            pose: landmarks
          };
          dataChannel.current.send(JSON.stringify(message));
        }
      }
    }, 1000 / 30);
  };
  return { connectionState, remoteVideoRef}
};