'use client'
import { useEffect, useRef } from 'react'
import * as cam from '@mediapipe/camera_utils'
import {
    createHolistic,
    initializeHolistic,
    processHandLandmarks,
    isHandMovementValid
} from '@/lib/mediapipe/holistic'

export function useMotionCapture(localVideoRef, setLandmarks) {
    const holisticRef = useRef(null)
    const previousLandmarks = useRef({leftHand: null, rightHand: null})

    useEffect(() => {
        let isMounted = true

        const initHolistic = async () => {
            holisticRef.current = createHolistic()
            await initializeHolistic(holisticRef.current)

            holisticRef.current.onResults((results) => {
                if (isMounted) {
                    // console.log("left=>",results.leftHandLandmarks)
                    // console.log("rigth=>",results.rightHandLandmarks)
                    // console.log("face=>",results.faceLandmarks)
                    const newLandmarks = {
                        nose: results.faceLandmarks ? results.faceLandmarks[4] : null,
                        leftEye: results.faceLandmarks ? results.faceLandmarks[33] : null,
                        rightEye: results.faceLandmarks ? results.faceLandmarks[263] : null,
                        leftHand: processHandLandmarks(results.leftHandLandmarks, 'leftHand', previousLandmarks),
                        rightHand: processHandLandmarks(results.rightHandLandmarks, 'rightHand', previousLandmarks)
                    }

                    setLandmarks(newLandmarks)
                    previousLandmarks.current = {
                        leftHand: newLandmarks.leftHand,
                        rightHand: newLandmarks.rightHand
                    }
                }
            })

            if (localVideoRef.current) {
                const camera = new cam.Camera(localVideoRef.current, {
                    onFrame: async () => {
                        if (isMounted && holisticRef.current) {
                            await holisticRef.current.send({ image: localVideoRef.current })
                        }
                    },
                    width: 640,
                    height: 480
                })

                camera.start().catch((error) => {
                    console.error('Failed to start camera:', error)
                })
            }
        }

        initHolistic()

        return () => {
            isMounted = false
            if (holisticRef.current) {
                holisticRef.current.close()
            }
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                const tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            }
        }
    }, [localVideoRef, setLandmarks])
}