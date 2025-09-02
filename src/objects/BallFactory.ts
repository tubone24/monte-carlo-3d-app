import * as THREE from 'three';
import { Ball } from '../types';
import { CircleArea } from './CircleArea';

export class BallFactory {
    private scene: THREE.Scene;
    private circleArea: CircleArea;
    private ballGeometry: THREE.SphereGeometry;
    private insideMaterial: THREE.MeshPhongMaterial;
    private outsideMaterial: THREE.MeshPhongMaterial;
    private ballCounter: number = 0;
    
    constructor(scene: THREE.Scene, circleArea: CircleArea) {
        this.scene = scene;
        this.circleArea = circleArea;
        
        this.ballGeometry = new THREE.SphereGeometry(0.0335, 16, 16); // テニスボール実寸（半径3.35cm）
        this.insideMaterial = new THREE.MeshPhongMaterial({ color: 0x44ff44 });
        this.outsideMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
    }
    
    private createGrayMaterial(): THREE.MeshPhongMaterial {
        return new THREE.MeshPhongMaterial({ 
            color: 0x888888,
            shininess: 50
        });
    }
    
    public createBall(dropHeight: number = 20, timeOffset: number = 0): Ball {
        const range = this.circleArea.getRadius();
        const x = (Math.random() - 0.5) * range * 2;
        const z = (Math.random() - 0.5) * range * 2;
        
        // 高さにゆらぎを追加
        const heightVariation = Math.sin(timeOffset * 0.01) * 2 + (Math.random() - 0.5) * 3;
        const actualDropHeight = dropHeight + heightVariation;
        
        const isInside = this.circleArea.isPointInCircle(x, z);
        
        // 落下中は灰色マテリアルを使用
        const grayMaterial = this.createGrayMaterial();
        const mesh = new THREE.Mesh(this.ballGeometry, grayMaterial);
        mesh.position.set(x, actualDropHeight, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        this.scene.add(mesh);
        
        // 初期速度にもわずかなゆらぎを追加
        const initialVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.5
        );
        
        // 初期角速度（テニスボールのスピン効果）
        const initialAngularVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 20, // バックスピン/トップスピン
            (Math.random() - 0.5) * 10, // 横回転
            (Math.random() - 0.5) * 15  // サイドスピン
        );
        
        const ball: Ball = {
            mesh,
            velocity: initialVelocity,
            angularVelocity: initialAngularVelocity,
            isInside,
            hasLanded: false,
            id: `ball-${this.ballCounter++}`
        };
        
        return ball;
    }
    
    public createBallAtPosition(x: number, z: number, dropHeight: number = 20): Ball {
        const isInside = this.circleArea.isPointInCircle(x, z);
        const material = isInside ? this.insideMaterial : this.outsideMaterial;
        
        const mesh = new THREE.Mesh(this.ballGeometry, material);
        mesh.position.set(x, dropHeight, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        this.scene.add(mesh);
        
        const ball: Ball = {
            mesh,
            velocity: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0),
            isInside,
            hasLanded: false,
            id: `ball-${this.ballCounter++}`
        };
        
        return ball;
    }
    
    public removeBall(ball: Ball): void {
        this.scene.remove(ball.mesh);
        ball.mesh.geometry.dispose();
        if (Array.isArray(ball.mesh.material)) {
            ball.mesh.material.forEach((material: THREE.Material) => material.dispose());
        } else {
            ball.mesh.material.dispose();
        }
    }
    
    public clearAllBalls(balls: Ball[]): void {
        balls.forEach(ball => {
            this.removeBall(ball);
        });
        balls.length = 0;
    }
    
    public getBallCount(): number {
        return this.ballCounter;
    }
    
    public resetCounter(): void {
        this.ballCounter = 0;
    }
    
    public animateBallColors(balls: Ball[]): void {
        balls.forEach(ball => {
            if (ball.hasLanded) {
                // 着地時に色を変更（アニメーションなし）
                this.updateBallColorOnLanding(ball);
            }
        });
    }
    
    private updateBallColorOnLanding(ball: Ball): void {
        const currentMaterial = ball.mesh.material as THREE.MeshPhongMaterial;
        
        // 灰色（0x888888）の場合のみ色を変更
        if (currentMaterial.color.getHex() === 0x888888) {
            // 古いマテリアルを削除
            currentMaterial.dispose();
            
            // 新しいマテリアルを設定
            const newMaterial = ball.isInside ? 
                this.insideMaterial.clone() : 
                this.outsideMaterial.clone();
            
            ball.mesh.material = newMaterial;
        }
    }
}