import * as THREE from 'three';

export class SceneManager {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    
    constructor(container: HTMLElement) {
        this.scene = this.createScene();
        this.camera = this.createCamera();
        this.renderer = this.createRenderer(container);
        
        this.setupLights();
        this.setupHelpers();
        
        window.addEventListener('resize', () => this.handleResize());
    }
    
    private createScene(): THREE.Scene {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        return scene;
    }
    
    private createCamera(): THREE.PerspectiveCamera {
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(25, 15, 25);
        camera.lookAt(0, -5, 0);
        return camera;
    }
    
    private createRenderer(container: HTMLElement): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        return renderer;
    }
    
    private setupLights(): void {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(20, 30, 10);
        sunLight.castShadow = true;
        sunLight.shadow.camera.left = -30;
        sunLight.shadow.camera.right = 30;
        sunLight.shadow.camera.top = 30;
        sunLight.shadow.camera.bottom = -30;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
    }
    
    private setupHelpers(): void {
        const gridHelper = new THREE.GridHelper(40, 20, 0x666666, 0xcccccc);
        gridHelper.position.y = -5;
        this.scene.add(gridHelper);
    }
    
    private handleResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
    
    public updateCameraPosition(time: number): void {
        this.camera.position.x = Math.cos(time * 0.0005) * 30;
        this.camera.position.z = Math.sin(time * 0.0005) * 30;
        this.camera.lookAt(0, -5, 0);
    }
    
    public dispose(): void {
        this.renderer.dispose();
        window.removeEventListener('resize', () => this.handleResize());
    }
}