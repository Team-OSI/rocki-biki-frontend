import { useEffect, useRef, useState } from 'react';
import useSocketStore from '@/store/socketStore';

const useWebRTCConnection = (roomId, localVideoRef, remoteVideoRef, onDataReceived, getLandmarks) => {
    const socket = useSocketStore(state => state.socket);
    const emitOffer = useSocketStore(state => state.emitOffer);
    const emitAnswer = useSocketStore(state => state.emitAnswer);
    const emitCandidate = useSocketStore(state => state.emitCandidate);

    const [connectionState, setConnectionState] = useState('disconnected');
    const peerConnection = useRef();
    const localStream = useRef();
    const dataChannel = useRef();
    const intervalId = useRef();

    useEffect(() => {
        if (!socket || !roomId) return;

        const initializeMedia = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    localStream.current = stream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                    await startCall();
                } catch (error) {
                    console.error('Error accessing media devices.', error);
                    setConnectionState('error');
                }
            } else {
                console.error('getUserMedia not supported on this browser!');
                setConnectionState('error');
            }
        };

        initializeMedia();

        const onOffer = (data) => {
            handleOffer(data.offer);
        };

        const onAnswer = (data) => {
            handleAnswer(data.answer);
        };

        const onCandidate = (data) => {
            handleCandidate(data.candidate);
        };

        const onUserLeft = (data) => {
            console.log(`User ${data.userId} left the room`);
        };

        socket.on('offer', onOffer);
        socket.on('answer', onAnswer);
        socket.on('candidate', onCandidate);
        socket.on('user_left', onUserLeft);

        return () => {
            socket.emit('leave room');
            socket.off('offer', onOffer);
            socket.off('answer', onAnswer);
            socket.off('candidate', onCandidate);
            socket.off('user_left', onUserLeft);
            if (intervalId.current) {
                clearInterval(intervalId.current);
            }
        };
    }, [socket, roomId]);

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', pc.iceConnectionState);
        };

        pc.onsignalingstatechange = () => {
            console.log('Signaling state:', pc.signalingState);
        };

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
                setConnectionState('connected');
            };
            channel.onmessage = (event) => {
                const receivedData = JSON.parse(event.data);
                onDataReceived(receivedData);
            };
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                emitCandidate(event.candidate, roomId);
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setConnectionState('connected');
            }
        };

        return pc;
    };

    const handleOffer = async (offer) => {
        if (!peerConnection.current) {
            peerConnection.current = createPeerConnection();
        }
        try {
            if (peerConnection.current.signalingState !== 'stable') {
                await Promise.all([
                    peerConnection.current.setLocalDescription({type: "rollback"}),
                    peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer))
                ]);
            } else {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            }
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            emitAnswer(answer, roomId);
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    };

    const handleAnswer = async (answer) => {
        if (!peerConnection.current) {
            console.error('PeerConnection not initialized.');
            return;
        }
        try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    };

    const handleCandidate = async (candidate) => {
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

    const startCall = async () => {
        if (!peerConnection.current) {
            peerConnection.current = createPeerConnection();
        }
        const stream = localStream.current;
        if (stream) {
            stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));
            try {
                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);
                emitOffer(offer, roomId);
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
    }, 1000 / 20);
  };

    return connectionState;
};

export default useWebRTCConnection;
