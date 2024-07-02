import { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const useWebRTCConnection = (onDataReceived, getLandmarks, remoteVideoRef, roomId) => {
  const peerConnection = useRef();
  const socket = useRef();
  const localStream = useRef();
  const dataChannel = useRef();
  const intervalId = useRef();

  const [connectionState, setConnectionsState] = useState('disconnected')

  useEffect(() => {
    socket.current = io('http://localhost:7777');

    socket.current.emit('join room', roomId);

    socket.current.on('offer', handleOffer);
    socket.current.on('answer', handleAnswer);
    socket.current.on('candidate', handleCandidate);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          localStream.current = stream;
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

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit('candidate', { roomId, candidate: event.candidate});
      }
    };

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
    socket.current.emit('answer', {roomId,answer});
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

export default useWebRTCConnection;