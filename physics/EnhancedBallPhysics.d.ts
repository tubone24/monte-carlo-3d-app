import { Ball, EnvironmentalParameters } from '../types';
export declare class EnhancedBallPhysics {
    private gravity;
    private bounceDamping;
    private groundLevel;
    private time;
    private noiseOffset;
    private ballRadius;
    private ballMass;
    constructor(groundLevel: number);
    private calculateDragCoefficient;
    private calculateKinematicViscosity;
    private calculateMagnusForce;
    update(balls: Ball[], deltaTime: number, environment: EnvironmentalParameters): void;
    private applyAdvancedPhysics;
    private updatePosition;
    private handleGroundCollision;
    private applyVisualEffects;
    private perlinNoise;
}
//# sourceMappingURL=EnhancedBallPhysics.d.ts.map