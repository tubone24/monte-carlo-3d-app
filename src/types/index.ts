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

export enum SimulationState {
    STOPPED = 'stopped',
    RUNNING = 'running',
    PAUSED = 'paused'
}

export enum SimulationMode {
    MONTE_CARLO = 'monte_carlo',
    COLLISION = 'collision'
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
    slidingFriction: number;       // 滑り摩擦係数 (0.05-0.15)
    rollingFriction: number;        // 転がり摩擦係数 (0.001-0.01)
    staticFriction: number;         // 静止摩擦係数 (0.1-0.2)
}

export interface EnvironmentalConditions {
    temperature: number;            // 温度 (℃)
    humidity: number;              // 湿度 (%)
    pressure: number;              // 気圧 (Pa)
}

export interface CollisionPhysicsParameters {
    friction: FrictionParameters;  // 摩擦パラメータ
    wallRestitution: number;       // 壁の反発係数 (0-1) 
    objectRestitution: number;     // 物体間反発係数 (0-1)
    airResistance: number;         // 空気抵抗係数 (0-0.1)
    surfaceRoughness: number;      // 表面粗さ (0-0.1)
    rotationalDamping: number;     // 回転減衰 (0-1)
    dragCoefficient: number;       // 抗力係数 (球体では0.47)
    magnusCoefficient: number;     // Magnus効果係数 (0-0.5)
    environment: EnvironmentalConditions; // 環境条件
    enableMagnusEffect: boolean;   // Magnus効果の有効/無効
    enableRealisticAirDrag: boolean; // 物理的に正確な空気抵抗の有効/無効
}