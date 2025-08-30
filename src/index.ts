import './styles.css';
import { SceneManager } from './scene/SceneManager';
import { CameraController } from './scene/CameraController';
import { ClassroomBuilder } from './objects/ClassroomBuilder';
import { CircleArea } from './objects/CircleArea';
import { BallFactory } from './objects/BallFactory';
import { BlackboardDisplay } from './objects/BlackboardDisplay';
import { EnhancedBallPhysics } from './physics/EnhancedBallPhysics';
import { UIManager } from './ui/UIManager';
import { Ball, SimulationConfig, SimulationStats, SimulationState, EnvironmentalParameters } from './types';

class MonteCarloSimulation {
    private sceneManager!: SceneManager;
    private cameraController!: CameraController;
    private circleArea!: CircleArea;
    private ballFactory!: BallFactory;
    private ballPhysics!: EnhancedBallPhysics;
    private uiManager!: UIManager;
    private blackboardDisplay!: BlackboardDisplay;
    
    private balls: Ball[] = [];
    private config: SimulationConfig;
    private environment: EnvironmentalParameters;
    private state: SimulationState = SimulationState.STOPPED;
    private lastDropTime: number = 0;
    private animationId: number = 0;
    
    constructor() {
        this.config = {
            circleRadius: 8,
            dropHeight: 20,
            floorLevel: -5,
            gravity: -30,
            bounceDamping: 0.7,
            maxBalls: -1,
            batchSize: 5
        };
        
        this.environment = {
            windSpeed: 0.1,
            windDirection: 0,
            airPressure: 1013.25,
            humidity: 45,
            temperature: 22,
            turbulence: 0,
            magneticField: 0,
            ionicCharge: 0
        };
        
        this.initialize();
    }
    
    private async initialize(): Promise<void> {
        try {
            const container = document.getElementById('canvas-container');
            if (!container) {
                throw new Error('Canvas container not found');
            }
            
            this.sceneManager = new SceneManager(container);
            this.cameraController = new CameraController(this.sceneManager.camera);
            
            const classroomBuilder = new ClassroomBuilder(this.sceneManager.scene, this.config.floorLevel);
            classroomBuilder.build();
            
            this.circleArea = new CircleArea(
                this.sceneManager.scene, 
                this.config.circleRadius, 
                this.config.floorLevel
            );
            
            this.ballFactory = new BallFactory(this.sceneManager.scene, this.circleArea);
            this.ballPhysics = new EnhancedBallPhysics(this.config.floorLevel);
            
            this.blackboardDisplay = new BlackboardDisplay(this.sceneManager.scene);
            
            this.uiManager = new UIManager(
                () => this.start(),
                () => this.pause(),
                () => this.reset(),
                (batchSize) => this.setBatchSize(batchSize)
            );
            
            this.setupEnvironmentalControls();
            
            this.setupInitialState();
            this.startRenderLoop();
            
            this.uiManager.showMessage('モンテカルロ法3Dシミュレーションへようこそ！', 'success');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('アプリケーションの初期化に失敗しました。');
        }
    }
    
    private setupInitialState(): void {
        this.updateStats();
        this.uiManager.updateButtonStates(this.state);
    }
    
    private start(): void {
        if (this.state === SimulationState.STOPPED || this.state === SimulationState.PAUSED) {
            this.state = SimulationState.RUNNING;
            this.uiManager.updateButtonStates(this.state);
            this.uiManager.showMessage('シミュレーション開始！', 'info');
        }
    }
    
    private pause(): void {
        if (this.state === SimulationState.RUNNING) {
            this.state = SimulationState.PAUSED;
            this.uiManager.updateButtonStates(this.state);
            this.uiManager.showMessage('シミュレーション一時停止', 'warning');
        }
    }
    
    private reset(): void {
        this.state = SimulationState.STOPPED;
        
        this.ballFactory.clearAllBalls(this.balls);
        this.balls = [];
        
        this.ballFactory.resetCounter();
        this.lastDropTime = 0;
        
        this.updateStats();
        this.uiManager.updateButtonStates(this.state);
        this.uiManager.showMessage('シミュレーションリセット完了', 'info');
        
        this.cameraController.resetCamera();
    }
    
    private setBatchSize(batchSize: number): void {
        this.config.batchSize = batchSize;
    }
    
    private startRenderLoop(): void {
        const animate = (currentTime: number) => {
            this.animationId = requestAnimationFrame(animate);
            
            const deltaTime = 16.67;
            
            this.update(currentTime, deltaTime);
            this.render(currentTime);
        };
        
        animate(0);
    }
    
    private update(currentTime: number, deltaTime: number): void {
        this.cameraController.update(deltaTime);
        
        if (this.state === SimulationState.RUNNING) {
            this.updateSimulation(currentTime);
        }
        
        this.ballPhysics.update(this.balls, deltaTime / 1000, this.environment);
        this.updateStats();
    }
    
    private updateSimulation(currentTime: number): void {
        const dropInterval = 500; // 500msごとにバッチ投下
        
        if (currentTime - this.lastDropTime > dropInterval && 
            (this.config.maxBalls === -1 || this.balls.length < this.config.maxBalls)) {
            
            // 一度に複数のボールを投下（時間差でゆらぎを追加）
            for (let i = 0; i < this.config.batchSize; i++) {
                // 各ボールに微小な時間オフセットを追加して自然なばらつきを作る
                const timeOffset = currentTime + i * 10;
                const newBall = this.ballFactory.createBall(this.config.dropHeight, timeOffset);
                this.balls.push(newBall);
            }
            
            this.lastDropTime = currentTime;
            
            if (this.balls.length > 5000) {
                const ballsToRemove = this.balls.splice(0, 1000);
                ballsToRemove.forEach(ball => {
                    this.ballFactory.removeBall(ball);
                });
            }
        }
    }
    
