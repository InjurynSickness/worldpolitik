import * as THREE from 'three';
import terrainVertexShader from '../shaders/terrainVertex.glsl?raw';
import terrainFragmentShader from '../shaders/terrainFragment.glsl?raw';
import waterVertexShader from '../shaders/waterVertex.glsl?raw';
import waterFragmentShader from '../shaders/waterFragment.glsl?raw';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export class ThreeJSMapRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private terrainMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private borderLines: THREE.LineSegments | null = null;
  private politicalOverlayMesh: THREE.Mesh | null = null;

  private mapWidth: number = 5632;
  private mapHeight: number = 2048;

  private animationFrameId: number | null = null;
  private startTime: number = Date.now();

  // Shader uniforms
  private terrainUniforms: any = null;
  private waterUniforms: any = null;

  constructor(private canvas: HTMLCanvasElement) {
    // Create Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Create orthographic camera (top-down 2D view)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      -this.mapWidth / 2,
      this.mapWidth / 2,
      this.mapHeight / 2,
      -this.mapHeight / 2,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);

    const aspect = width / height;
    const frustumHeight = this.mapHeight;
    const frustumWidth = frustumHeight * aspect;

    this.camera.left = -frustumWidth / 2;
    this.camera.right = frustumWidth / 2;
    this.camera.top = frustumHeight / 2;
    this.camera.bottom = -frustumHeight / 2;
    this.camera.updateProjectionMatrix();
  }

  async initialize(): Promise<void> {
    console.log('Initializing Three.js map renderer...');

    // Load all textures
    const textureLoader = new THREE.TextureLoader();

    const [
      terrainIndexTexture,
      atlasTexture,
      colormapTexture,
      heightmapTexture,
      normalMapTexture,
      waterNormal1,
      waterNormal2,
    ] = await Promise.all([
      this.loadTexture(textureLoader, '/terrain_indexed.png', THREE.NearestFilter, THREE.NearestFilter, false),
      this.loadTexture(textureLoader, '/atlas0.png', THREE.LinearFilter, THREE.LinearFilter, true),
      this.loadTexture(textureLoader, '/colormap_land.png', THREE.LinearFilter, THREE.LinearFilter, false),
      this.loadTexture(textureLoader, '/heightmap.png', THREE.LinearFilter, THREE.LinearFilter, false),
      this.loadTexture(textureLoader, '/atlas_normal0.png', THREE.LinearFilter, THREE.LinearFilter, false),
      this.loadTexture(textureLoader, '/colormap_water_1.png', THREE.LinearFilter, THREE.LinearFilter, true),
      this.loadTexture(textureLoader, '/colormap_water_2.png', THREE.LinearFilter, THREE.LinearFilter, true),
    ]);

    console.log('All textures loaded');

    // Create terrain mesh
    await this.createTerrainMesh(
      terrainIndexTexture,
      atlasTexture,
      colormapTexture,
      heightmapTexture,
      normalMapTexture
    );

    // Create water mesh
    await this.createWaterMesh(waterNormal1, waterNormal2);

    console.log('Three.js initialization complete');
  }

  private loadTexture(
    loader: THREE.TextureLoader,
    url: string,
    minFilter: THREE.TextureFilter,
    magFilter: THREE.TextureFilter,
    repeat: boolean = true
  ): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (texture) => {
          texture.minFilter = minFilter;
          texture.magFilter = magFilter;
          // RepeatWrapping prevents stretching artifacts at edges
          if (repeat) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
          } else {
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
          }
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  private async createTerrainMesh(
    terrainIndexTexture: THREE.Texture,
    atlasTexture: THREE.Texture,
    colormapTexture: THREE.Texture,
    heightmapTexture: THREE.Texture,
    normalMapTexture: THREE.Texture
  ): Promise<void> {
    // Create plane geometry with many segments for heightmap displacement
    const geometry = new THREE.PlaneGeometry(
      this.mapWidth,
      this.mapHeight,
      1000,
      1000
    );

    // Create shader material uniforms
    this.terrainUniforms = {
      terrainIndexTexture: { value: terrainIndexTexture },
      atlasTexture: { value: atlasTexture },
      colormapTexture: { value: colormapTexture },
      heightmapTexture: { value: heightmapTexture },
      normalMapTexture: { value: normalMapTexture },
      heightScale: { value: 10.0 }, // Adjust for desired terrain height
      lightDirection: { value: new THREE.Vector3(-0.6, -0.6, 0.8).normalize() },
      lightIntensity: { value: 0.5 },   // Reduced to prevent over-brightening
      ambientIntensity: { value: 0.6 }, // INCREASED: Prevents pitch-black shadows
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.terrainUniforms,
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      side: THREE.FrontSide,
      transparent: true,      // CRITICAL: Enable transparency for water cutouts
      depthWrite: true,
      depthTest: true,
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.position.set(0, 0, 0);
    this.scene.add(this.terrainMesh);

    console.log('Terrain mesh created');
  }

  private async createWaterMesh(waterNormal1: THREE.Texture, waterNormal2: THREE.Texture): Promise<void> {
    // Water plane sits below terrain (simple solid blue for now - no waves to reduce lag)
    const geometry = new THREE.PlaneGeometry(this.mapWidth, this.mapHeight);

    // Simple solid blue water (animated waves disabled to reduce lag)
    this.waterUniforms = {
      waterColor: { value: new THREE.Color(0x2a4d6e) }, // HOI4-style ocean blue
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.waterUniforms,
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      side: THREE.FrontSide,
    });

    this.waterMesh = new THREE.Mesh(geometry, material);
    this.waterMesh.position.set(0, 0, -1); // Below terrain (z = -1)
    this.scene.add(this.waterMesh);

    console.log('Water mesh created (simple blue)');
  }

  updateCamera(camera: Camera): void {
    // Update orthographic camera based on camera state
    const aspect = window.innerWidth / window.innerHeight;
    const zoom = camera.zoom;

    const frustumHeight = this.mapHeight / zoom;
    const frustumWidth = frustumHeight * aspect;

    this.camera.left = -frustumWidth / 2;
    this.camera.right = frustumWidth / 2;
    this.camera.top = frustumHeight / 2;
    this.camera.bottom = -frustumHeight / 2;
    this.camera.updateProjectionMatrix();

    // Update camera position for panning
    this.camera.position.set(camera.x, -camera.y, 100);
  }

  render(camera: Camera): void {
    // Update camera
    this.updateCamera(camera);

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  startAnimationLoop(getCamera: () => Camera): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      const camera = getCamera();
      this.render(camera);
    };
    animate();
  }

  stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  dispose(): void {
    this.stopAnimationLoop();
    window.removeEventListener('resize', this.handleResize.bind(this));

    // Dispose Three.js resources
    if (this.terrainMesh) {
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
    }
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      (this.waterMesh.material as THREE.Material).dispose();
    }

    this.renderer.dispose();
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }
}
