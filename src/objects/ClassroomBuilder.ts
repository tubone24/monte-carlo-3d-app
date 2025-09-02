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
        const geometry = new THREE.PlaneGeometry(8, 6); // 現実的な教室サイズ（8m×6m）
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
        const wallGeometry = new THREE.PlaneGeometry(8, 3); // 教室サイズに合わせて（8m幅×3m高）
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xF5DEB3,
            side: THREE.DoubleSide 
        });
        
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.z = -3; // 教室奥行き3mの半分
        backWall.position.y = -3.5; // 床から天井の中央
        backWall.receiveShadow = true;
        this.scene.add(backWall);
    }
    
    private createBlackboard(): void {
        const geometry = new THREE.BoxGeometry(3.6, 1.2, 0.05); // 現実的な黒板（3.6m×1.2m×5cm）
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x2F4F2F 
        });
        const blackboard = new THREE.Mesh(geometry, material);
        blackboard.position.set(0, -3.1, -2.95); // 床上0.9m、壁から5cm手前
        blackboard.castShadow = true;
        this.scene.add(blackboard);
        
        const trayGeometry = new THREE.BoxGeometry(3.6, 0.05, 0.1); // チョーク受け
        const trayMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513 
        });
        const tray = new THREE.Mesh(trayGeometry, trayMaterial);
        tray.position.set(0, -3.7, -2.9); // 黒板下端
        this.scene.add(tray);
    }
    
    private createDesks(): void {
        const deskPositions = [
            { x: -2.5, z: 0.5 },  // 左側前列
            { x: -1.0, z: 0.5 },  // 中央前列
            { x: 0.5, z: 0.5 },   // 右側前列
            { x: -2.5, z: 1.8 },  // 左側後列
            { x: -1.0, z: 1.8 },  // 中央後列
            { x: 0.5, z: 1.8 },   // 右側後列
        ];
        
        deskPositions.forEach(pos => {
            this.createDesk(pos.x, pos.z);
        });
    }
    
    private createDesk(x: number, z: number): void {
        const topGeometry = new THREE.BoxGeometry(1.2, 0.03, 0.6); // 学校机サイズ（120cm×60cm×3cm）
        const topMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513 
        });
        const deskTop = new THREE.Mesh(topGeometry, topMaterial);
        deskTop.position.set(x, -4.28, z); // 床上0.72m
        deskTop.castShadow = true;
        deskTop.receiveShadow = true;
        this.scene.add(deskTop);
        
        const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.72); // 脚の高さ72cm
        const legMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x696969 
        });
        
        const legOffsets = [
            { x: -0.55, z: -0.25 },
            { x: 0.55, z: -0.25 },
            { x: -0.55, z: 0.25 },
            { x: 0.55, z: 0.25 }
        ];
        
        legOffsets.forEach(offset => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(
                x + offset.x, 
                -4.64, // 脚の中央高さ
                z + offset.z
            );
            leg.castShadow = true;
            this.scene.add(leg);
        });
    }
}