import { Ball } from '../types';

export class BallPhysics {
    private gravity: number = -30;
    private bounceDamping: number = 0.7;
    private groundLevel: number;
    
    constructor(groundLevel: number) {
        this.groundLevel = groundLevel + 0.3;
    }
    
    public update(balls: Ball[], deltaTime: number): void {
        balls.forEach(ball => {
            if (!ball.hasLanded) {
                ball.velocity.y += this.gravity * deltaTime;
                
                ball.mesh.position.y += ball.velocity.y * deltaTime;
                
                if (ball.mesh.position.y <= this.groundLevel) {
                    ball.mesh.position.y = this.groundLevel;
                    
                    if (Math.abs(ball.velocity.y) > 0.5) {
                        ball.velocity.y = -ball.velocity.y * this.bounceDamping;
                        
                        ball.velocity.x = (Math.random() - 0.5) * 0.5;
                        ball.velocity.z = (Math.random() - 0.5) * 0.5;
                    } else {
                        ball.velocity.set(0, 0, 0);
                        ball.hasLanded = true;
                    }
                }
                
                ball.mesh.position.x += ball.velocity.x * deltaTime;
                ball.mesh.position.z += ball.velocity.z * deltaTime;
                ball.velocity.x *= 0.98;
                ball.velocity.z *= 0.98;
                
                ball.mesh.rotation.x += ball.velocity.y * 0.01;
                ball.mesh.rotation.z += ball.velocity.x * 0.01;
            }
        });
    }
    
    public setGravity(gravity: number): void {
        this.gravity = gravity;
    }
    
    public setBounceDamping(damping: number): void {
        this.bounceDamping = damping;
    }
}