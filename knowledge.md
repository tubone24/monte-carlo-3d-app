# TypeScript + Three.js プロジェクトセットアップガイド

## 1. プロジェクトの初期化

```bash
# プロジェクトディレクトリの作成
mkdir monte-carlo-3d-app
cd monte-carlo-3d-app

# npmプロジェクトの初期化
npm init -y

# TypeScriptと必要なパッケージのインストール
npm install --save-dev typescript webpack webpack-cli webpack-dev-server ts-loader html-webpack-plugin
npm install three @types/three
```

## 2. TypeScript設定ファイル（tsconfig.json）

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 3. Webpack設定ファイル（webpack.config.js）

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.(gltf|glb)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'モンテカルロ法3D可視化'
    })
  ],
  devServer: {
    static: './dist',
    hot: true,
    open: true,
    port: 3000
  }
};
```

## 4. メインTypeScriptファイル構造

### src/types/index.ts
```typescript
import * as THREE from 'three';

export interface Ball {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    isInside: boolean;
    hasLanded: boolean;
    id: string;
}

export interface SimulationConfig {
    circleRadius: number;
    dropHeight: number;
    floorLevel: number;
    gravity: number;
    bounceDamping: number;
    maxBalls: number;
}

export interface SimulationStats {
    totalBalls: number;
    insideBalls: number;
    piEstimate: number;
    error: number;
}
```

### src/scene/SceneManager.ts
```typescript
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
        // 環境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // ディレクショナルライト
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
        this.camera.position.x = Math.cos(time) * 30;
        this.camera.position.z = Math.sin(time) * 30;
        this.camera.lookAt(0, -5, 0);
    }
}
```

### src/objects/ClassroomBuilder.ts
```typescript
import * as THREE from 'three';

export class ClassroomBuilder {
    private scene: THREE.Scene;
    private floorLevel: number;
    
    constructor(scene: THREE.Scene, floorLevel: number = -5) {
        this.scene = scene;
        this.floorLevel = floorLevel;
    }
    
    public build(): void {
        this.createFloor();
        this.createWalls();
        this.createBlackboard();
        this.createDesks();
    }
    
    private createFloor(): void {
        const geometry = new THREE.PlaneGeometry(50, 50);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x8B7355,
            side: THREE.DoubleSide 
        });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = this.floorLevel;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }
    
    private createWalls(): void {
        const wallGeometry = new THREE.PlaneGeometry(50, 40);
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xF5DEB3,
            side: THREE.DoubleSide 
        });
        
        // 背面の壁
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.z = -25;
        backWall.position.y = 15;
        backWall.receiveShadow = true;
        this.scene.add(backWall);
        
        // 左側の壁
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.position.x = -25;
        leftWall.position.y = 15;
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);
    }
    
    private createBlackboard(): void {
        const geometry = new THREE.BoxGeometry(20, 10, 0.5);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x2F4F2F 
        });
        const blackboard = new THREE.Mesh(geometry, material);
        blackboard.position.set(0, 10, -24.5);
        blackboard.castShadow = true;
        this.scene.add(blackboard);
        
        // チョークトレイ
        const trayGeometry = new THREE.BoxGeometry(20, 0.5, 1);
        const trayMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513 
        });
        const tray = new THREE.Mesh(trayGeometry, trayMaterial);
        tray.position.set(0, 5, -24);
        this.scene.add(tray);
    }
    
    private createDesks(): void {
        const deskPositions = [
            { x: -15, z: 5 },
            { x: -15, z: -5 },
            { x: -7, z: 5 },
            { x: -7, z: -5 },
            { x: 7, z: 5 },
            { x: 7, z: -5 },
            { x: 15, z: 5 },
            { x: 15, z: -5 },
            { x: 0, z: 10 }
        ];
        
        deskPositions.forEach(pos => {
            this.createDesk(pos.x, pos.z);
        });
    }
    
    private createDesk(x: number, z: number): void {
        // 天板
        const topGeometry = new THREE.BoxGeometry(4, 0.5, 2);
        const topMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513 
        });
        const deskTop = new THREE.Mesh(topGeometry, topMaterial);
        deskTop.position.set(x, this.floorLevel + 3, z);
        deskTop.castShadow = true;
        deskTop.receiveShadow = true;
        this.scene.add(deskTop);
        
        // 脚
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
        const legMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x696969 
        });
        
        const legOffsets = [
            { x: -1.8, z: -0.8 },
            { x: 1.8, z: -0.8 },
            { x: -1.8, z: 0.8 },
            { x: 1.8, z: 0.8 }
        ];
        
        legOffsets.forEach(offset => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(
                x + offset.x, 
                this.floorLevel + 1.5, 
                z + offset.z
            );
            leg.castShadow = true;
            this.scene.add(leg);
        });
    }
}
```

### src/physics/BallPhysics.ts
```typescript
import * as THREE from 'three';
import { Ball } from '../types';

