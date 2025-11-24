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
      terrainCompositeTexture,
      atlasTexture,
      colormapTexture,
      heightmapTexture,
      normalMapTexture,
      waterNormal1,
      waterNormal2,
    ] = await Promise.all([
      // Use pre-processed final_map_composite.png (de-dithered by Python script)
      this.loadTexture(textureLoader, '/final_map_composite.png', THREE.LinearFilter, THREE.LinearFilter, false, false),
      this.loadTexture(textureLoader, '/atlas0.png', THREE.LinearMipMapLinearFilter, THREE.LinearFilter, true, true),
      this.loadTexture(textureLoader, '/colormap_land.png', THREE.LinearMipMapLinearFilter, THREE.LinearFilter, false, true),
      this.loadTexture(textureLoader, '/heightmap.png', THREE.LinearFilter, THREE.LinearFilter, false, false),
      this.loadTexture(textureLoader, '/atlas_normal0.png', THREE.LinearFilter, THREE.LinearFilter, false, false),
      this.loadTexture(textureLoader, '/colormap_water_1.png', THREE.LinearMipMapLinearFilter, THREE.LinearFilter, true, true),
      this.loadTexture(textureLoader, '/colormap_water_2.png', THREE.LinearMipMapLinearFilter, THREE.LinearFilter, true, true),
    ]);

    console.log('All textures loaded');

    // Create terrain mesh
    await this.createTerrainMesh(
      terrainCompositeTexture,
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
    repeat: boolean = true,
    useAnisotropy: boolean = false
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
          // Apply anisotropic filtering for improved clarity at shallow angles
          if (useAnisotropy) {
            const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
            texture.anisotropy = maxAnisotropy;
          }
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  private async createTerrainMesh(
    terrainCompositeTexture: THREE.Texture,
    atlasTexture: THREE.Texture,
    colormapTexture: THREE.Texture,
    heightmapTexture: THREE.Texture,
    normalMapTexture: THREE.Texture
  ): Promise<void> {
    // Create plane geometry (simple, no heightmap displacement for now)
    const geometry = new THREE.PlaneGeometry(
      this.mapWidth,
      this.mapHeight,
      1,
      1
    );

    // Create a blank political texture (will be updated later from canvas)
    const politicalTexture = new THREE.Texture();
    politicalTexture.minFilter = THREE.LinearFilter;
    politicalTexture.magFilter = THREE.LinearFilter;
    politicalTexture.wrapS = THREE.ClampToEdgeWrapping;
    politicalTexture.wrapT = THREE.ClampToEdgeWrapping;

    // SIMPLIFIED: Use pre-rendered composite directly instead of shader-based terrain
    // The Python script already did all the heavy lifting (de-dithering, water, lighting)
    const material = new THREE.MeshBasicMaterial({
      map: terrainCompositeTexture,
      transparent: false,
      side: THREE.FrontSide,
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.position.set(0, 0, 0);
    this.scene.add(this.terrainMesh);

    // Add POLITICAL OVERLAY mesh on top of terrain (z = 0.1)
    const politicalGeometry = new THREE.PlaneGeometry(this.mapWidth, this.mapHeight, 1, 1);
    const politicalMaterial = new THREE.MeshBasicMaterial({
      map: politicalTexture,
      transparent: true,
      opacity: 0.65, // 65% political overlay (adjust to taste)
      side: THREE.FrontSide,
      depthTest: false, // Always render on top
    });

    this.politicalOverlayMesh = new THREE.Mesh(politicalGeometry, politicalMaterial);
    this.politicalOverlayMesh.position.set(0, 0, 0.1); // Slightly above terrain
    this.scene.add(this.politicalOverlayMesh);

    // Store uniforms for later updates
    this.terrainUniforms = {
      terrainCompositeTexture: { value: terrainCompositeTexture },
      politicalTexture: { value: politicalTexture },
      politicalOpacity: { value: 0.65 },
    };

    console.log('Terrain mesh created (using pre-processed composite)');
    console.log('Political overlay mesh added (65% opacity)');
  }

  private async createWaterMesh(waterNormal1: THREE.Texture, waterNormal2: THREE.Texture): Promise<void> {
    // Water plane sits below terrain (simple solid blue for now - no waves to reduce lag)
    const geometry = new THREE.PlaneGeometry(this.mapWidth, this.mapHeight);

    // Simple solid blue water (animated waves disabled to reduce lag)
    this.waterUniforms = {
      waterColor: { value: new THREE.Color(0x5a7d9a) }, // Lighter HOI4-style ocean blue
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

  /**
   * Update the political texture from a canvas element
   * Call this after the political map is rebuilt
   */
  updatePoliticalTexture(canvas: HTMLCanvasElement): void {
    if (!this.terrainUniforms || !this.terrainUniforms.politicalTexture) {
      console.warn('Political texture uniform not initialized');
      return;
    }

    const texture = this.terrainUniforms.politicalTexture.value;
    texture.image = canvas;
    texture.needsUpdate = true;

    // Also update the political overlay mesh material
    if (this.politicalOverlayMesh && this.politicalOverlayMesh.material) {
      (this.politicalOverlayMesh.material as THREE.MeshBasicMaterial).map = texture;
      (this.politicalOverlayMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }

    console.log('Political texture updated from canvas', {
      width: canvas.width,
      height: canvas.height
    });
  }

  /**
   * Set the political overlay opacity (0 = hidden, 1 = full)
   */
  setPoliticalOpacity(opacity: number): void {
    const clampedOpacity = Math.max(0, Math.min(1, opacity));

    // Update stored value
    if (this.terrainUniforms && this.terrainUniforms.politicalOpacity) {
      this.terrainUniforms.politicalOpacity.value = clampedOpacity;
    }

    // Update the actual mesh material opacity
    if (this.politicalOverlayMesh && this.politicalOverlayMesh.material) {
      (this.politicalOverlayMesh.material as THREE.MeshBasicMaterial).opacity = clampedOpacity;
    }
  }

  /**
   * Get the current political overlay opacity
   */
  getPoliticalOpacity(): number {
    return this.terrainUniforms?.politicalOpacity?.value ?? 0.65;
  }
}
