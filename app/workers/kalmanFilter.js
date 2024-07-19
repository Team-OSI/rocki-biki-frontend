class KalmanFilter {
    constructor(processNoise = 0.01, measurementNoise = 1, estimateError = 1) {
        this.processNoise = processNoise;
        this.measurementNoise = measurementNoise;
        this.estimateError = estimateError;
        this.estimate = null;
    }

    update(measurement) {
        if (this.estimate === null) {
            this.estimate = measurement;
            return measurement;
        }

        // Prediction
        let predictedEstimate = this.estimate;
        let predictedEstimateError = this.estimateError + this.processNoise;

        // Update
        let kalmanGain = predictedEstimateError / (predictedEstimateError + this.measurementNoise);
        this.estimate = predictedEstimate + kalmanGain * (measurement - predictedEstimate);
        this.estimateError = (1 - kalmanGain) * predictedEstimateError;

        return this.estimate;
    }
}

// 2D 포인트를 위한 칼만 필터
export class KalmanFilter2D {
    constructor() {
        this.filterX = new KalmanFilter();
        this.filterY = new KalmanFilter();
    }

    update(point) {
        return {
            x: this.filterX.update(point.x),
            y: this.filterY.update(point.y)
        };
    }
}
