import * as THREE from 'three';
import { Ball, EnvironmentalParameters } from '../types';

export class EnhancedBallPhysics {
    private gravity: number = -30;
    private bounceDamping: number = 0.7;
    private groundLevel: number;
    private time: number = 0;
    private noiseOffset: number = Math.random() * 1000;
    
    constructor(groundLevel: number) {
        this.groundLevel = groundLevel + 0.3;
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
        
        // 1. 基本重力 + 気圧の影響
        const pressureEffect = (env.airPressure - 1013.25) / 1013.25 * 5;
        const effectiveGravity = this.gravity * (1 + pressureEffect);
        ball.velocity.y += effectiveGravity * deltaTime;
        
        // 2. 複雑な風の影響
        const windNoise = this.perlinNoise(position.x * 0.1, position.z * 0.1, uniqueSeed);
        const turbulenceNoise = this.perlinNoise(position.x * 0.3, position.y * 0.3, uniqueSeed * 2);
        
        const windX = Math.cos(env.windDirection * Math.PI / 180) * env.windSpeed * (1 + windNoise * env.turbulence);
        const windZ = Math.sin(env.windDirection * Math.PI / 180) * env.windSpeed * (1 + windNoise * env.turbulence);
        const windY = turbulenceNoise * env.windSpeed * env.turbulence * 0.3;
        
        ball.velocity.x += windX * deltaTime * 0.1;
        ball.velocity.z += windZ * deltaTime * 0.1;
        ball.velocity.y += windY * deltaTime * 0.05;
        
        // 3. 温度による空気密度の変化
        const temperatureEffect = (env.temperature - 20) / 100; // 20°Cを基準
        const airResistance = 0.99 - temperatureEffect * 0.02;
        ball.velocity.multiplyScalar(airResistance);
        
        // 4. 湿度による浮力
        const humidityBuoyancy = env.humidity / 100 * 0.5;
        ball.velocity.y += humidityBuoyancy * deltaTime;
        
        // 5. 電磁場の影響（ボールが帯電していると仮定）
        const magneticForceX = Math.sin(uniqueSeed * env.magneticField) * env.magneticField * 0.1;
        const magneticForceZ = Math.cos(uniqueSeed * env.magneticField) * env.magneticField * 0.1;
        ball.velocity.x += magneticForceX * deltaTime;
        ball.velocity.z += magneticForceZ * deltaTime;
        
        // 6. イオン電荷による斥力・引力
        const ionicEffect = Math.sin(uniqueSeed + this.time * env.ionicCharge) * env.ionicCharge;
        ball.velocity.x += ionicEffect * Math.cos(uniqueSeed) * deltaTime * 0.2;
        ball.velocity.z += ionicEffect * Math.sin(uniqueSeed) * deltaTime * 0.2;
        
        
        // 7. 高度による大気圧変化
        const altitudeEffect = Math.max(0, (position.y - this.groundLevel) / 20);
        const pressureDrop = Math.exp(-altitudeEffect) * 0.1;
        ball.velocity.y += pressureDrop * deltaTime;
        
        // 8. 複数の周波数を重ねた複雑なノイズ
        const complexNoise = this.getComplexNoise(position, uniqueSeed, this.time);
        ball.velocity.add(complexNoise.multiplyScalar(env.turbulence * deltaTime * 0.5));
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
            env.ionicCharge * 0.02
        );
        
        // 大きさの微細な変化（気圧の影響）
        const pressureScale = 1 + (env.airPressure - 1013.25) / 10000;
        ball.mesh.scale.setScalar(pressureScale);
    }
    
    private perlinNoise(x: number, y: number, z: number): number {
        // 簡易パーリンノイズ実装
        const p = Math.floor;
        const f = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
        const fade = f;
        
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
    
    private getComplexNoise(position: THREE.Vector3, seed: number, time: number): THREE.Vector3 {
        const noise1 = this.perlinNoise(position.x * 0.1, position.y * 0.1, time * 0.001 + seed);
        const noise2 = this.perlinNoise(position.y * 0.2, position.z * 0.2, time * 0.002 + seed);
        const noise3 = this.perlinNoise(position.z * 0.05, position.x * 0.05, time * 0.001 + seed);
        
        return new THREE.Vector3(noise1, noise2, noise3);
    }
    
    public setGravity(gravity: number): void {
        this.gravity = gravity;
    }
    
    public setBounceDamping(damping: number): void {
        this.bounceDamping = damping;
    }
}