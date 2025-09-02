import { UIElements, SimulationStats, SimulationState } from '../types';

export class UIManager {
    private elements: UIElements;
    private onStart: () => void;
    private onPause: () => void;
    private onReset: () => void;
    private onBatchSizeChange: (batchSize: number) => void;
    
    constructor(
        onStart: () => void,
        onPause: () => void,
        onReset: () => void,
        onBatchSizeChange: (batchSize: number) => void
    ) {
        this.onStart = onStart;
        this.onPause = onPause;
        this.onReset = onReset;
        this.onBatchSizeChange = onBatchSizeChange;
        
        this.elements = this.getUIElements();
        this.setupEventListeners();
        this.setupModalSystem();
    }
    
    private getUIElements(): UIElements {
        const getElementById = (id: string): HTMLElement => {
            const element = document.getElementById(id);
            if (!element) {
                throw new Error(`Element with id '${id}' not found`);
            }
            return element;
        };
        
        return {
            totalBallsElement: getElementById('total-balls'),
            insideBallsElement: getElementById('inside-balls'),
            piEstimateElement: getElementById('pi-estimate'),
            errorElement: getElementById('error'),
            startBtn: getElementById('start-btn') as HTMLButtonElement,
            pauseBtn: getElementById('pause-btn') as HTMLButtonElement,
            resetBtn: getElementById('reset-btn') as HTMLButtonElement,
            batchSizeSlider: getElementById('batch-size-slider') as HTMLInputElement,
            batchSizeValue: getElementById('batch-size-value')
        };
    }
    
    private setupEventListeners(): void {
        this.elements.startBtn.addEventListener('click', this.onStart);
        this.elements.pauseBtn.addEventListener('click', this.onPause);
        this.elements.resetBtn.addEventListener('click', this.onReset);
        
        this.elements.batchSizeSlider.addEventListener('input', (event) => {
            const target = event.target as HTMLInputElement;
            const batchSize = parseInt(target.value);
            this.elements.batchSizeValue.textContent = batchSize.toString();
            this.onBatchSizeChange(batchSize);
        });
    }
    
    public updateStats(stats: SimulationStats): void {
        this.elements.totalBallsElement.textContent = stats.totalBalls.toString();
        this.elements.insideBallsElement.textContent = stats.insideBalls.toString();
        this.elements.piEstimateElement.textContent = stats.piEstimate.toFixed(6);
        this.elements.errorElement.textContent = `${stats.error.toFixed(2)}%`;
        
        const errorElement = this.elements.errorElement;
        errorElement.className = 'stat-value';
    }
    
    public updateButtonStates(state: SimulationState): void {
        switch (state) {
            case SimulationState.STOPPED:
                this.elements.startBtn.disabled = false;
                this.elements.startBtn.textContent = 'シミュレーション開始';
                this.elements.pauseBtn.disabled = true;
                this.elements.resetBtn.disabled = false;
                break;
                
            case SimulationState.RUNNING:
                this.elements.startBtn.disabled = true;
                this.elements.pauseBtn.disabled = false;
                this.elements.pauseBtn.textContent = '一時停止';
                this.elements.resetBtn.disabled = false;
                break;
                
            case SimulationState.PAUSED:
                this.elements.startBtn.disabled = false;
                this.elements.startBtn.textContent = '再開';
                this.elements.pauseBtn.disabled = true;
                this.elements.resetBtn.disabled = false;
                break;
        }
    }
    
