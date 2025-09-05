import './styles.css';
import { SceneManager } from './scene/SceneManager';
import { CameraController } from './scene/CameraController';
import { ClassroomBuilder } from './objects/ClassroomBuilder';
import { CircleArea } from './objects/CircleArea';
import { BallFactory } from './objects/BallFactory';
import { BlackboardDisplay } from './objects/BlackboardDisplay';
import { EnhancedBallPhysics } from './physics/EnhancedBallPhysics';
import { UIManager } from './ui/UIManager';
import { ErrorChart } from './ui/ErrorChart';
import { CollisionSimulation } from './simulation/CollisionSimulation';
import { Ball, SimulationConfig, SimulationStats, SimulationState, EnvironmentalParameters, SimulationMode, CollisionStats } from './types';

class MonteCarloSimulation {
    private sceneManager!: SceneManager;
    private cameraController!: CameraController;
    private circleArea!: CircleArea;
    private ballFactory!: BallFactory;
    private ballPhysics!: EnhancedBallPhysics;
    private uiManager!: UIManager;
    private blackboardDisplay!: BlackboardDisplay;
    private errorChart!: ErrorChart;
    private collisionSimulation!: CollisionSimulation;
    
    private balls: Ball[] = [];
    private config: SimulationConfig;
    private environment: EnvironmentalParameters;
    private state: SimulationState = SimulationState.STOPPED;
    private mode: SimulationMode = SimulationMode.MONTE_CARLO;
    private lastDropTime: number = 0;
    private animationId: number = 0;
    
    // 累積統計
    private totalBallsDropped: number = 0;
    private totalInsideBalls: number = 0;
    
    constructor() {
        this.config = {
            circleRadius: 1.5, // 教室中央の現実的なサイズ（直径3m）
            dropHeight: 2.0,
            floorLevel: -5,
            gravity: -9.8,
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
            turbulence: 0
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
            this.errorChart = new ErrorChart();
            
            this.collisionSimulation = new CollisionSimulation(this.sceneManager.scene);
            
            this.uiManager = new UIManager(
                () => this.start(),
                () => this.pause(),
                () => this.reset(),
                (batchSize) => this.setBatchSize(batchSize)
            );
            
            this.setupEnvironmentalControls();
            this.setupModeSelector();
            
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
            
            if (this.mode === SimulationMode.COLLISION) {
                this.collisionSimulation.start();
            }
            
            this.uiManager.updateButtonStates(this.state);
            this.uiManager.showMessage('シミュレーション開始！', 'info');
        }
    }
    
    private pause(): void {
        if (this.state === SimulationState.RUNNING) {
            this.state = SimulationState.PAUSED;
            
            if (this.mode === SimulationMode.COLLISION) {
                this.collisionSimulation.stop();
            }
            
            this.uiManager.updateButtonStates(this.state);
            this.uiManager.showMessage('シミュレーション一時停止', 'warning');
        }
    }
    
    private reset(): void {
        this.state = SimulationState.STOPPED;
        
        if (this.mode === SimulationMode.MONTE_CARLO) {
            this.ballFactory.clearAllBalls(this.balls);
            this.balls = [];
            
            this.ballFactory.resetCounter();
            this.lastDropTime = 0;
            
            // 累積統計もリセット
            this.totalBallsDropped = 0;
            this.totalInsideBalls = 0;
            
            // グラフもリセット
            this.errorChart.reset();
        } else {
            this.collisionSimulation.reset();
        }
        
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
            if (this.mode === SimulationMode.MONTE_CARLO) {
                this.updateMonteCarloSimulation(currentTime);
                this.ballPhysics.update(this.balls, deltaTime / 1000, this.environment);
            } else {
                this.collisionSimulation.update(deltaTime / 1000);
                if (this.collisionSimulation.isComplete()) {
                    this.state = SimulationState.STOPPED;
                    this.uiManager.updateButtonStates(this.state);
                    this.uiManager.showMessage('シミュレーション完了！', 'success');
                }
            }
        } else if (this.mode === SimulationMode.MONTE_CARLO) {
            this.ballPhysics.update(this.balls, deltaTime / 1000, this.environment);
        }
        
