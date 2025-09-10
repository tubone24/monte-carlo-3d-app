import { SimulationStats, SimulationState } from '../types';
export declare class UIManager {
    private elements;
    private onStart;
    private onPause;
    private onReset;
    private onBatchSizeChange;
    constructor(onStart: () => void, onPause: () => void, onReset: () => void, onBatchSizeChange: (batchSize: number) => void);
    private getUIElements;
    private setupEventListeners;
    updateStats(stats: SimulationStats): void;
    updateButtonStates(state: SimulationState): void;
    showMessage(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
    getBatchSizeValue(): number;
    animateStats(time: number): void;
    private setupModalSystem;
    private openModal;
    private getParameterInfo;
    dispose(): void;
}
//# sourceMappingURL=UIManager.d.ts.map