import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// WebRTC 연결을 설정하는 커스텀 훅
const useWebRTCConnection = (roomId, localVideoRef, remoteVideoRef, onDataReceived, getLandmarks) => {
  const [socket, setSocket] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const peerConnection = useRef();
  const localStream = useRef();
  const dataChannel = useRef();
  const intervalId = useRef();

  useEffect(() => {
    // const newSocket = io('http://localhost:7777');
    const newSocket = io('//rocki-biki.com:4000');
    setSocket(newSocket);

    newSocket.emit('join room', roomId);

    newSocket.on('offer', (data) => {
      handleOffer(data.offer, newSocket);
    });
    newSocket.on('answer', (data) => {
      handleAnswer(data.answer, newSocket);
    });
    newSocket.on('candidate', (data) => {
      handleCandidate(data.candidate, newSocket);
    });

    newSocket.on('connect', () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            localStream.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
            startCall(newSocket);
          })
          .catch(error => {
            setConnectionState('error');
          });
      } else {
        setConnectionState('error');
      }
    });

    return () => {
      newSocket.close();
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [roomId]);

  const createPeerConnection = (socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    dataChannel.current = pc.createDataChannel('dataChannel');
    dataChannel.current.onopen = () => {
      startSendingData();
    };
    dataChannel.current.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      onDataReceived(receivedData);
    };

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onopen = () => {
        setConnectionState('connected');
      };
      channel.onmessage = (event) => {
        const receivedData = JSON.parse(event.data);
        onDataReceived(receivedData);
      };
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', { candidate: event.candidate, roomId });
      }
    };

    pc.ontrack = (event) => {;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionState('connected');
      }
    };

    return pc;
  };

  const handleOffer = async (offer, socket) => {
    if (!peerConnection.current) {
      peerConnection.current = createPeerConnection(socket);
    }
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer', { type: answer.type, sdp: answer.sdp, roomId });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer, socket) => {
    if (!peerConnection.current) {
      console.error('PeerConnection not initialized.');
      return;
    }
    try {
      if (peerConnection.current.signalingState === 'have-local-offer') {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleCandidate = async (candidate, socket) => {
    if (!peerConnection.current) {
      console.error('PeerConnection not initialized.');
      return;
    }
    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding received ice candidate:', error);
    }
  };

  const startCall = async (socket) => {
    if (!peerConnection.current) {
      peerConnection.current = createPeerConnection(socket);
    }
    const stream = localStream.current;
    if (stream) {
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });
      try {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit('offer', { type: offer.type, sdp: offer.sdp, roomId });
      } catch (error) {
        console.error('Error starting call:', error);
      }
    }
  };

  const startSendingData = () => {
    intervalId.current = setInterval(() => {
      if (dataChannel.current && dataChannel.current.readyState === 'open') {
        const landmarks = getLandmarks();
        if (landmarks) {
          const message = {
            type: 'pose',
            pose: landmarks
          };
          dataChannel.current.send(JSON.stringify(message));
        }
      }
    }, 1000 / 30); // 30 FPS
  };

  return { socket, localStream, peerConnection, connectionState };
};

export default useWebRTCConnection;