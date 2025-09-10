import * as THREE from 'three';
export declare class BlackboardDisplay {
    private scene;
    private textTexture;
    private canvas;
    private ctx;
    private textMaterial;
    private piValue;
    private lastUpdateTime;
    private updateInterval;
    constructor(scene: THREE.Scene);
    private createChalkTexture;
    updatePiValue(piValue: number, currentTime: number): void;
    private drawChalkText;
    private addChalkNoise;
    private drawPiEquation;
    private addTextNoise;
    dispose(): void;
}
//# sourceMappingURL=BlackboardDisplay.d.ts.map