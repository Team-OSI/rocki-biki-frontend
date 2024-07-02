import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const useWebRTC = (roomId, localVideoRef, remoteVideoRef) => {
  const [socket, setSocket] = useState(null);
  const peerConnection = useRef();
  const localStream = useRef();

  useEffect(() => {
    const newSocket = io('http://localhost:7777');
    setSocket(newSocket);

    newSocket.emit('JOIN_ROOM', roomId);

    newSocket.on('offer', (data) => handleOffer(data, newSocket));
    newSocket.on('answer', (data) => handleAnswer(data, newSocket));
    newSocket.on('candidate', (data) => handleCandidate(data, newSocket));

    newSocket.on('connect', () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            localStream.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
            startCall(newSocket); // 소켓이 초기화된 후에 startCall 호출
          })
          .catch(error => {
            console.error('Error accessing media devices.', error);
          });
      } else {
        console.error('getUserMedia not supported on this browser!');
      }
    });

    return () => {
      newSocket.close();
    };
  }, [roomId]);

  const createPeerConnection = (socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (socket) {
          socket.emit('candidate', { candidate: event.candidate, roomId });
        } else {
          console.error('Socket is not initialized');
        }
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const handleOffer = async (offer, socket) => {
    if (!peerConnection.current) {
      peerConnection.current = createPeerConnection(socket);
    }
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    if (socket) {
      socket.emit('answer', { type: answer.type, sdp: answer.sdp, roomId });
    } else {
      console.error('Socket is not initialized');
    }
  };

  const handleAnswer = async (answer, socket) => {
    if (peerConnection.current.signalingState === 'have-local-offer') {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleCandidate = async (candidate, socket) => {
    try {
      if (candidate && candidate.candidate) {
        const iceCandidate = new RTCIceCandidate(candidate.candidate);
        if (iceCandidate.sdpMid && iceCandidate.sdpMLineIndex !== null) {
          await peerConnection.current.addIceCandidate(iceCandidate);
        } else {
          console.error('Received ICE candidate with null values for sdpMid or sdpMLineIndex', candidate);
        }
      }
    } catch (error) {
      console.error('Error adding received ice candidate', error);
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
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      if (socket) {
        socket.emit('offer', { type: offer.type, sdp: offer.sdp, roomId });
      } else {
        console.error('Socket is not initialized');
      }
    }
  };

  return { socket, localStream, peerConnection };
};

export default useWebRTC;
