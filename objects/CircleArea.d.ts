import * as THREE from 'three';
export declare class CircleArea {
    private scene;
    private radius;
    private centerX;
    private centerZ;
    private floorLevel;
    private circleOutline;
    private objects;
    constructor(scene: THREE.Scene, radius?: number, floorLevel?: number);
    private createMonteCarloArea;
    private createCircleOutline;
    private createSquareOutline;
    private createAxisLabels;
    private createTextLabels;
    isPointInCircle(x: number, z: number): boolean;
    getRadius(): number;
    getCenterX(): number;
    getCenterZ(): number;
    animateOutline(time: number): void;
    clear(): void;
}
//# sourceMappingURL=CircleArea.d.ts.map