import { Ball } from '../types';
export declare class BallPhysics {
    private gravity;
    private bounceDamping;
    private groundLevel;
    constructor(groundLevel: number);
    update(balls: Ball[], deltaTime: number): void;
    setGravity(gravity: number): void;
    setBounceDamping(damping: number): void;
}
//# sourceMappingURL=BallPhysics.d.ts.map