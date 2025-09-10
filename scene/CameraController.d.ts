import * as THREE from 'three';
export declare class CameraController {
    private camera;
    private target;
    private radius;
    private angle;
    private height;
    private autoRotate;
    private mouseDown;
    private mouseX;
    private mouseY;
    private targetAngle;
    private targetHeight;
    constructor(camera: THREE.PerspectiveCamera);
    private setupControls;
    private onMouseDown;
    private onMouseMove;
    private onMouseUp;
    private onWheel;
    private onKeyDown;
    update(deltaTime: number): void;
    resetCamera(): void;
    focusOnCenter(): void;
    focusOnArea(x: number, y: number, z: number, distance?: number): void;
    setAutoRotate(enabled: boolean): void;
    getAutoRotate(): boolean;
    dispose(): void;
}
//# sourceMappingURL=CameraController.d.ts.map