    private render(currentTime: number): void {
        this.circleArea.animateOutline(currentTime);
        this.ballFactory.animateBallColors(this.balls, currentTime);
        this.uiManager.animateStats(currentTime);
        
        // π値を黒板に表示
        const stats = this.getCurrentStats();
        this.blackboardDisplay.updatePiValue(stats.piEstimate, currentTime);
        
        this.sceneManager.render();
    }
    
    private updateStats(): void {
        const totalBalls = this.balls.filter(ball => ball.hasLanded).length;
        const insideBalls = this.balls.filter(ball => ball.hasLanded && ball.isInside).length;
        
        let piEstimate = 0;
        let error = 0;
        
        if (totalBalls > 0) {
            const ratio = insideBalls / totalBalls;
            piEstimate = ratio * 4;
            error = ((piEstimate - Math.PI) / Math.PI) * 100;
        }
        
        const stats: SimulationStats = {
            totalBalls,
            insideBalls,
            piEstimate,
            error
        };
        
        this.uiManager.updateStats(stats);
    }
    
    private getCurrentStats(): SimulationStats {
        const totalBalls = this.balls.filter(ball => ball.hasLanded).length;
        const insideBalls = this.balls.filter(ball => ball.hasLanded && ball.isInside).length;
        
        let piEstimate = 0;
        let error = 0;
        
        if (totalBalls > 0) {
            const ratio = insideBalls / totalBalls;
            piEstimate = ratio * 4;
            error = ((piEstimate - Math.PI) / Math.PI) * 100;
        }
        
        return {
            totalBalls,
            insideBalls,
            piEstimate,
            error
        };
    }
    
    private setupEnvironmentalControls(): void {
        const setupSlider = (id: string, property: keyof EnvironmentalParameters, valueId: string) => {
            const slider = document.getElementById(id) as HTMLInputElement;
            const valueElement = document.getElementById(valueId) as HTMLElement;
            
            if (slider && valueElement) {
                slider.addEventListener('input', (e) => {
                    const target = e.target as HTMLInputElement;
                    const value = parseFloat(target.value);
                    this.environment[property] = value as never;
                    valueElement.textContent = value.toString();
                });
            }
        };
        
        setupSlider('wind-speed', 'windSpeed', 'wind-speed-value');
        setupSlider('wind-direction', 'windDirection', 'wind-direction-value');
        setupSlider('temperature', 'temperature', 'temperature-value');
        setupSlider('air-pressure', 'airPressure', 'air-pressure-value');
        setupSlider('humidity', 'humidity', 'humidity-value');
        setupSlider('turbulence', 'turbulence', 'turbulence-value');
        setupSlider('magnetic-field', 'magneticField', 'magnetic-field-value');
        setupSlider('ionic-charge', 'ionicCharge', 'ionic-charge-value');
        
        // プリセットボタン
        const chaosBtn = document.getElementById('chaos-preset-btn');
        const calmBtn = document.getElementById('calm-preset-btn');
        
        chaosBtn?.addEventListener('click', () => this.applyChaosPreset());
        calmBtn?.addEventListener('click', () => this.applyCalmPreset());
    }
    
    private applyChaosPreset(): void {
        this.environment = {
            windSpeed: 15,
            windDirection: Math.random() * 360,
            airPressure: 950 + Math.random() * 100,
            humidity: 80 + Math.random() * 20,
            temperature: 30 + Math.random() * 20,
            turbulence: 4.5,
            magneticField: 8,
            ionicCharge: 9
        };
        this.updateEnvironmentalUI();
        this.uiManager.showMessage('🌪️ CHAOS MAX発動！カオス的な環境になりました！', 'warning');
    }
    
    private applyCalmPreset(): void {
        this.environment = {
            windSpeed: 0.1,
            windDirection: 0,
            airPressure: 1013.25,
            humidity: 45,
            temperature: 22,
            turbulence: 0,
            magneticField: 0,
            ionicCharge: 0
        };
        this.updateEnvironmentalUI();
        this.uiManager.showMessage('😌 穏やかな環境になりました', 'success');
    }
    
    private updateEnvironmentalUI(): void {
        const updateElement = (id: string, value: number) => {
            const element = document.getElementById(id);
            const slider = document.getElementById(id.replace('-value', '')) as HTMLInputElement;
            if (element) element.textContent = value.toString();
            if (slider) slider.value = value.toString();
        };
        
        updateElement('wind-speed-value', this.environment.windSpeed);
        updateElement('wind-direction-value', this.environment.windDirection);
        updateElement('temperature-value', this.environment.temperature);
        updateElement('air-pressure-value', this.environment.airPressure);
        updateElement('humidity-value', this.environment.humidity);
        updateElement('turbulence-value', this.environment.turbulence);
        updateElement('magnetic-field-value', this.environment.magneticField);
        updateElement('ionic-charge-value', this.environment.ionicCharge);
    }
    
    private showError(message: string): void {
        this.uiManager.showMessage(message, 'error');
    }
    
    public dispose(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.ballFactory?.clearAllBalls(this.balls);
        this.blackboardDisplay?.dispose();
        this.cameraController?.dispose();
        this.uiManager?.dispose();
        this.sceneManager?.dispose();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const simulation = new MonteCarloSimulation();
    
    window.addEventListener('beforeunload', () => {
        simulation.dispose();
    });
});

window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
});