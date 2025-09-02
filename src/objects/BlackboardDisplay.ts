import * as THREE from 'three';

export class BlackboardDisplay {
    private scene: THREE.Scene;
    private textTexture!: THREE.Texture;
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private textMaterial!: THREE.MeshBasicMaterial;
    private piValue: number = 0;
    private lastUpdateTime: number = 0;
    private updateInterval: number = 100; // 100msごとに更新
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.createChalkTexture();
    }
    
    
    private createChalkTexture(): void {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 512;
        
        this.ctx = this.canvas.getContext('2d')!;
        
        // 黒板の背景色
        this.ctx.fillStyle = '#2F4F2F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // テクスチャ作成
        this.textTexture = new THREE.CanvasTexture(this.canvas);
        this.textMaterial = new THREE.MeshBasicMaterial({
            map: this.textTexture,
            transparent: true
        });
        
        // 黒板の手前にテキストプレーンを配置
        const textGeometry = new THREE.PlaneGeometry(3.6, 1.2); // 新しい黒板サイズに合わせて
        const textMesh = new THREE.Mesh(textGeometry, this.textMaterial);
        textMesh.position.set(0, -3.1, -2.85); // 黒板位置に合わせて調整
        textMesh.name = 'blackboard-text';
        
        this.scene.add(textMesh);
    }
    
    public updatePiValue(piValue: number, currentTime: number): void {
        // フレームレート制限
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        
        if (Math.abs(this.piValue - piValue) > 0.0001) {
            this.piValue = piValue;
            this.drawChalkText();
            this.lastUpdateTime = currentTime;
        }
    }
    
    private drawChalkText(): void {
        // キャンバスクリア
        this.ctx.fillStyle = '#2F4F2F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // チョークの質感を表現するためのノイズを追加
        this.addChalkNoise();
        
        // π値を描画
        this.drawPiEquation();
        
        // テクスチャ更新
        this.textTexture.needsUpdate = true;
    }
    
    private addChalkNoise(): void {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // チョークの粉っぽい質感を表現（より強いノイズ）
            const noise = Math.random() * 20 - 10;
            data[i] += noise;     // R
            data[i + 1] += noise; // G
            data[i + 2] += noise; // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    private drawPiEquation(): void {
        this.ctx.save();
        
        // チョークの色（より明るい白）
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        
        // 手書き風のフォント（より大きく見やすく）
        this.ctx.font = 'bold 80px "Comic Sans MS", cursive, serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // メインのπ値
        const piText = `π ≈ ${this.piValue.toFixed(6)}`;
        const x = this.canvas.width / 2;
        const y = this.canvas.height / 2;
        
        // 手書き風の効果のため、わずかに揺らぎを加える
        const wobbleX = (Math.random() - 0.5) * 5;
        const wobbleY = (Math.random() - 0.5) * 5;
        
        // チョークの重ね塗り効果（複数回描画）
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * 2;
            const offsetY = (Math.random() - 0.5) * 2;
            this.ctx.globalAlpha = 0.3 + i * 0.3;
            this.ctx.fillText(piText, x + wobbleX + offsetX, y + wobbleY + offsetY);
        }
        
        this.ctx.globalAlpha = 1.0;
        
        // チョークの質感を表現するため、テキストにノイズを加える
        this.addTextNoise(x + wobbleX, y + wobbleY);
        
        // 小さなサブテキスト
        this.ctx.font = 'bold 32px "Comic Sans MS", cursive, serif';
        this.ctx.fillStyle = '#EEEEEE';
        this.ctx.globalAlpha = 0.8;
        const subText = 'Monte Carlo Method';
        this.ctx.fillText(subText, x, y + 60);
        
        this.ctx.restore();
    }
    
    private addTextNoise(x: number, y: number): void {
        // テキストエリア周辺にチョークの粉を散らす
        this.ctx.save();
        
        // より多くのチョークダストを追加
        for (let i = 0; i < 100; i++) {
            const dustX = x + (Math.random() - 0.5) * 500;
            const dustY = y + (Math.random() - 0.5) * 150;
            const dustSize = Math.random() * 4 + 1;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
            this.ctx.beginPath();
            this.ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 筆跡のかすれを表現
        for (let j = 0; j < 20; j++) {
            const streakX = x + (Math.random() - 0.5) * 300;
            const streakY = y + (Math.random() - 0.5) * 50;
            const streakWidth = Math.random() * 30 + 10;
            const streakHeight = Math.random() * 3 + 1;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
            this.ctx.fillRect(streakX, streakY, streakWidth, streakHeight);
        }
        
        this.ctx.restore();
    }
    
    public dispose(): void {
        // テキストメッシュを削除
        const textMesh = this.scene.getObjectByName('blackboard-text');
        if (textMesh) {
            this.scene.remove(textMesh);
            const mesh = textMesh as THREE.Mesh;
            mesh.geometry.dispose();
            if (mesh.material instanceof THREE.Material) {
                mesh.material.dispose();
            }
        }
        
        // テクスチャを削除
        if (this.textTexture) {
            this.textTexture.dispose();
        }
    }
}