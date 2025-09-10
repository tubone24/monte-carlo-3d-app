import * as THREE from 'three';
export declare class ClassroomBuilder {
    private scene;
    private floorLevel;
    constructor(scene: THREE.Scene, floorLevel?: number);
    build(): void;
    private createFloor;
    private createWalls;
    private createBlackboard;
    private createDesks;
    private createDesk;
}
//# sourceMappingURL=ClassroomBuilder.d.ts.map