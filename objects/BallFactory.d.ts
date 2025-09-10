import * as THREE from 'three';
import { Ball } from '../types';
import { CircleArea } from './CircleArea';
export declare class BallFactory {
    private scene;
    private circleArea;
    private ballGeometry;
    private insideMaterial;
    private outsideMaterial;
    private ballCounter;
    constructor(scene: THREE.Scene, circleArea: CircleArea);
    private createGrayMaterial;
    createBall(dropHeight?: number, timeOffset?: number): Ball;
    createBallAtPosition(x: number, z: number, dropHeight?: number): Ball;
    removeBall(ball: Ball): void;
    clearAllBalls(balls: Ball[]): void;
    getBallCount(): number;
    resetCounter(): void;
    animateBallColors(balls: Ball[]): void;
    private updateBallColorOnLanding;
}
//# sourceMappingURL=BallFactory.d.ts.map