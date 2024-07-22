import { create } from 'zustand';
const SHARED_BUFFER_SIZE = 10 * 1024 * 1024;

const useWorkerStore = create((set, get) => {
    let initializationPromise = null;

    return {
        worker: null,
        isInitialized: false,
        sharedBuffer: null,
        sharedArray: null,
        videoBuffer: null,
        videoArray: null,

        initWorker: (videoWidth, videoHeight) => {
            if (typeof window === 'undefined') return;
            if (initializationPromise) return initializationPromise;

            initializationPromise = new Promise(async (resolve, reject) => {
                try {
                    const MotionWorker = (await import('../app/workers/motionWorker.worker.js')).default;
                    const worker = new MotionWorker();

                    // 랜드마크 데이터 공유 버퍼
                    const sharedBuffer = new SharedArrayBuffer(SHARED_BUFFER_SIZE);
                    const sharedArray = new Float32Array(sharedBuffer);

                    // 비디오 프레임 데이터 공유 버퍼
                    const videoBuffer = new SharedArrayBuffer(videoWidth * videoHeight * 4);
                    const videoArray = new Uint8ClampedArray(videoBuffer);

                    worker.postMessage({
                        type: 'INIT',
                        sharedBuffer: sharedBuffer,
                        videoBuffer: videoBuffer,
                        width: videoWidth,  // 비디오 너비
                        height: videoHeight // 비디오 높이
                    });

                    worker.onmessage = (e) => {
                        if (e.data.type === 'INIT_COMPLETE') {
                            set({
                                isInitialized: true,
                                worker: worker,
                                sharedBuffer,
                                sharedArray,
                                videoBuffer,
                                videoArray
                            });
                            resolve();
                        }
                    };
                } catch (error) {
                    console.error('Error during worker initialization:', error);
                    reject(error);
                }
            });
            return initializationPromise;
        },

        terminateWorker: () => {
            const { worker } = get();
            if (worker) {
                worker.terminate();
                set({ worker: null, isInitialized: false, sharedBuffer: null, sharedArray: null, videoBuffer: null, videoArray: null });
            }
            initializationPromise = null;
        },

        setWorkerMessageHandler: (handler) => {
            const { worker } = get();
            if (worker) {
                worker.onmessage = handler;
            }
        },
    };
});

export default useWorkerStore;