export function parseLandmarks(result) {
    let index = 0;
    const landmarks = {};
    const poseLandmarks = {};

    // landmarks 파싱
    if (result[0]) {
        const keys = ['head', 'leftHand', 'rightHand'];
        keys.forEach(key => {
            const position = [result[index++], result[index++], result[index++]];
            let rotation;
            if (key === 'head') {
                rotation = [result[index++], result[index++], result[index++]];
            } else {
                rotation = [result[index++], result[index++]];
            }
            const state = result[index++];
            landmarks[key] = [position, rotation, state];
        });
    }

    // poseLandmarks 파싱
    if (result[index++]) {
        const keys = ['nose', 'rightEye', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftIndex', 'rightIndex'];
        keys.forEach(key => {
            poseLandmarks[key] = {
                x: result[index++],
                y: result[index++],
                z: result[index++]
            };
        });
    }

    return { landmarks, poseLandmarks };
}