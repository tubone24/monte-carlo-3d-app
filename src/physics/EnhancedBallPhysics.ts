import * as THREE from 'three';
import { Ball, EnvironmentalParameters } from '../types';

export class EnhancedBallPhysics {
    private gravity: number = -9.8; // 現実的な重力加速度
    private bounceDamping: number = 0.7;
    private groundLevel: number;
    private time: number = 0;
    private noiseOffset: number = Math.random() * 1000;
    private ballRadius: number = 0.0335; // ボール半径（テニスボール: 3.35cm）
    private ballMass: number = 0.057; // ボール質量（テニスボール: 57g）
    
    constructor(groundLevel: number) {
        this.groundLevel = groundLevel + 0.3;
    }
    
    private calculateDragCoefficient(velocity: number, airDensity: number, temperature: number): number {
        // 動粘性係数（サザーランドの法則による温度依存）
        const kinematicViscosity = this.calculateKinematicViscosity(temperature, airDensity);
        
        // レイノルズ数の計算
        const Reynolds = velocity * this.ballRadius * 2 / kinematicViscosity;
        
        // テニスボールの臨界レイノルズ数による抗力係数変化
        if (Reynolds < 85000) {
            return 0.55; // サブクリティカル領域（表面フェルトの影響）
        } else if (Reynolds < 150000) {
            return 0.35; // 遷移領域（ドラッグクライシス）
        } else {
            return 0.40; // スーパークリティカル領域
        }
    }
    
    private calculateKinematicViscosity(temperature: number, airDensity: number): number {
        // サザーランドの法則による動粘性係数
        const T = temperature + 273.15; // ケルビン変換
        const T0 = 288.15; // 基準温度（15°C）
        const mu0 = 1.789e-5; // 基準動粘性係数
        const S = 110.4; // サザーランド定数
        
        const dynamicViscosity = mu0 * Math.pow(T / T0, 1.5) * (T0 + S) / (T + S);
        return dynamicViscosity / airDensity;
    }
    
    private calculateMagnusForce(ball: Ball, airDensity: number): THREE.Vector3 {
        // マグヌス効果（スピンによる揚力）
        const omega = ball.angularVelocity.clone();
        const velocity = ball.velocity.clone();
        const CL = 0.25; // テニスボールの揚力係数
        const crossSectionArea = Math.PI * this.ballRadius * this.ballRadius;
        
        // マグヌス力: F = CL * ρ * A * (ω × v)
        const magnusForceVector = omega.cross(velocity);
        magnusForceVector.multiplyScalar(CL * airDensity * crossSectionArea);
        
        // 力を加速度に変換
        magnusForceVector.divideScalar(this.ballMass);
        
        return magnusForceVector;
    }
    
    public update(balls: Ball[], deltaTime: number, environment: EnvironmentalParameters): void {
        this.time += deltaTime;
        
        balls.forEach((ball, index) => {
            if (!ball.hasLanded) {
                this.applyAdvancedPhysics(ball, deltaTime, environment, index);
                this.updatePosition(ball, deltaTime);
                this.handleGroundCollision(ball);
                this.applyVisualEffects(ball, environment);
            }
        });
    }
    
