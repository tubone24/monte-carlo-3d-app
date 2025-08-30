import * as THREE from 'three';

export class CameraController {
    private camera: THREE.PerspectiveCamera;
    private target: THREE.Vector3;
    private radius: number = 30;
    private angle: number = 0;
    private height: number = 15;
    private autoRotate: boolean = true;
    private mouseDown: boolean = false;
    private mouseX: number = 0;
    private mouseY: number = 0;
    private targetAngle: number = 0;
    private targetHeight: number = 15;
    
    constructor(camera: THREE.PerspectiveCamera) {
        this.camera = camera;
        this.target = new THREE.Vector3(0, -5, 0);
        this.setupControls();
    }
    
    private setupControls(): void {
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('wheel', this.onWheel.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }
    
    private onMouseDown(event: MouseEvent): void {
        this.mouseDown = true;
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        this.autoRotate = false;
    }
    
    private onMouseMove(event: MouseEvent): void {
        if (!this.mouseDown) return;
        
        const deltaX = event.clientX - this.mouseX;
        const deltaY = event.clientY - this.mouseY;
        
        this.targetAngle += deltaX * 0.01;
        this.targetHeight = Math.max(5, Math.min(40, this.targetHeight - deltaY * 0.1));
        
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }
    
    private onMouseUp(): void {
        this.mouseDown = false;
    }
    
    private onWheel(event: WheelEvent): void {
        event.preventDefault();
        this.radius = Math.max(10, Math.min(80, this.radius + event.deltaY * 0.01));
    }
    
    private onKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyA':
                this.autoRotate = !this.autoRotate;
                break;
            case 'KeyR':
                this.resetCamera();
                break;
            case 'Space':
                event.preventDefault();
                this.focusOnCenter();
                break;
        }
    }
    
    public update(deltaTime: number): void {
        if (this.autoRotate) {
            this.angle += deltaTime * 0.0003;
            this.targetAngle = this.angle;
        } else {
            this.angle = THREE.MathUtils.lerp(this.angle, this.targetAngle, 0.05);
        }
        
        this.height = THREE.MathUtils.lerp(this.height, this.targetHeight, 0.05);
        
        const x = Math.cos(this.angle) * this.radius;
        const z = Math.sin(this.angle) * this.radius;
        
        this.camera.position.set(x, this.height, z);
        this.camera.lookAt(this.target);
    }
    
    public resetCamera(): void {
        this.angle = 0;
        this.targetAngle = 0;
        this.radius = 30;
        this.height = 15;
        this.targetHeight = 15;
        this.autoRotate = true;
        this.target.set(0, -5, 0);
    }
    
    public focusOnCenter(): void {
        this.target.set(0, -5, 0);
        this.radius = 25;
        this.height = 10;
        this.targetHeight = 10;
    }
    
    public focusOnArea(x: number, y: number, z: number, distance: number = 20): void {
        this.target.set(x, y, z);
        this.radius = distance;
        this.autoRotate = false;
    }
    
    public setAutoRotate(enabled: boolean): void {
        this.autoRotate = enabled;
    }
    
    public getAutoRotate(): boolean {
        return this.autoRotate;
    }
    
    public dispose(): void {
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('wheel', this.onWheel);
        document.removeEventListener('keydown', this.onKeyDown);
    }
}