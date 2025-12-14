import { Accelerometer } from 'expo-sensors';
import { KalmanFilter } from '../utils/KalmanFilter';

type StepCallback = (stepCount: number) => void;

class StepService {
    private subscription: any = null;
    private listeners: StepCallback[] = [];
    private stepCount: number = 0;

    // Filter for smoothing accelerometer magnitude
    // process noise = 0.01 (relatively smooth process)
    // measurement noise = 0.1 (typical accelerometer noise)
    private filter: KalmanFilter = new KalmanFilter(0.01, 0.1);

    private lastStepTime: number = 0;

    private isStepHigh = false;

    // Thresholds for step detection
    // Adjusted for high sensitivity
    private readonly STEP_THRESHOLD = 1.05;
    private readonly MIN_STEP_INTERVAL = 250;

    constructor() {
        this.lastStepTime = Date.now();
    }

    start() {
        if (this.subscription) return;

        this.stepCount = 0;
        this.filter.reset();
        Accelerometer.setUpdateInterval(30); // Faster sampling (~33Hz) for better peak detection

        this.subscription = Accelerometer.addListener(({ x, y, z }) => {
            // Calculate raw magnitude
            const rawMagnitude = Math.sqrt(x * x + y * y + z * z);

            // Apply Kalman filter
            const smoothedMagnitude = this.filter.filter(rawMagnitude);

            this.detectStep(smoothedMagnitude);
        });
    }

    stop() {
        if (this.subscription) {
            this.subscription.remove();
            this.subscription = null;
        }
    }

    reset() {
        this.stepCount = 0;
        this.filter.reset();
    }

    private detectStep(magnitude: number) {
        const now = Date.now();

        // Simple peak detection with hysteresis
        // Assuming 1.0 is gravity (stationary)
        // Moving up causes > 1.0, down causes < 1.0

        if (!this.isStepHigh && magnitude > this.STEP_THRESHOLD) {
            this.isStepHigh = true;
        }
        else if (this.isStepHigh && magnitude < this.STEP_THRESHOLD) {
            // Peak passed, check timing
            if (now - this.lastStepTime > this.MIN_STEP_INTERVAL) {
                this.stepCount++;
                this.lastStepTime = now;
                this.notifyListeners();
            }
            this.isStepHigh = false;
        }
    }

    subscribe(callback: StepCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(cb => cb(this.stepCount));
    }
}

export default new StepService();