    private applyAdvancedPhysics(ball: Ball, deltaTime: number, env: EnvironmentalParameters, ballIndex: number): void {
        const position = ball.mesh.position;
        const uniqueSeed = ballIndex + this.time * 0.001 + this.noiseOffset;
        
        // 1. 基本重力（現実的な値）
        ball.velocity.y += this.gravity * deltaTime;
        
        // 2. 物理的に正確な空気密度計算
        const temperatureK = env.temperature + 273.15;
        const airDensity = env.airPressure * 100 / (287.05 * temperatureK); // kg/m³
        
        // 湿度による空気密度補正（実際の公式）
        const saturationPressure = 610.78 * Math.exp(17.27 * env.temperature / (env.temperature + 237.3));
        const vaporPressure = (env.humidity / 100) * saturationPressure;
        const correctedDensity = airDensity * (1 - 0.378 * vaporPressure / (env.airPressure * 100));
        
        // 3. 空気抵抗（レイノルズ数依存のドラッグ方程式）
        const velocity = ball.velocity.length();
        if (velocity > 0) {
            const dragCoefficient = this.calculateDragCoefficient(velocity, correctedDensity, env.temperature);
            const crossSectionArea = Math.PI * this.ballRadius * this.ballRadius;
            const dragForce = 0.5 * correctedDensity * velocity * velocity * dragCoefficient * crossSectionArea;
            const dragAcceleration = dragForce / this.ballMass;
            
            // テニスボールサイズでは空気抵抗の影響を適度に制限
            const maxDragAcceleration = 2.0; // 最大減速度を制限
            const limitedDragAcceleration = Math.min(dragAcceleration, maxDragAcceleration);
            
            // 速度と逆方向に減速
            const velocityDirection = ball.velocity.clone().normalize();
            const dragVector = velocityDirection.multiplyScalar(-limitedDragAcceleration * deltaTime);
            ball.velocity.add(dragVector);
        }
        
        // 4. 風の影響（物理的に妥当）
        const windNoise = this.perlinNoise(position.x * 0.1, position.z * 0.1, uniqueSeed);
        const turbulenceNoise = this.perlinNoise(position.x * 0.3, position.y * 0.3, uniqueSeed * 2);
        
        const windForceScale = 0.001; // 現実的な風力係数
        const windForceX = Math.cos(env.windDirection * Math.PI / 180) * env.windSpeed * (1 + windNoise * env.turbulence) * correctedDensity * windForceScale;
        const windForceZ = Math.sin(env.windDirection * Math.PI / 180) * env.windSpeed * (1 + windNoise * env.turbulence) * correctedDensity * windForceScale;
        const turbulentForceY = turbulenceNoise * env.turbulence * correctedDensity * windForceScale * 0.5;
        
        ball.velocity.x += windForceX * deltaTime;
        ball.velocity.z += windForceZ * deltaTime;
        ball.velocity.y += turbulentForceY * deltaTime;
        
        // 5. アルキメデスの浮力（微小だが物理的に正確）
        const ballVolume = (4/3) * Math.PI * this.ballRadius * this.ballRadius * this.ballRadius;
        const buoyantForce = correctedDensity * ballVolume * 9.8;
        const buoyantAcceleration = buoyantForce / this.ballMass;
        ball.velocity.y += buoyantAcceleration * deltaTime;
        
        // 6. マグヌス効果（スピンによる揚力）
        const magnusAcceleration = this.calculateMagnusForce(ball, correctedDensity);
        ball.velocity.add(magnusAcceleration.multiplyScalar(deltaTime));
        
        // 7. 回転減衰（スピンディケイ）
        const spinDecayRate = 0.98; // 回転減衰率（98%残存）
        ball.angularVelocity.multiplyScalar(Math.pow(spinDecayRate, deltaTime * 60)); // 60FPS基準
    }
    
    private updatePosition(ball: Ball, deltaTime: number): void {
        ball.mesh.position.add(ball.velocity.clone().multiplyScalar(deltaTime));
        
        // 複雑な回転運動
        ball.mesh.rotation.x += ball.velocity.y * 0.02 + Math.sin(this.time * 0.01) * 0.01;
        ball.mesh.rotation.y += ball.velocity.x * 0.02 + Math.cos(this.time * 0.01) * 0.01;
        ball.mesh.rotation.z += ball.velocity.z * 0.02 + Math.sin(this.time * 0.007) * 0.01;
    }
    
    private handleGroundCollision(ball: Ball): void {
        if (ball.mesh.position.y <= this.groundLevel) {
            ball.mesh.position.y = this.groundLevel;
            
            if (Math.abs(ball.velocity.y) > 0.5) {
                ball.velocity.y = -ball.velocity.y * this.bounceDamping;
                
                // バウンス時のランダムな散乱
                const bounceRandomness = 2.0;
                ball.velocity.x += (Math.random() - 0.5) * bounceRandomness;
                ball.velocity.z += (Math.random() - 0.5) * bounceRandomness;
            } else {
                ball.velocity.set(0, 0, 0);
                ball.hasLanded = true;
            }
        }
    }
    
    private applyVisualEffects(ball: Ball, env: EnvironmentalParameters): void {
        // 温度による色の変化
        const material = ball.mesh.material as THREE.MeshPhongMaterial;
        const tempIntensity = Math.max(0.3, Math.min(1, (env.temperature + 20) / 60));
        material.emissive.setRGB(
            ball.isInside ? 0 : tempIntensity * 0.1,
            ball.isInside ? tempIntensity * 0.1 : 0,
            0
        );
        
        // 大きさの微細な変化（気圧の影響）
        const pressureScale = 1 + (env.airPressure - 1013.25) / 10000;
        ball.mesh.scale.setScalar(pressureScale);
    }
    
    private perlinNoise(x: number, y: number, z: number): number {
        // 簡易パーリンノイズ実装
        const p = Math.floor;
        const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
        
        const X = p(x) & 255;
        const Y = p(y) & 255;
        const Z = p(z) & 255;
        
        x -= p(x);
        y -= p(y);
        z -= p(z);
        
        const u = fade(x);
        const v = fade(y);
        const w = fade(z);
        
        // 簡略化されたハッシュ関数
        const hash = (i: number, j: number, k: number) => {
            return ((i * 374761393 + j * 668265263 + k * 1274126177) % 2147483647) / 2147483647 * 2 - 1;
        };
        
        const A = hash(X, Y, Z);
        const B = hash(X + 1, Y, Z);
        const C = hash(X, Y + 1, Z);
        const D = hash(X + 1, Y + 1, Z);
        
        return A * (1 - u) * (1 - v) * (1 - w) +
               B * u * (1 - v) * (1 - w) +
               C * (1 - u) * v * (1 - w) +
               D * u * v * (1 - w);
    }
    
}