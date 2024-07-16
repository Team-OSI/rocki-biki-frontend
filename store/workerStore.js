import { create } from 'zustand';
const SHARED_BUFFER_SIZE = 1024 * 1024;

const useWorkerStore = create((set, get) => {
    let initializationPromise = null;

    return {
        worker: null,
        isInitialized: false,
        sharedBuffer: null,
        sharedArray: null,

        initWorker: (videoWidth, videoHeight) => {
            if (typeof window === 'undefined') return;
            if (initializationPromise) return initializationPromise;

            initializationPromise = new Promise(async (resolve, reject) => {
                try {
                    const MotionWorker = (await import('../workers/motionWorker.worker.js')).default;
                    const worker = new MotionWorker();
                    const SHARED_BUFFER_SIZE = videoWidth * videoHeight; // 여유있게 2배로 설정

                    const sharedBuffer = new SharedArrayBuffer(SHARED_BUFFER_SIZE);
                    const sharedArray = new Float32Array(sharedBuffer);

                    worker.postMessage({
                        type: 'INIT',
                        sharedBuffer: sharedBuffer,
                        width: videoWidth,  // 비디오 너비
                        height: videoHeight // 비디오 높이
                    });

                    worker.onmessage = (e) => {
                        if (e.data.type === 'INIT_COMPLETE') {
                            set({ isInitialized: true, worker: worker, sharedBuffer, sharedArray });
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
                set({ worker: null, isInitialized: false, sharedBuffer: null, sharedArray: null });
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