export class BallPhysics {
    private gravity: number = -30;
    private bounceDamping: number = 0.7;
    private groundLevel: number;
    
    constructor(groundLevel: number) {
        this.groundLevel = groundLevel + 0.3;
    }
    
    public update(balls: Ball[], deltaTime: number): void {
        balls.forEach(ball => {
            if (!ball.hasLanded) {
                // 重力を適用
                ball.velocity.y += this.gravity * deltaTime;
                
                // 位置を更新
                ball.mesh.position.y += ball.velocity.y * deltaTime;
                
                // 地面との衝突判定
                if (ball.mesh.position.y <= this.groundLevel) {
                    ball.mesh.position.y = this.groundLevel;
                    
                    // バウンド処理
                    if (Math.abs(ball.velocity.y) > 0.5) {
                        ball.velocity.y = -ball.velocity.y * this.bounceDamping;
                        
                        // 横方向にわずかなランダムな動きを追加
                        ball.velocity.x = (Math.random() - 0.5) * 0.5;
                        ball.velocity.z = (Math.random() - 0.5) * 0.5;
                    } else {
                        ball.velocity.set(0, 0, 0);
                        ball.hasLanded = true;
                    }
                }
                
                // 横方向の動きを適用（摩擦）
                ball.mesh.position.x += ball.velocity.x * deltaTime;
                ball.mesh.position.z += ball.velocity.z * deltaTime;
                ball.velocity.x *= 0.98;
                ball.velocity.z *= 0.98;
                
                // 回転を追加
                ball.mesh.rotation.x += ball.velocity.y * 0.01;
                ball.mesh.rotation.z += ball.velocity.x * 0.01;
            }
        });
    }
}
```

## 5. package.jsonのスクリプト設定

```json
{
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/**/*.ts"
  }
}
```

## 6. 開発サーバーの起動

```bash
# 開発サーバーを起動
npm start

# プロダクションビルド
npm run build
```

## 7. 追加推奨パッケージ

### パフォーマンス最適化
```bash
npm install --save-dev terser-webpack-plugin css-minimizer-webpack-plugin
```

### 物理エンジン（オプション）
```bash
npm install cannon-es @types/cannon-es
```

### アニメーションライブラリ
```bash
npm install gsap @types/gsap
```

### デバッグツール
```bash
npm install dat.gui @types/dat.gui
npm install stats.js @types/stats.js
```

## 8. ESLint設定（.eslintrc.json）

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

## 9. プロジェクト構造

```
monte-carlo-3d-app/
├── src/
│   ├── index.ts           # エントリーポイント
│   ├── index.html         # HTMLテンプレート
│   ├── types/             # 型定義
│   │   └── index.ts
│   ├── scene/             # シーン管理
│   │   ├── SceneManager.ts
│   │   └── CameraController.ts
│   ├── objects/           # 3Dオブジェクト
│   │   ├── ClassroomBuilder.ts
│   │   ├── BallFactory.ts
│   │   └── CircleArea.ts
│   ├── physics/           # 物理シミュレーション
│   │   └── BallPhysics.ts
│   ├── ui/                # UI管理
│   │   ├── UIManager.ts
│   │   └── StatsDisplay.ts
│   ├── utils/             # ユーティリティ
│   │   └── MathUtils.ts
│   └── assets/            # アセット
│       ├── models/
│       └── textures/
├── dist/                  # ビルド出力
├── node_modules/
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## 10. デプロイ

### GitHub Pages
```bash
# gh-pagesパッケージをインストール
npm install --save-dev gh-pages

# package.jsonにデプロイスクリプトを追加
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# デプロイ実行
npm run deploy
```

### Vercel
```bash
# Vercel CLIをインストール
npm install -g vercel

# デプロイ
vercel --prod
```

## トラブルシューティング

### Three.jsの型エラー
```typescript
// グローバル型定義を追加
declare global {
  interface Window {
    THREE: typeof THREE;
  }
}
```

### WebGL未対応ブラウザ対策
```typescript
if (!WebGLRenderingContext) {
  console.error('WebGL is not supported');
  // フォールバック処理
}
```

### パフォーマンス最適化
- ジオメトリの再利用
- テクスチャの圧縮
- LOD（Level of Detail）の実装
- オブジェクトプーリング