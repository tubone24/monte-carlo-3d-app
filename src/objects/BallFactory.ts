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
        
        this.ballGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        this.insideMaterial = new THREE.MeshPhongMaterial({ color: 0x44ff44 });
        this.outsideMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
    }
    
    public createBall(dropHeight: number = 20, timeOffset: number = 0): Ball {
        const range = this.circleArea.getRadius();
        const x = (Math.random() - 0.5) * range * 2;
        const z = (Math.random() - 0.5) * range * 2;
        
        // 高さにゆらぎを追加
        const heightVariation = Math.sin(timeOffset * 0.01) * 2 + (Math.random() - 0.5) * 3;
        const actualDropHeight = dropHeight + heightVariation;
        
        const isInside = this.circleArea.isPointInCircle(x, z);
        const material = isInside ? this.insideMaterial : this.outsideMaterial;
        
        const mesh = new THREE.Mesh(this.ballGeometry, material);
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
        
        const ball: Ball = {
            mesh,
            velocity: initialVelocity,
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
    
    public animateBallColors(balls: Ball[], time: number): void {
        balls.forEach(ball => {
            if (ball.hasLanded) {
                const intensity = 0.7 + 0.3 * Math.sin(time * 0.01 + ball.mesh.position.x);
                if (ball.isInside) {
                    (ball.mesh.material as THREE.MeshPhongMaterial).color.setHex(
                        Math.floor(0x44 * intensity) << 16 | 
                        Math.floor(0xff * intensity) << 8 | 
                        Math.floor(0x44 * intensity)
                    );
                } else {
                    (ball.mesh.material as THREE.MeshPhongMaterial).color.setHex(
                        Math.floor(0xff * intensity) << 16 | 
                        Math.floor(0x44 * intensity) << 8 | 
                        Math.floor(0x44 * intensity)
                    );
                }
            }
        });
    }
}