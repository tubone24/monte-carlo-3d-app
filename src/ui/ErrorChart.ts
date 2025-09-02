export class ErrorChart {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private errorHistory: number[] = [];
    private trialHistory: number[] = [];
    private piEstimateHistory: number[] = [];
    private insideHistory: number[] = [];
    private maxDataPoints: number = 100;
    private manualScale: number | null = null; // nullの場合は自動スケール
    private scaleValue: HTMLElement;
    
    constructor() {
        this.canvas = document.getElementById('error-chart') as HTMLCanvasElement;
        this.scaleValue = document.getElementById('scale-value') as HTMLElement;
        
        if (!this.canvas || !this.scaleValue) {
            throw new Error('Error chart elements not found');
        }
        
        this.ctx = this.canvas.getContext('2d')!;
        this.setupCanvas();
        this.setupScaleControls();
        this.drawEmptyChart();
    }
    
    private setupCanvas(): void {
        // 固定サイズで設定
        this.canvas.width = 350;
        this.canvas.height = 200;
        this.canvas.style.width = '350px';
        this.canvas.style.height = '200px';
    }
    
    private setupScaleControls(): void {
        const scaleUpBtn = document.getElementById('scale-up-btn') as HTMLButtonElement;
        const scaleDownBtn = document.getElementById('scale-down-btn') as HTMLButtonElement;
        
        scaleUpBtn?.addEventListener('click', () => {
            if (this.manualScale === null) {
                this.manualScale = Math.max(...this.errorHistory, 5);
            }
            this.manualScale *= 0.5; // スケールを半分に（拡大）
            this.manualScale = Math.max(this.manualScale, 0.1); // 最小0.1%
            this.updateScaleDisplay();
            this.drawChart();
        });
        
        scaleDownBtn?.addEventListener('click', () => {
            if (this.manualScale === null) {
                this.manualScale = Math.max(...this.errorHistory, 5);
            }
            this.manualScale *= 2; // スケールを2倍に（縮小）
            this.manualScale = Math.min(this.manualScale, 100); // 最大100%
            this.updateScaleDisplay();
            this.drawChart();
        });
        
        // ダブルクリックで自動スケールに戻る
        this.canvas.addEventListener('dblclick', () => {
            this.manualScale = null;
            this.updateScaleDisplay();
            this.drawChart();
        });
        
        // CSVダウンロードボタン
        const downloadBtn = document.getElementById('download-csv-btn') as HTMLButtonElement;
        downloadBtn?.addEventListener('click', () => {
            this.downloadCSV();
        });
    }
    
    private updateScaleDisplay(): void {
        if (this.manualScale === null) {
            this.scaleValue.textContent = '自動';
        } else {
            this.scaleValue.textContent = `0-${this.manualScale.toFixed(1)}%`;
        }
    }
    
    private getCurrentMaxError(): number {
        if (this.manualScale !== null) {
            return this.manualScale;
        }
        return Math.max(...this.errorHistory, 5);
    }
    
    public addDataPoint(totalBalls: number, error: number, piEstimate: number, insideBalls: number): void {
        this.trialHistory.push(totalBalls);
        this.errorHistory.push(Math.abs(error));
        this.piEstimateHistory.push(piEstimate);
        this.insideHistory.push(insideBalls);
        
        // データポイント数を制限
        if (this.errorHistory.length > this.maxDataPoints) {
            this.errorHistory.shift();
            this.trialHistory.shift();
            this.piEstimateHistory.shift();
            this.insideHistory.shift();
        }
        
        this.drawChart();
    }
    
    private drawEmptyChart(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 背景
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 軸を描画
        this.drawAxes();
        
        // 初期メッセージ
        this.ctx.fillStyle = '#999';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('シミュレーション開始後にグラフが表示されます', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    private drawChart(): void {
        if (this.errorHistory.length === 0) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 背景
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawAxes();
        this.drawErrorLine();
        this.drawTheoryLine();
        this.drawLegend();
    }
    
    private drawAxes(): void {
        const padding = 40;
        const width = 350 - padding * 2;
        const height = 200 - padding * 2;
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        // X軸
        this.ctx.beginPath();
        this.ctx.moveTo(padding, 200 - padding);
        this.ctx.lineTo(350 - padding, 200 - padding);
        this.ctx.stroke();
        
        // Y軸
        this.ctx.beginPath();
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, 200 - padding);
        this.ctx.stroke();
        
        // X軸の数値ラベル
        if (this.trialHistory.length > 0) {
            const minTrials = Math.min(...this.trialHistory);
            const maxTrials = Math.max(...this.trialHistory);
            
            this.ctx.fillStyle = '#666';
            this.ctx.font = '10px sans-serif';
            this.ctx.textAlign = 'center';
            
            // X軸に5つの目盛り
            for (let i = 0; i <= 4; i++) {
                const trials = minTrials + (maxTrials - minTrials) * (i / 4);
                const x = padding + (i / 4) * width;
                
                // 目盛り線
                this.ctx.beginPath();
                this.ctx.moveTo(x, 200 - padding);
                this.ctx.lineTo(x, 200 - padding + 5);
                this.ctx.stroke();
                
                // 数値ラベル
                this.ctx.fillText(this.formatNumber(trials), x, 200 - padding + 15);
            }
        }
        
        // Y軸の数値ラベル
        if (this.errorHistory.length > 0) {
            const maxError = this.getCurrentMaxError();
            
            this.ctx.textAlign = 'right';
            
            // Y軸に5つの目盛り
            for (let i = 0; i <= 4; i++) {
                const error = maxError * (i / 4);
                const y = 200 - padding - (i / 4) * height;
                
                // 目盛り線
                this.ctx.beginPath();
                this.ctx.moveTo(padding - 5, y);
                this.ctx.lineTo(padding, y);
                this.ctx.stroke();
                
                // 数値ラベル
                this.ctx.fillText(error.toFixed(1) + '%', padding - 8, y + 3);
            }
        }
        
        // 軸ラベル
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('試行数', 350 / 2, 200 - 5);
        
        this.ctx.save();
        this.ctx.translate(15, 200 / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('誤差 (%)', 0, 0);
        this.ctx.restore();
    }
    
    private formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        } else {
            return Math.round(num).toString();
        }
    }
    
    private drawErrorLine(): void {
        if (this.errorHistory.length < 2) return;
        
        const padding = 40;
        const width = 350 - padding * 2;
        const height = 200 - padding * 2;
        
        const minTrials = Math.min(...this.trialHistory);
        const maxTrials = Math.max(...this.trialHistory);
        const maxError = this.getCurrentMaxError();
        
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        this.errorHistory.forEach((error, index) => {
            const trials = this.trialHistory[index];
            const x = padding + ((trials - minTrials) / (maxTrials - minTrials || 1)) * width;
            const y = 200 - padding - (error / maxError) * height;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // データポイントを描画
        this.ctx.fillStyle = '#667eea';
        this.errorHistory.forEach((error, index) => {
            const trials = this.trialHistory[index];
            const x = padding + ((trials - minTrials) / (maxTrials - minTrials || 1)) * width;
            const y = 200 - padding - (error / maxError) * height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    private drawTheoryLine(): void {
        if (this.trialHistory.length < 2) return;
        
        const padding = 40;
        const width = 350 - padding * 2;
        const height = 200 - padding * 2;
        
        const minTrials = Math.min(...this.trialHistory);
        const maxTrials = Math.max(...this.trialHistory);
        const maxError = this.getCurrentMaxError();
        
        // 理論的な誤差減少線 (1/√n)
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        
        const samples = 50;
        
        for (let i = 0; i < samples; i++) {
            const trials = minTrials + (maxTrials - minTrials) * (i / samples);
            const theoreticalError = 100 / Math.sqrt(trials); // 理論的な誤差減少を調整
            
            const x = padding + (i / samples) * width;
            const y = 200 - padding - Math.min(theoreticalError / maxError * height, height);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    private drawLegend(): void {
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'left';
        
        // 実測値
        this.ctx.fillStyle = '#667eea';
        this.ctx.fillRect(50, 20, 15, 3);
        this.ctx.fillStyle = '#333';
        this.ctx.fillText('実測誤差', 70, 25);
        
        // 理論値
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(50, 35);
        this.ctx.lineTo(65, 35);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = '#333';
        this.ctx.fillText('理論値 (1/√n)', 70, 38);
    }
    
    private downloadCSV(): void {
        if (this.trialHistory.length === 0) {
            alert('ダウンロードするデータがありません。シミュレーションを開始してください。');
            return;
        }
        
        // CSV データを作成
        let csvContent = '試行数,円内ボール数,π推定値,誤差(%),タイムスタンプ\n';
        
        for (let i = 0; i < this.trialHistory.length; i++) {
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const row = [
                this.trialHistory[i],
                this.insideHistory[i],
                this.piEstimateHistory[i].toFixed(6),
                this.errorHistory[i].toFixed(3),
                timestamp
            ].join(',');
            csvContent += row + '\n';
        }
        
        // ファイルをダウンロード
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const now = new Date();
        const fileName = `monte_carlo_simulation_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}.csv`;
        link.setAttribute('download', fileName);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
    
    public reset(): void {
        this.errorHistory = [];
        this.trialHistory = [];
        this.piEstimateHistory = [];
        this.insideHistory = [];
        this.manualScale = null;
        this.updateScaleDisplay();
        this.drawEmptyChart();
    }
    
    public dispose(): void {
        // 特に処理なし
    }
}