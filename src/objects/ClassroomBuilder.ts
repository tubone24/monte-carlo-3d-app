import * as THREE from 'three';

export class ClassroomBuilder {
    private scene: THREE.Scene;
    private floorLevel: number;
    
    constructor(scene: THREE.Scene, floorLevel: number = -5) {
        this.scene = scene;
        this.floorLevel = floorLevel;
    }
    
    public build(): void {
        this.createFloor();
        this.createWalls();
        this.createBlackboard();
        this.createDesks();
    }
    
    private createFloor(): void {
        const geometry = new THREE.PlaneGeometry(50, 50);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x8B7355,
            side: THREE.DoubleSide 
        });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = this.floorLevel;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }
    
    private createWalls(): void {
        const wallGeometry = new THREE.PlaneGeometry(50, 40);
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xF5DEB3,
            side: THREE.DoubleSide 
        });
        
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.z = -25;
        backWall.position.y = 15;
        backWall.receiveShadow = true;
        this.scene.add(backWall);
    }
    
    private createBlackboard(): void {
        const geometry = new THREE.BoxGeometry(20, 10, 0.5);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x2F4F2F 
        });
        const blackboard = new THREE.Mesh(geometry, material);
        blackboard.position.set(0, 10, -24.5);
        blackboard.castShadow = true;
        this.scene.add(blackboard);
        
        const trayGeometry = new THREE.BoxGeometry(20, 0.5, 1);
        const trayMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513 
        });
        const tray = new THREE.Mesh(trayGeometry, trayMaterial);
        tray.position.set(0, 5, -24);
        this.scene.add(tray);
    }
    
    private createDesks(): void {
        const deskPositions = [
            { x: -18, z: 12 },
            { x: -18, z: 8 },
            { x: -12, z: 12 },
            { x: -12, z: 8 },
            { x: 12, z: 12 },
            { x: 12, z: 8 },
            { x: 18, z: 12 },
            { x: 18, z: 8 },
            { x: 0, z: 15 },
            { x: -6, z: 15 },
            { x: 6, z: 15 }
        ];
        
        deskPositions.forEach(pos => {
            this.createDesk(pos.x, pos.z);
        });
    }
    
    private createDesk(x: number, z: number): void {
        const topGeometry = new THREE.BoxGeometry(4, 0.5, 2);
        const topMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513 
        });
        const deskTop = new THREE.Mesh(topGeometry, topMaterial);
        deskTop.position.set(x, this.floorLevel + 3, z);
        deskTop.castShadow = true;
        deskTop.receiveShadow = true;
        this.scene.add(deskTop);
        
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
        const legMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x696969 
        });
        
        const legOffsets = [
            { x: -1.8, z: -0.8 },
            { x: 1.8, z: -0.8 },
            { x: -1.8, z: 0.8 },
            { x: 1.8, z: 0.8 }
        ];
        
        legOffsets.forEach(offset => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(
                x + offset.x, 
                this.floorLevel + 1.5, 
                z + offset.z
            );
            leg.castShadow = true;
            this.scene.add(leg);
        });
    }
}