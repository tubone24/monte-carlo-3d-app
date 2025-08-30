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
        const textGeometry = new THREE.PlaneGeometry(20, 10);
        const textMesh = new THREE.Mesh(textGeometry, this.textMaterial);
        textMesh.position.set(0, 10, -24.3); // 黒板よりわずかに手前
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
            // チョークの粉っぽい質感を表現
            const noise = Math.random() * 10 - 5;
            data[i] += noise;     // R
            data[i + 1] += noise; // G
            data[i + 2] += noise; // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    private drawPiEquation(): void {
        this.ctx.save();
        
        // チョークの色（白っぽい色）
        this.ctx.fillStyle = '#F5F5DC';
        this.ctx.strokeStyle = '#F5F5DC';
        this.ctx.lineWidth = 2;
        
        // 手書き風のフォント
        this.ctx.font = 'bold 80px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // メインのπ値
        const piText = `π ≈ ${this.piValue.toFixed(6)}`;
        const x = this.canvas.width / 2;
        const y = this.canvas.height / 2;
        
        // 手書き風の効果のため、わずかに揺らぎを加える
        const wobbleX = (Math.random() - 0.5) * 3;
        const wobbleY = (Math.random() - 0.5) * 3;
        
        // 影効果
        this.ctx.fillStyle = 'rgba(220, 220, 220, 0.3)';
        this.ctx.fillText(piText, x + wobbleX + 2, y + wobbleY + 2);
        
        // メインテキスト
        this.ctx.fillStyle = '#F5F5DC';
        this.ctx.fillText(piText, x + wobbleX, y + wobbleY);
        
        // チョークの質感を表現するため、テキストにノイズを加える
        this.addTextNoise(x + wobbleX, y + wobbleY);
        
        // 小さなサブテキスト
        this.ctx.font = 'bold 32px serif';
        this.ctx.fillStyle = '#E0E0E0';
        const subText = 'Monte Carlo Method';
        this.ctx.fillText(subText, x, y + 80);
        
        this.ctx.restore();
    }
    
    private addTextNoise(x: number, y: number): void {
        // テキストエリア周辺にチョークの粉を散らす
        this.ctx.save();
        
        for (let i = 0; i < 30; i++) {
            const dustX = x + (Math.random() - 0.5) * 400;
            const dustY = y + (Math.random() - 0.5) * 100;
            const dustSize = Math.random() * 3 + 1;
            
            this.ctx.fillStyle = `rgba(245, 245, 220, ${Math.random() * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
            this.ctx.fill();
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