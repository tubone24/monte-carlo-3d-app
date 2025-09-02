import * as THREE from 'three';

export class CircleArea {
    private scene: THREE.Scene;
    private radius: number;
    private centerX: number;
    private centerZ: number;
    private floorLevel: number;
    private circleOutline!: THREE.Mesh;
    private objects: THREE.Object3D[] = [];
    
    constructor(scene: THREE.Scene, radius: number = 8, floorLevel: number = -5) {
        this.scene = scene;
        this.radius = radius;
        this.centerX = 0;
        this.centerZ = 0;
        this.floorLevel = floorLevel;
        
        this.createMonteCarloArea();
    }
    
    private createMonteCarloArea(): void {
        this.createCircleOutline();
        this.createSquareOutline();
        this.createAxisLabels();
    }
    
    private createCircleOutline(): void {
        const geometry = new THREE.RingGeometry(this.radius - 0.1, this.radius + 0.1, 64);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff4444, 
            transparent: true,
            opacity: 0.8
        });
        
        this.circleOutline = new THREE.Mesh(geometry, material);
        this.circleOutline.rotation.x = -Math.PI / 2;
        this.circleOutline.position.set(
            this.centerX, 
            this.floorLevel + 0.01, 
            this.centerZ
        );
        this.scene.add(this.circleOutline);
        this.objects.push(this.circleOutline);
        
        const circleFill = new THREE.CircleGeometry(this.radius, 64);
        const fillMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4444, 
            transparent: true,
            opacity: 0.1
        });
        const circleMesh = new THREE.Mesh(circleFill, fillMaterial);
        circleMesh.rotation.x = -Math.PI / 2;
        circleMesh.position.set(
            this.centerX, 
            this.floorLevel + 0.005, 
            this.centerZ
        );
        this.scene.add(circleMesh);
        this.objects.push(circleMesh);
    }
    
    private createSquareOutline(): void {
        const points = [];
        const size = this.radius;
        
        points.push(new THREE.Vector3(-size, 0, -size));
        points.push(new THREE.Vector3(size, 0, -size));
        points.push(new THREE.Vector3(size, 0, size));
        points.push(new THREE.Vector3(-size, 0, size));
        points.push(new THREE.Vector3(-size, 0, -size));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x0066ff,
            linewidth: 3
        });
        
        const square = new THREE.Line(geometry, material);
        square.position.set(
            this.centerX, 
            this.floorLevel + 0.02, 
            this.centerZ
        );
        this.scene.add(square);
        this.objects.push(square);
    }
    
    private createAxisLabels(): void {
        this.createTextLabels();
    }
    
    private createTextLabels(): void {
        const xLabelGeometry = new THREE.BoxGeometry(2, 0.5, 0.1);
        const xLabelMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const xLabel = new THREE.Mesh(xLabelGeometry, xLabelMaterial);
        xLabel.position.set(this.radius + 2, this.floorLevel + 2, 0);
        this.scene.add(xLabel);
        this.objects.push(xLabel);
        
        const zLabelGeometry = new THREE.BoxGeometry(0.1, 0.5, 2);
        const zLabelMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const zLabel = new THREE.Mesh(zLabelGeometry, zLabelMaterial);
        zLabel.position.set(0, this.floorLevel + 2, this.radius + 2);
        this.scene.add(zLabel);
        this.objects.push(zLabel);
    }
    
    public isPointInCircle(x: number, z: number): boolean {
        const distanceFromCenter = Math.sqrt(
            Math.pow(x - this.centerX, 2) + Math.pow(z - this.centerZ, 2)
        );
        return distanceFromCenter <= this.radius;
    }
    
    public getRadius(): number {
        return this.radius;
    }
    
    public getCenterX(): number {
        return this.centerX;
    }
    
    public getCenterZ(): number {
        return this.centerZ;
    }
    
    public animateOutline(time: number): void {
        if (this.circleOutline) {
            const opacity = 0.5 + 0.3 * Math.sin(time * 0.005);
            (this.circleOutline.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
    }
    
    public clear(): void {
        this.objects.forEach(obj => {
            this.scene.remove(obj);
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                if (obj.material instanceof THREE.Material) {
                    obj.material.dispose();
                }
            } else if (obj instanceof THREE.Line) {
                obj.geometry.dispose();
                if (obj.material instanceof THREE.Material) {
                    obj.material.dispose();
                }
            }
        });
        this.objects = [];
    }
}