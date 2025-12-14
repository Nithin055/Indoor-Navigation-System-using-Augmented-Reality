/**
 * A simple 1D Kalman Filter implementation.
 * Used for smoothing noisy sensor data like accelerometer magnitude or compass heading.
 */
export class KalmanFilter {
    private R: number; 
    private Q: number; 
    private A: number; 
    private B: number; 
    private C: number; 

    private cov: number; // Estimate covariance
    private x: number; // Estimated signals

    /**
     * @param R Process noise. Adjust to tune responsiveness vs smoothness.
     * @param Q Measurement noise. Adjust based on sensor quality.
     * @param A State vector.
     * @param B Control input.
     * @param C Measurement vector.
     */
    constructor(R: number = 1, Q: number = 1, A: number = 1, B: number = 0, C: number = 1) {
        this.R = R;
        this.Q = Q;
        this.A = A;
        this.B = B;
        this.C = C;

        this.cov = NaN;
        this.x = NaN; // Initial state
    }

    /**
     * Filters a measurement.
     * @param measurement The raw value from the sensor.
     * @param u Control input (optional).
     * @returns The filtered value.
     */
    filter(measurement: number, u: number = 0): number {
        if (isNaN(this.x)) {
            this.x = (1 / this.C) * measurement;
            this.cov = (1 / this.C) * this.Q * (1 / this.C);
        } else {
            // Prediction phase
            const predX = (this.A * this.x) + (this.B * u);
            const predCov = ((this.A * this.cov) * this.A) + this.R;

            // Correction phase
            const K = predCov * this.C * (1 / ((this.C * predCov * this.C) + this.Q));
            this.x = predX + K * (measurement - (this.C * predX));
            this.cov = predCov - (K * this.C * predCov);
        }

        return this.x;
    }

    /**
     * Returns the last filtered value.
     */
    lastMeasurement(): number {
        return this.x;
    }

    /**
     * Resets the filter state.
     */
    reset() {
        this.x = NaN;
        this.cov = NaN;
    }
}