        this.updateStats();
    }
    
    private updateMonteCarloSimulation(currentTime: number): void {
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
            
            // 着地したボールの統計を累積カウントに追加してから削除
            if (this.balls.length > 5000) {
                const ballsToRemove = this.balls.splice(0, 1000);
                ballsToRemove.forEach(ball => {
                    if (ball.hasLanded) {
                        this.totalBallsDropped++;
                        if (ball.isInside) {
                            this.totalInsideBalls++;
                        }
                    }
                    this.ballFactory.removeBall(ball);
                });
            }
        }
    }
    
    private render(currentTime: number): void {
        if (this.mode === SimulationMode.MONTE_CARLO) {
            this.circleArea.animateOutline(currentTime);
            this.ballFactory.animateBallColors(this.balls);
        }
        
        this.uiManager.animateStats(currentTime);
        
        // π値を黒板に表示
        const stats = this.getCurrentStats();
        this.blackboardDisplay.updatePiValue(stats.piEstimate, currentTime);
        
        this.sceneManager.render();
    }
    
    private updateStats(): void {
        if (this.mode === SimulationMode.COLLISION) {
            this.updateCollisionStats();
            return;
        }
        
        // 現在着地しているボール数を累積カウントに追加
        const currentLandedBalls = this.balls.filter(ball => ball.hasLanded).length;
        const currentInsideBalls = this.balls.filter(ball => ball.hasLanded && ball.isInside).length;
        
        // 累積統計を計算
        const totalBalls = this.totalBallsDropped + currentLandedBalls;
        const insideBalls = this.totalInsideBalls + currentInsideBalls;
        
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
        
        // グラフに誤差データを追加（100個以上の試行がある場合のみ）
        if (totalBalls >= 100) {
            this.errorChart.addDataPoint(totalBalls, error, piEstimate, insideBalls);
        }
    }
    
    private updateCollisionStats(): void {
        const stats = this.collisionSimulation.getStats();
        const expectedCollisions = this.collisionSimulation.getExpectedCollisions();
        
        // 衝突シミュレーション用の統計を更新
        const collisionCountElement = document.getElementById('collision-count');
        const expectedCollisionsElement = document.getElementById('expected-collisions');
        const collisionPiElement = document.getElementById('collision-pi-estimate');
        const collisionErrorElement = document.getElementById('collision-error');
        
        if (collisionCountElement) collisionCountElement.textContent = stats.totalCollisions.toString();
        if (expectedCollisionsElement) expectedCollisionsElement.textContent = expectedCollisions.toString();
        if (collisionPiElement) collisionPiElement.textContent = stats.piEstimate.toFixed(6);
        if (collisionErrorElement) collisionErrorElement.textContent = `${stats.error.toFixed(2)}%`;
    }
    
    private getCurrentStats(): SimulationStats | CollisionStats {
        if (this.mode === SimulationMode.COLLISION) {
            return this.collisionSimulation.getStats();
        }
        
        // 現在着地しているボール数を累積カウントに追加
        const currentLandedBalls = this.balls.filter(ball => ball.hasLanded).length;
        const currentInsideBalls = this.balls.filter(ball => ball.hasLanded && ball.isInside).length;
        
        // 累積統計を計算
        const totalBalls = this.totalBallsDropped + currentLandedBalls;
        const insideBalls = this.totalInsideBalls + currentInsideBalls;
        
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
            temperature: 35 + Math.random() * 15,
            turbulence: 3.0
        };
        this.updateEnvironmentalUI();
        this.uiManager.showMessage('🌪️ 激しい気象条件になりました！', 'warning');
    }
    
    private applyCalmPreset(): void {
        this.environment = {
            windSpeed: 0.1,
            windDirection: 0,
            airPressure: 1013.25,
            humidity: 45,
            temperature: 22,
            turbulence: 0
        };
        this.updateEnvironmentalUI();
        this.uiManager.showMessage('😌 標準的な気象条件になりました', 'success');
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
    }
    
    private setupModeSelector(): void {
        const monteCarloBtn = document.getElementById('mode-monte-carlo');
        const collisionBtn = document.getElementById('mode-collision');
        const massRatioSelect = document.getElementById('mass-ratio-select') as HTMLSelectElement;
        
        monteCarloBtn?.addEventListener('click', () => {
            this.switchMode(SimulationMode.MONTE_CARLO);
        });
        
        collisionBtn?.addEventListener('click', () => {
            this.switchMode(SimulationMode.COLLISION);
        });
        
        massRatioSelect?.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            const massRatio = parseInt(target.value);
            this.collisionSimulation.setMassRatio(massRatio);
            this.updateCollisionStats();
        });
        
        // 物理パラメーター制御の設定
        this.setupPhysicsControls();
    }
    
    private setupPhysicsControls(): void {
        // スライダーのイベントリスナー設定
        const frictionSlider = document.getElementById('friction') as HTMLInputElement;
        const wallRestitutionSlider = document.getElementById('wall-restitution') as HTMLInputElement;
        const objectRestitutionSlider = document.getElementById('object-restitution') as HTMLInputElement;
        const airResistanceSlider = document.getElementById('air-resistance') as HTMLInputElement;
        const surfaceRoughnessSlider = document.getElementById('surface-roughness') as HTMLInputElement;
        const rotationalDampingSlider = document.getElementById('rotational-damping') as HTMLInputElement;
        
        // 値表示要素
        const frictionValue = document.getElementById('friction-value');
        const wallRestitutionValue = document.getElementById('wall-restitution-value');
        const objectRestitutionValue = document.getElementById('object-restitution-value');
        const airResistanceValue = document.getElementById('air-resistance-value');
        const surfaceRoughnessValue = document.getElementById('surface-roughness-value');
        const rotationalDampingValue = document.getElementById('rotational-damping-value');
        
        // 摩擦係数（滑り摩擦を代表値として使用）
        frictionSlider?.addEventListener('input', (e) => {
            const value = parseFloat((e.target as HTMLInputElement).value) / 100;
            if (frictionValue) frictionValue.textContent = value.toFixed(2);
            this.collisionSimulation.setPhysicsParams({ 
                friction: {
                    slidingFriction: value,
                    rollingFriction: value * 0.04,  // 滑り摩擦の4%程度
                    staticFriction: value * 2       // 滑り摩擦の2倍程度
                }
            });
        });
        
        // 壁の反発係数
        wallRestitutionSlider?.addEventListener('input', (e) => {
            const value = parseFloat((e.target as HTMLInputElement).value) / 100;
            if (wallRestitutionValue) wallRestitutionValue.textContent = value.toFixed(2);
            this.collisionSimulation.setPhysicsParams({ wallRestitution: value });
        });
        
        // 物体間反発係数
        objectRestitutionSlider?.addEventListener('input', (e) => {
            const value = parseFloat((e.target as HTMLInputElement).value) / 100;
            if (objectRestitutionValue) objectRestitutionValue.textContent = value.toFixed(2);
            this.collisionSimulation.setPhysicsParams({ objectRestitution: value });
        });
        
        // 空気抵抗
        airResistanceSlider?.addEventListener('input', (e) => {
            const value = parseFloat((e.target as HTMLInputElement).value) / 100;
            if (airResistanceValue) airResistanceValue.textContent = value.toFixed(2);
            this.collisionSimulation.setPhysicsParams({ airResistance: value });
        });
        
        // 表面粗さ
        surfaceRoughnessSlider?.addEventListener('input', (e) => {
            const value = parseFloat((e.target as HTMLInputElement).value) / 100;
            if (surfaceRoughnessValue) surfaceRoughnessValue.textContent = value.toFixed(2);
            this.collisionSimulation.setPhysicsParams({ surfaceRoughness: value });
        });
        
        // 回転減衰
        rotationalDampingSlider?.addEventListener('input', (e) => {
            const value = parseFloat((e.target as HTMLInputElement).value) / 100;
            if (rotationalDampingValue) rotationalDampingValue.textContent = value.toFixed(2);
            this.collisionSimulation.setPhysicsParams({ rotationalDamping: value });
        });
        
        // プリセットボタン
        const idealPresetBtn = document.getElementById('ideal-preset-btn');
        const realisticPresetBtn = document.getElementById('realistic-preset-btn');
        const extremePresetBtn = document.getElementById('extreme-preset-btn');
        
        idealPresetBtn?.addEventListener('click', () => {
            this.collisionSimulation.setPhysicsPreset('ideal');
            this.updatePhysicsUI();
            this.uiManager.showMessage('理想条件を適用しました', 'success');
        });
        
        realisticPresetBtn?.addEventListener('click', () => {
            this.collisionSimulation.setPhysicsPreset('realistic');
            this.updatePhysicsUI();
            this.uiManager.showMessage('現実的な条件を適用しました', 'info');
        });
        
        extremePresetBtn?.addEventListener('click', () => {
            this.collisionSimulation.setPhysicsPreset('extreme');
            this.updatePhysicsUI();
            this.uiManager.showMessage('極限環境を適用しました', 'warning');
        });
    }
    
    private updatePhysicsUI(): void {
        const params = this.collisionSimulation.getPhysicsParams();
        
        // スライダーの値を更新（滑り摩擦を代表値として使用）
        (document.getElementById('friction') as HTMLInputElement).value = (params.friction.slidingFriction * 100).toString();
        (document.getElementById('wall-restitution') as HTMLInputElement).value = (params.wallRestitution * 100).toString();
        (document.getElementById('object-restitution') as HTMLInputElement).value = (params.objectRestitution * 100).toString();
        (document.getElementById('air-resistance') as HTMLInputElement).value = (params.airResistance * 100).toString();
        (document.getElementById('surface-roughness') as HTMLInputElement).value = (params.surfaceRoughness * 100).toString();
        (document.getElementById('rotational-damping') as HTMLInputElement).value = (params.rotationalDamping * 100).toString();
        
        // 表示値を更新
        const frictionValue = document.getElementById('friction-value');
        const wallRestitutionValue = document.getElementById('wall-restitution-value');
        const objectRestitutionValue = document.getElementById('object-restitution-value');
        const airResistanceValue = document.getElementById('air-resistance-value');
        const surfaceRoughnessValue = document.getElementById('surface-roughness-value');
        const rotationalDampingValue = document.getElementById('rotational-damping-value');
        
        if (frictionValue) frictionValue.textContent = params.friction.slidingFriction.toFixed(2);
        if (wallRestitutionValue) wallRestitutionValue.textContent = params.wallRestitution.toFixed(2);
        if (objectRestitutionValue) objectRestitutionValue.textContent = params.objectRestitution.toFixed(2);
        if (airResistanceValue) airResistanceValue.textContent = params.airResistance.toFixed(2);
        if (surfaceRoughnessValue) surfaceRoughnessValue.textContent = params.surfaceRoughness.toFixed(2);
        if (rotationalDampingValue) rotationalDampingValue.textContent = params.rotationalDamping.toFixed(2);
    }
    
    private switchMode(newMode: SimulationMode): void {
        if (this.mode === newMode) return;
        
        // 現在のシミュレーションを停止
        this.state = SimulationState.STOPPED;
        this.uiManager.updateButtonStates(this.state);
        
        // 既存のオブジェクトをクリア
        if (this.mode === SimulationMode.MONTE_CARLO) {
            this.ballFactory.clearAllBalls(this.balls);
            this.balls = [];
            this.circleArea.clear();
        } else {
            this.collisionSimulation.clear();
        }
        
        // モードを切り替え
        this.mode = newMode;
        
        // UI要素の表示/非表示を切り替え
        const monteCarloBtn = document.getElementById('mode-monte-carlo');
        const collisionBtn = document.getElementById('mode-collision');
        const monteCarloStats = document.getElementById('monte-carlo-stats');
        const collisionStats = document.getElementById('collision-stats');
        const monteCarloSettings = document.getElementById('monte-carlo-settings');
        const collisionSettings = document.getElementById('collision-settings');
        const environmentalControls = document.getElementById('environmental-controls');
        const title = document.getElementById('simulation-title');
        const description = document.getElementById('simulation-description');
        
        if (newMode === SimulationMode.MONTE_CARLO) {
            monteCarloBtn?.classList.add('active');
            collisionBtn?.classList.remove('active');
            if (monteCarloStats) monteCarloStats.style.display = 'block';
            if (collisionStats) collisionStats.style.display = 'none';
            if (monteCarloSettings) monteCarloSettings.style.display = 'block';
            if (collisionSettings) collisionSettings.style.display = 'none';
            if (environmentalControls) environmentalControls.style.display = 'block';
            if (title) title.textContent = '🎯 モンテカルロ法で円周率を求めよう！';
            if (description) description.textContent = 'ボールを落として円の中に入るかどうかで円周率を推定します！';
            
            // モンテカルロ法のオブジェクトを再作成
            this.circleArea = new CircleArea(
                this.sceneManager.scene, 
                this.config.circleRadius, 
                this.config.floorLevel
            );
            this.errorChart.reset();
        } else {
            monteCarloBtn?.classList.remove('active');
            collisionBtn?.classList.add('active');
            if (monteCarloStats) monteCarloStats.style.display = 'none';
            if (collisionStats) collisionStats.style.display = 'block';
            if (monteCarloSettings) monteCarloSettings.style.display = 'none';
            if (collisionSettings) collisionSettings.style.display = 'block';
            if (environmentalControls) environmentalControls.style.display = 'none';
            if (title) title.textContent = '💥 衝突シミュレーションで円周率を求めよう！';
            if (description) description.textContent = '2つの物体と壁の衝突回数から円周率を導出します（PLAYING POOL WITH π）';
            
            // 衝突シミュレーションを初期化
            const massRatioSelect = document.getElementById('mass-ratio-select') as HTMLSelectElement;
            const massRatio = parseInt(massRatioSelect?.value || '100');
            this.collisionSimulation.initialize(massRatio);
        }
        
        this.updateStats();
        this.uiManager.showMessage(`${newMode === SimulationMode.MONTE_CARLO ? 'モンテカルロ法' : '衝突シミュレーション'}モードに切り替えました`, 'info');
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
        this.errorChart?.dispose();
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