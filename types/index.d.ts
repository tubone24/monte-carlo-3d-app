import * as THREE from 'three';
export interface Ball {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    angularVelocity: THREE.Vector3;
    isInside: boolean;
    hasLanded: boolean;
    id: string;
}
export interface SimulationConfig {
    circleRadius: number;
    dropHeight: number;
    floorLevel: number;
    gravity: number;
    bounceDamping: number;
    maxBalls: number;
    batchSize: number;
}
export interface EnvironmentalParameters {
    windSpeed: number;
    windDirection: number;
    airPressure: number;
    humidity: number;
    temperature: number;
    turbulence: number;
}
export interface SimulationStats {
    totalBalls: number;
    insideBalls: number;
    piEstimate: number;
    error: number;
}
export interface UIElements {
    totalBallsElement: HTMLElement;
    insideBallsElement: HTMLElement;
    piEstimateElement: HTMLElement;
    errorElement: HTMLElement;
    startBtn: HTMLButtonElement;
    pauseBtn: HTMLButtonElement;
    resetBtn: HTMLButtonElement;
    batchSizeSlider: HTMLInputElement;
    batchSizeValue: HTMLElement;
}
export declare enum SimulationState {
    STOPPED = "stopped",
    RUNNING = "running",
    PAUSED = "paused"
}
export declare enum SimulationMode {
    MONTE_CARLO = "monte_carlo",
    COLLISION = "collision"
}
export interface CollisionObject {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    angularVelocity: THREE.Vector3;
    mass: number;
    id: string;
    type: 'P' | 'Q';
}
export interface CollisionStats {
    totalCollisions: number;
    massRatio: number;
    piEstimate: number;
    error: number;
}
export interface FrictionParameters {
    slidingFriction: number;
    rollingFriction: number;
    staticFriction: number;
}
export interface EnvironmentalConditions {
    temperature: number;
    humidity: number;
    pressure: number;
}
export interface CollisionPhysicsParameters {
    friction: FrictionParameters;
    wallRestitution: number;
    objectRestitution: number;
    airResistance: number;
    surfaceRoughness: number;
    rotationalDamping: number;
    dragCoefficient: number;
    magnusCoefficient: number;
    environment: EnvironmentalConditions;
    enableMagnusEffect: boolean;
    enableRealisticAirDrag: boolean;
}
//# sourceMappingURL=index.d.ts.map