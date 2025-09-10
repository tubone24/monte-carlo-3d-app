import * as THREE from 'three';
export declare class SceneManager {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    constructor(container: HTMLElement);
    private createScene;
    private createCamera;
    private createRenderer;
    private setupLights;
    private setupHelpers;
    private handleResize;
    render(): void;
    updateCameraPosition(time: number): void;
    dispose(): void;
}
//# sourceMappingURL=SceneManager.d.ts.map