    public showMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        switch (type) {
            case 'success':
                messageDiv.style.backgroundColor = '#d4edda';
                messageDiv.style.color = '#155724';
                messageDiv.style.border = '1px solid #c3e6cb';
                break;
            case 'warning':
                messageDiv.style.backgroundColor = '#fff3cd';
                messageDiv.style.color = '#856404';
                messageDiv.style.border = '1px solid #ffeaa7';
                break;
            case 'error':
                messageDiv.style.backgroundColor = '#f8d7da';
                messageDiv.style.color = '#721c24';
                messageDiv.style.border = '1px solid #f5c6cb';
                break;
            default:
                messageDiv.style.backgroundColor = '#d1ecf1';
                messageDiv.style.color = '#0c5460';
                messageDiv.style.border = '1px solid #bee5eb';
                break;
        }
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(messageDiv)) {
                    document.body.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }
    
    public getBatchSizeValue(): number {
        return parseInt(this.elements.batchSizeSlider.value);
    }
    
    public animateStats(time: number): void {
        const highlight = this.elements.piEstimateElement;
        const intensity = 0.7 + 0.3 * Math.sin(time * 0.003);
        highlight.style.opacity = intensity.toString();
    }
    
    private setupModalSystem(): void {
        const modal = document.getElementById('info-modal') as HTMLElement;
        const closeBtn = modal.querySelector('.modal-close') as HTMLButtonElement;
        const modalTitle = document.getElementById('modal-title') as HTMLElement;
        const modalDescription = document.getElementById('modal-description') as HTMLElement;
        
        // 情報ボタンのイベントリスナー設定
        const infoButtons = document.querySelectorAll('.info-btn');
        infoButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const param = target.getAttribute('data-param');
                if (param) {
                    this.openModal(param, modalTitle, modalDescription, modal);
                }
            });
        });
        
        // モーダルを閉じる機能
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // 背景クリックでモーダルを閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
    
    private openModal(param: string, titleElement: HTMLElement, descriptionElement: HTMLElement, modal: HTMLElement): void {
        const paramInfo = this.getParameterInfo(param);
        titleElement.textContent = paramInfo.title;
        descriptionElement.innerHTML = paramInfo.description;
        modal.style.display = 'block';
    }
    
    private getParameterInfo(param: string): { title: string; description: string } {
        const paramInfo: Record<string, { title: string; description: string }> = {
            'wind-speed': {
                title: '🌬️ 風速 (Wind Speed)',
                description: `
                    <h4>物理的影響</h4>
                    <p>風速は<strong>レイノルズ数</strong>に直接影響し、ボールの周りの流体力学的な力を変化させます。</p>
                    
                    <h4>具体的な効果</h4>
                    <ul>
                        <li><strong>抗力係数の変化</strong>: Re = ρVL/μ (密度×速度×長さ/粘性)</li>
                        <li><strong>ターミナル速度の変化</strong>: 風速が上がると空気抵抗が増大</li>
                        <li><strong>カルマン渦街の生成</strong>: 一定の風速で後流に渦が形成</li>
                    </ul>
                    
                    <h4>実際の例</h4>
                    <p>野球ボールが時速150kmで飛ぶとき、風速10m/sの横風があると約30cm軌道がずれます。</p>
                    
                    <h4>設定範囲</h4>
                    <p>0-20 m/s（無風〜強風、台風は40m/s以上）</p>
                `
            },
            'wind-direction': {
                title: '🧭 風向 (Wind Direction)',
                description: `
                    <h4>物理的影響</h4>
                    <p>風向は<strong>ベクトル場</strong>として作用し、ボールの軌道に方向性のある力を加えます。</p>
                    
                    <h4>具体的な効果</h4>
                    <ul>
                        <li><strong>コリオリ力の類似効果</strong>: 水平方向の力成分</li>
                        <li><strong>マグヌス効果との相互作用</strong>: 回転するボールとの複合効果</li>
                        <li><strong>3次元的な軌道変化</strong>: x-z平面での楕円軌道</li>
                    </ul>
                    
                    <h4>実際の例</h4>
                    <p>ゴルフボールが向かい風で飛ぶと飛距離が30%減少し、横風では最大50m横にそれることがあります。</p>
                    
                    <h4>設定範囲</h4>
                    <p>0-360° （北を0°とした方位角）</p>
                `
            },
            'temperature': {
                title: '🌡️ 気温 (Temperature)',
                description: `
                    <h4>物理的影響</h4>
                    <p>気温は<strong>理想気体の法則</strong> PV = nRT により空気密度を変化させます。</p>
                    
                    <h4>具体的な効果</h4>
                    <ul>
                        <li><strong>空気密度の変化</strong>: ρ = PM/(RT) （低温で密度増加）</li>
                        <li><strong>粘性係数の変化</strong>: μ ∝ T^0.76 （サザーランドの法則）</li>
                        <li><strong>音速の変化</strong>: v = √(γRT/M) （高温で増加）</li>
                    </ul>
                    
                    <h4>実際の例</h4>
                    <p>0°Cと30°Cでは空気密度が約10%異なり、野球ボールの飛距離は約5%変化します。高地や暑い日に記録が出やすいのはこのためです。</p>
                    
                    <h4>設定範囲</h4>
                    <p>-20°C〜50°C （極地から砂漠まで）</p>
                `
            },
            'air-pressure': {
                title: '💨 気圧 (Air Pressure)',
                description: `
                    <h4>物理的影響</h4>
                    <p>気圧は<strong>浮力の原理</strong>とベルヌーイの定理により、ボールに作用する力を変化させます。</p>
                    
                    <h4>具体的な効果</h4>
                    <ul>
                        <li><strong>空気密度への直接影響</strong>: ρ = P/(RT) （高気圧で密度増加）</li>
                        <li><strong>浮力の変化</strong>: F_b = ρ_air × V_ball × g</li>
                        <li><strong>圧力勾配力</strong>: ∇P による水平方向の力</li>
                    </ul>
                    
                    <h4>実際の例</h4>
                    <p>標高3000mのメキシコシティ（気圧約700hPa）では、海面レベルより野球ボールが約10%遠くまで飛びます。これが高地での記録更新の一因です。</p>
                    
                    <h4>設定範囲</h4>
                    <p>950-1050 hPa （台風の目〜高気圧）</p>
                `
            },
            'humidity': {
                title: '💧 湿度 (Humidity)',
                description: `
                    <h4>物理的影響</h4>
                    <p>湿度は<strong>混合気体の分子量</strong>を変化させ、空気密度に影響します。</p>
                    
                    <h4>具体的な効果</h4>
                    <ul>
                        <li><strong>見かけの分子量変化</strong>: H₂O (18) < N₂,O₂ (28,32) で軽くなる</li>
                        <li><strong>湿潤空気密度</strong>: ρ_humid = ρ_dry × (1 - 0.378 × e/P)</li>
                        <li><strong>表面張力効果</strong>: 球体表面での水分子の付着</li>
                    </ul>
                    
                    <h4>実際の例</h4>
                    <p>湿度100%の空気は乾燥空気より約0.8%軽いため、野球ボールは湿った日の方がわずかに遠くまで飛びます。プロ野球選手は天候を考慮して戦略を立てます。</p>
                    
                    <h4>設定範囲</h4>
                    <p>0-100% （砂漠〜熱帯雨林）</p>
                `
            },
            'turbulence': {
                title: '🌪️ 乱気流 (Turbulence)',
                description: `
                    <h4>物理的影響</h4>
                    <p>乱気流は<strong>ナヴィエ・ストークス方程式</strong>の非線形項により、予測困難な流体運動を生成します。</p>
                    
                    <h4>具体的な効果</h4>
                    <ul>
                        <li><strong>エディ粘性</strong>: ν_t >> ν （乱流粘性が分子粘性を凌駕）</li>
                        <li><strong>エネルギーカスケード</strong>: 大きな渦から小さな渦への連鎖</li>
                        <li><strong>コルモゴロフスケール</strong>: η = (ν³/ε)^(1/4) での最小渦サイズ</li>
                    </ul>
                    
                    <h4>実際の例</h4>
                    <p>航空機が乱気流に遭遇すると、翼周りの流れが不安定になり揚力が変動します。同様にボールも予測不可能な軌道を描きます。</p>
                    
                    <h4>設定範囲</h4>
                    <p>0-5 （無風状態〜激しい乱気流）</p>
                `
            },
        };
        
        return paramInfo[param] || {
            title: 'パラメーター情報',
            description: 'このパラメーターの情報は準備中です。'
        };
    }
    
    public dispose(): void {
        this.elements.startBtn.removeEventListener('click', this.onStart);
        this.elements.pauseBtn.removeEventListener('click', this.onPause);
        this.elements.resetBtn.removeEventListener('click', this.onReset);
    }
}