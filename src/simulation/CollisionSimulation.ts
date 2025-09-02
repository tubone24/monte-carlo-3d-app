import * as THREE from 'three';
import { CollisionObject, CollisionStats } from '../types';

export class CollisionSimulation {
    private scene: THREE.Scene;
    private objectP: CollisionObject | null = null;
    private objectQ: CollisionObject | null = null;
    private wall: THREE.Mesh | null = null;
    private floor: THREE.Mesh | null = null;
    private collisionCount: number = 0;
    private massRatio: number = 100; // P:Q = massRatio:1
    private isRunning: boolean = false;
    private collisionHistory: number[] = [];
    private expectedCollisions: number = 0;
    private lastCollisionTime: number = 0;
    private initialEnergy: number = 0;
    
    // 物体の位置設定
    private objectHeight: number = -4.5;
    
    // デバッグ表示用
    private velocityText: THREE.Sprite | null = null;
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }
    
    public initialize(massRatio: number = 100): void {
        this.clear();
        this.massRatio = massRatio;
        this.collisionCount = 0;
        this.collisionHistory = [];
        
        // 理論値の計算: N = floor(π/√ε) where ε = 1/massRatio
        // 質量比が100:1の場合、√100 = 10, π/0.1 = 31.4... → 31回
        this.expectedCollisions = Math.floor(Math.PI * Math.sqrt(massRatio));
        
        this.createWall();
        this.createFloor();
        this.createObjects();
        this.createDebugDisplay();
    }
    
    private createWall(): void {
        const wallGeometry = new THREE.BoxGeometry(0.1, 3, 4);
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8b4513,
            transparent: true,
            opacity: 0.9
        });
        this.wall = new THREE.Mesh(wallGeometry, wallMaterial);
        this.wall.position.set(-3, -3.5, 0);
        this.wall.castShadow = true;
        this.wall.receiveShadow = true;
        this.scene.add(this.wall);
        
        // 壁のテクスチャ風の線
        const edgesGeometry = new THREE.EdgesGeometry(wallGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x4a2511, linewidth: 2 });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.wall.add(edges);
        
        // 壁のラベル
        this.addWallLabel();
    }
    
    private addWallLabel(): void {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.width = 128;
        canvas.height = 64;
        context.fillStyle = '#ffffff';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('壁', 64, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            color: 0xffffff
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.5, 0.25, 1);
        sprite.position.set(-3, -2, 0);
        this.scene.add(sprite);
    }
    
    private createFloor(): void {
        const floorGeometry = new THREE.PlaneGeometry(10, 8);
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x606060,
            side: THREE.DoubleSide
        });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.position.y = -5;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);
        
        // 床のグリッドライン
        this.createFloorGrid();
    }
    
    private createFloorGrid(): void {
        const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x888888);
        gridHelper.position.y = -4.99;
        this.scene.add(gridHelper);
    }
    
    private createObjects(): void {
        
        // 物体Q（軽い、壁に近い）- 吊り下げ式
        const qRadius = 0.15;
        const qGeometry = new THREE.SphereGeometry(qRadius, 32, 16);
        const qMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00,
            emissive: 0x004400,
            emissiveIntensity: 0.2,
            shininess: 100
        });
        const qMesh = new THREE.Mesh(qGeometry, qMaterial);
        qMesh.position.set(-2, this.objectHeight, 0);
        qMesh.castShadow = true;
        qMesh.receiveShadow = true;
        this.scene.add(qMesh);
        
        this.objectQ = {
            mesh: qMesh,
            velocity: new THREE.Vector3(0, 0, 0),
            mass: 1,
            id: 'Q',
            type: 'Q'
        };
        
        // 物体P（重い、離れた位置）- 質量比に関係なく同サイズ
        const pRadius = 0.15;
        const pGeometry = new THREE.SphereGeometry(pRadius, 32, 16);
        const pMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0x440000,
            emissiveIntensity: 0.2,
            shininess: 100
        });
        const pMesh = new THREE.Mesh(pGeometry, pMaterial);
        pMesh.position.set(1, this.objectHeight, 0);
        pMesh.castShadow = true;
        pMesh.receiveShadow = true;
        this.scene.add(pMesh);
        
        // 質量比に応じて初速度を調整
        const initialVelocity = this.massRatio === 1 ? -1 : -2;
        
        this.objectP = {
            mesh: pMesh,
            velocity: new THREE.Vector3(initialVelocity, 0, 0), // 初速度（左向き）
            mass: this.massRatio,
            id: 'P',
            type: 'P'
        };
        
        // ラベル追加
        this.addLabel(qMesh, 'Q (m=1)', 0x00ff00);
        this.addLabel(pMesh, `P (m=${this.massRatio})`, 0xff0000);
        
        // 初期エネルギーを計算
        this.calculateInitialEnergy();
    }
    
    private calculateInitialEnergy(): void {
        if (!this.objectP || !this.objectQ) return;
        
        const kineticP = 0.5 * this.objectP.mass * Math.pow(this.objectP.velocity.x, 2);
        const kineticQ = 0.5 * this.objectQ.mass * Math.pow(this.objectQ.velocity.x, 2);
        this.initialEnergy = kineticP + kineticQ;
        
        console.log(`Initial energy: ${this.initialEnergy.toFixed(6)}`);
    }
    
    private getCurrentEnergy(): number {
        if (!this.objectP || !this.objectQ) return 0;
        
        const kineticP = 0.5 * this.objectP.mass * Math.pow(this.objectP.velocity.x, 2);
        const kineticQ = 0.5 * this.objectQ.mass * Math.pow(this.objectQ.velocity.x, 2);
        return kineticP + kineticQ;
    }
    
    
    
    private addLabel(mesh: THREE.Mesh, text: string, color: number): void {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = '#ffffff';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            color: color
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.8, 0.2, 1);
        sprite.position.y = 0.5;
        mesh.add(sprite);
    }
    
    private createDebugDisplay(): void {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.width = 600;
        canvas.height = 300;
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture
        });
        this.velocityText = new THREE.Sprite(spriteMaterial);
        this.velocityText.scale.set(2, 1, 1);
        this.velocityText.position.set(0, -1, 0);
        this.scene.add(this.velocityText);
    }
    
    private updateDebugDisplay(): void {
        if (!this.velocityText || !this.objectP || !this.objectQ) return;
        
        const canvas = this.velocityText.material.map as THREE.CanvasTexture;
        const context = canvas.image.getContext('2d');
        if (!context) return;
        
        context.clearRect(0, 0, 600, 300);
        context.fillStyle = '#ffffff';
        context.font = '24px monospace';
        const currentEnergy = this.getCurrentEnergy();
        const energyRatio = currentEnergy / this.initialEnergy;
        const timeSinceLastCollision = Date.now() - this.lastCollisionTime;
        
        context.fillText(`Collisions: ${this.collisionCount} / ${this.expectedCollisions}`, 10, 30);
        context.fillText(`P velocity: ${this.objectP.velocity.x.toFixed(4)} m/s`, 10, 60);
        context.fillText(`Q velocity: ${this.objectQ.velocity.x.toFixed(4)} m/s`, 10, 90);
        context.fillText(`π estimate: ${(this.collisionCount / Math.sqrt(this.massRatio)).toFixed(6)}`, 10, 120);
        context.fillText(`Energy ratio: ${energyRatio.toFixed(4)}`, 10, 150);
        context.fillText(`Time since collision: ${timeSinceLastCollision}ms`, 10, 180);
        context.fillText(`Distance P-Q: ${Math.abs(this.objectP.mesh.position.x - this.objectQ.mesh.position.x).toFixed(4)}`, 10, 210);
        
        canvas.needsUpdate = true;
    }
    
    public update(deltaTime: number): void {
        if (!this.isRunning || !this.objectP || !this.objectQ) return;
        
        // 質量比に応じてより細かい時間ステップを調整
        let steps = 50;
        let maxDt = 0.0002;
        
        if (this.massRatio >= 1000000) {
            steps = 500;  // 10倍に増加
            maxDt = 0.00005;  // さらに細かく
        } else if (this.massRatio >= 10000) {
            steps = 200;
            maxDt = 0.0001;
        } else if (this.massRatio >= 100) {
            steps = 100;
            maxDt = 0.0001;
        }
        
        const dt = Math.min(deltaTime / steps, maxDt);
        
        for (let i = 0; i < steps; i++) {
            this.updatePhysics(dt);
            // 物理更新後に即座に停止チェック
            if (!this.isRunning) break;
        }
        this.updateDebugDisplay();
        this.updateCollisionEffects();
    }
    
    private updatePhysics(dt: number): void {
        if (!this.objectP || !this.objectQ) return;
        
        // 位置の更新
        this.objectP.mesh.position.x += this.objectP.velocity.x * dt;
        this.objectQ.mesh.position.x += this.objectQ.velocity.x * dt;
        
        // 衝突判定の改良
        const pPos = this.objectP.mesh.position.x;
        const qPos = this.objectQ.mesh.position.x;
        // 統一された半径
        const pRadius = 0.15;
        const qRadius = 0.15;
        const wallPos = -2.95; // 壁の位置を正確に
        
        // P-Q衝突判定（改良版）
        const distance = Math.abs(pPos - qPos);
        const minDistance = pRadius + qRadius;
        
        // 相対速度を計算（PからQへ向かう速度）
        const relativeVelocity = this.objectP.velocity.x - this.objectQ.velocity.x;
        const isApproaching = (pPos > qPos && relativeVelocity < 0) || (pPos < qPos && relativeVelocity > 0);
        
        // より厳密な衝突判定：接触+接近中
        if (distance <= minDistance && isApproaching && Math.abs(relativeVelocity) > 1e-6) {
            this.handlePQCollision();
        }
        
        // Q-壁衝突判定（改良版）- より厳密に
        if (qPos - qRadius <= wallPos && this.objectQ.velocity.x < 0) {
            // 位置を強制的に修正
            this.objectQ.mesh.position.x = wallPos + qRadius + 0.001;
            this.handleWallCollision();
        }
        
        // Qの安全チェック
        if (qPos < wallPos) {
            console.warn('Q passed through wall! Emergency correction.');
            this.objectQ.mesh.position.x = wallPos + qRadius + 0.01;
            this.objectQ.velocity.x = Math.abs(this.objectQ.velocity.x); // 右向きに強制
        }
        
        // P-壁衝突判定（Pが左端の壁を超えないように）- より厳密に
        if (pPos - pRadius <= wallPos && this.objectP.velocity.x < 0) {
            // 位置を強制的に修正
            this.objectP.mesh.position.x = wallPos + pRadius + 0.001;
            this.handlePWallCollision();
        }
        
        // さらに安全チェック：Pが壁を完全に超えた場合の緊急修正
        if (pPos < wallPos) {
            console.warn('P passed through wall! Emergency correction.');
            this.objectP.mesh.position.x = wallPos + pRadius + 0.01;
            this.objectP.velocity.x = Math.abs(this.objectP.velocity.x); // 右向きに強制
        }
        
        // 改良された停止条件
        const currentTime = Date.now();
        const timeSinceLastCollision = currentTime - this.lastCollisionTime;
        const currentEnergy = this.getCurrentEnergy();
        const energyRatio = currentEnergy / this.initialEnergy;
        
        // 停止条件：
        // 1. 長時間（3秒）衝突がない かつ
        // 2. エネルギーが初期値の1%以下 または 両物体がほぼ静止
        const isStagnant = timeSinceLastCollision > 3000;
        const isLowEnergy = energyRatio < 0.01;
        const areBothSlow = Math.abs(this.objectP.velocity.x) < 0.001 && Math.abs(this.objectQ.velocity.x) < 0.001;
        
        if (isStagnant && (isLowEnergy || areBothSlow)) {
            console.log(`Stopping simulation. Time since last collision: ${timeSinceLastCollision}ms, Energy ratio: ${energyRatio.toFixed(6)}`);
            this.stop();
        }
    }
    
    private handlePQCollision(): void {
        if (!this.objectP || !this.objectQ) return;
        
        // 完全弾性衝突の運動量保存則と運動エネルギー保存則
        const m1 = this.objectP.mass;
        const m2 = this.objectQ.mass;
        const v1 = this.objectP.velocity.x;
        const v2 = this.objectQ.velocity.x;
        
        // 衝突後の速度（1次元完全弾性衝突の公式）
        // 質量比が大きい場合、Pの速度はほとんど変わらない
        const newV1 = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
        const newV2 = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
        
        // デバッグログ
        console.log(`Collision! Before: P=${v1.toFixed(3)}, Q=${v2.toFixed(3)}`);
        console.log(`After: P=${newV1.toFixed(3)}, Q=${newV2.toFixed(3)}`);
        console.log(`Mass ratio: ${m1}:${m2}`);
        
        this.objectP.velocity.x = newV1;
        this.objectQ.velocity.x = newV2;
        
        // 物体を少し離す（貫通防止）
        const pRadius = 0.15;
        const qRadius = 0.15;
        const separation = 0.01;
        this.objectQ.mesh.position.x = this.objectP.mesh.position.x - pRadius - qRadius - separation;
        
        this.collisionCount++;
        this.lastCollisionTime = Date.now();
        this.collisionHistory.push(this.lastCollisionTime);
        
        // エネルギー保存チェック
        const currentEnergy = this.getCurrentEnergy();
        const energyRatio = currentEnergy / this.initialEnergy;
        console.log(`Energy conservation: ${energyRatio.toFixed(6)} (should be ~1.0)`);
        
        // 衝突エフェクト
        this.createCollisionEffect(
            new THREE.Vector3(
                (this.objectP.mesh.position.x + this.objectQ.mesh.position.x) / 2,
                this.objectP.mesh.position.y,
                0
            ),
            0xffff00
        );
    }
    
    private handleWallCollision(): void {
        if (!this.objectQ) return;
        
        // 完全弾性衝突（壁は無限大の質量）- 速度を反転
        this.objectQ.velocity.x = -this.objectQ.velocity.x;
        
        console.log(`Q-Wall collision! Q velocity reversed to: ${this.objectQ.velocity.x.toFixed(3)}`);
        
        // 壁から少し離す（貫通防止）
        this.objectQ.mesh.position.x = -2.95 + 0.15 + 0.01;
        
        this.collisionCount++;
        this.lastCollisionTime = Date.now();
        this.collisionHistory.push(this.lastCollisionTime);
        
        // エネルギー保存チェック
        const currentEnergy = this.getCurrentEnergy();
        const energyRatio = currentEnergy / this.initialEnergy;
        console.log(`Energy conservation: ${energyRatio.toFixed(6)} (should be ~1.0)`);
        
        // 衝突エフェクト
        this.createCollisionEffect(
            new THREE.Vector3(-2.95, this.objectQ.mesh.position.y, 0),
            0x00ffff
        );
    }
    
    private handlePWallCollision(): void {
        if (!this.objectP) return;
        
        // Pが壁に衝突した場合も速度を反転
        this.objectP.velocity.x = -this.objectP.velocity.x;
        
        console.log(`P-Wall collision! P velocity reversed to: ${this.objectP.velocity.x.toFixed(3)}`);
        
        // 壁から少し離す（貫通防止）
        this.objectP.mesh.position.x = -2.95 + 0.15 + 0.01;
        
        this.collisionCount++;
        this.lastCollisionTime = Date.now();
        this.collisionHistory.push(this.lastCollisionTime);
        
        // エネルギー保存チェック
        const currentEnergy = this.getCurrentEnergy();
        const energyRatio = currentEnergy / this.initialEnergy;
        console.log(`P-Wall Energy conservation: ${energyRatio.toFixed(6)} (should be ~1.0)`);
        
        // 衝突エフェクト（赤色でPの衝突を区別）
        this.createCollisionEffect(
            new THREE.Vector3(-2.95, this.objectP.mesh.position.y, 0),
            0xff0000
        );
    }
    
    private createCollisionEffect(position: THREE.Vector3, color: number): void {
        const geometry = new THREE.RingGeometry(0.05, 0.3, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const effect = new THREE.Mesh(geometry, material);
        effect.position.copy(position);
        this.scene.add(effect);
        
        // エフェクトをフェードアウト＆拡大
        let opacity = 0.8;
        let scale = 1;
        const fadeOut = setInterval(() => {
            opacity -= 0.02;
            scale += 0.1;
            material.opacity = opacity;
            effect.scale.set(scale, scale, scale);
            
            if (opacity <= 0) {
                clearInterval(fadeOut);
                this.scene.remove(effect);
                effect.geometry.dispose();
                material.dispose();
            }
        }, 16);
    }
    
    private updateCollisionEffects(): void {
        if (!this.objectP || !this.objectQ) return;
        
        if (this.collisionHistory.length > 0) {
            const timeSinceLastCollision = Date.now() - this.collisionHistory[this.collisionHistory.length - 1];
            if (timeSinceLastCollision < 300) {
                const intensity = 1 - timeSinceLastCollision / 300;
                (this.objectP.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.2 + intensity * 0.5;
                (this.objectQ.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.2 + intensity * 0.5;
            } else {
                (this.objectP.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.2;
                (this.objectQ.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.2;
            }
        }
    }
    
    public start(): void {
        this.isRunning = true;
        this.lastCollisionTime = Date.now();
    }
    
    public stop(): void {
        this.isRunning = false;
    }
    
    public reset(): void {
        this.initialize(this.massRatio);
    }
    
    public clear(): void {
        // すべてのオブジェクトを削除
        const objectsToRemove: THREE.Object3D[] = [];
        
        this.scene.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Sprite) {
                objectsToRemove.push(child);
            }
        });
        
        objectsToRemove.forEach(obj => {
            this.scene.remove(obj);
            if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
                obj.geometry.dispose();
                if (obj.material instanceof THREE.Material) {
                    obj.material.dispose();
                } else if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                }
            }
        });
        
        this.objectP = null;
        this.objectQ = null;
        this.wall = null;
        this.floor = null;
        this.velocityText = null;
        this.collisionCount = 0;
        this.collisionHistory = [];
        this.lastCollisionTime = 0;
        this.initialEnergy = 0;
    }
    
    public getStats(): CollisionStats {
        const piEstimate = this.collisionCount / Math.sqrt(this.massRatio);
        const error = ((piEstimate - Math.PI) / Math.PI) * 100;
        
        return {
            totalCollisions: this.collisionCount,
            massRatio: this.massRatio,
            piEstimate: piEstimate,
            error: error
        };
    }
    
    public setMassRatio(ratio: number): void {
        this.massRatio = ratio;
        this.reset();
    }
    
    public getExpectedCollisions(): number {
        return this.expectedCollisions;
    }
    
    public isComplete(): boolean {
        return !this.isRunning && this.collisionCount >= this.expectedCollisions;
    }
}