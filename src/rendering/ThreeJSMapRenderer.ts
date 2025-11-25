// /src/rendering/ThreeJSMapRenderer.ts
// Complete rewrite: Uses Canvas 2D canvases as Three.js textures
// Version 2.0.0 - Gemini's layered approach

import * as THREE from 'three';

export class ThreeJSMapRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;

  // Group to hold all map layers (allows pan/zoom transform)
  private mapGroup: THREE.Group;

  // Meshes for each layer
  private waterMesh: THREE.Mesh | null = null;
  private terrainMesh: THREE.Mesh | null = null;
  private politicalMesh: THREE.Mesh | null = null;
  private riversMesh: THREE.Mesh | null = null;
  private bordersMesh: THREE.Mesh | null = null;
  private overlaysMesh: THREE.Mesh | null = null;

  // Textures (updated from Canvas 2D)
  private terrainTexture: THREE.CanvasTexture | null = null;
  private politicalTexture: THREE.CanvasTexture | null = null;
  private riversTexture: THREE.CanvasTexture | null = null;
  private bordersTexture: THREE.CanvasTexture | null = null;
  private overlaysTexture: THREE.CanvasTexture | null = null;

  // Map dimensions
  private mapWidth: number;
  private mapHeight: number;

  // Animation loop control
  private animationFrameId: number | null = null;

  constructor(container: HTMLElement, mapWidth: number, mapHeight: number) {
    console.log('[ThreeJSMapRenderer v2.0] Initializing...');

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    // 1. Create WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x334a5e); // Ocean background color

    // Replace any existing canvas
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) existingCanvas.remove();
    container.appendChild(this.renderer.domElement);

    // 2. Setup Scene
    this.scene = new THREE.Scene();
    this.mapGroup = new THREE.Group();
    this.scene.add(this.mapGroup);

    // 3. Setup Orthographic Camera (2D view)
    // Camera views from (-width/2, -height/2) to (width/2, height/2) centered on origin
    const halfWidth = container.clientWidth / 2;
    const halfHeight = container.clientHeight / 2;
    this.camera = new THREE.OrthographicCamera(
      -halfWidth, halfWidth,      // left, right
      halfHeight, -halfHeight,     // top, bottom (inverted for Canvas 2D coordinate system)
      -100, 100                    // near, far
    );
    this.camera.position.z = 10;

    console.log('[ThreeJSMapRenderer v2.0] Initialized successfully');
  }

  /**
   * Initialize all map layers from Canvas 2D canvases
   * Call this after all canvases are prepared
   */
  public initMapLayers(
    waterCanvas: HTMLCanvasElement,
    terrainCanvas: HTMLCanvasElement,
    politicalCanvas: HTMLCanvasElement,
    riversCanvas: HTMLCanvasElement,
    bordersCanvas: HTMLCanvasElement,
    overlaysCanvas: HTMLCanvasElement
  ): void {
    console.log('[ThreeJSMapRenderer v2.0] Setting up map layers...');
    console.log(`[ThreeJSMapRenderer v2.0] Map dimensions: ${this.mapWidth}x${this.mapHeight}`);
    console.log(`[ThreeJSMapRenderer v2.0] Camera frustum: left=${this.camera.left}, right=${this.camera.right}, top=${this.camera.top}, bottom=${this.camera.bottom}`);

    // Create plane geometry (reused for all layers)
    // Geometry is centered at origin (0, 0)
    const geometry = new THREE.PlaneGeometry(this.mapWidth, this.mapHeight);

    // Layer 0: Water Background (z = -1)
    this.waterMesh = this.createLayer(waterCanvas, geometry, -1, 1.0, false);
    console.log('[ThreeJSMapRenderer v2.0]   Layer 0: Water (z=-1)');

    // Layer 1: Terrain (z = 0)
    this.terrainTexture = new THREE.CanvasTexture(terrainCanvas);
    this.terrainTexture.minFilter = THREE.LinearFilter;
    this.terrainTexture.magFilter = THREE.LinearFilter;

    this.terrainMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: this.terrainTexture,
        transparent: true,
        opacity: 1.0
      })
    );
    this.terrainMesh.position.z = 0;
    this.mapGroup.add(this.terrainMesh);
    console.log('[ThreeJSMapRenderer v2.0]   Layer 1: Terrain (z=0)');

    // Layer 2: Political Colors (z = 0.1)
    this.politicalTexture = new THREE.CanvasTexture(politicalCanvas);
    this.politicalTexture.minFilter = THREE.NearestFilter; // Sharp borders
    this.politicalTexture.magFilter = THREE.NearestFilter;

    this.politicalMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: this.politicalTexture,
        transparent: true,
        opacity: 0.65, // 65% opacity for country colors
        depthTest: false
      })
    );
    this.politicalMesh.position.z = 0.1;
    this.mapGroup.add(this.politicalMesh);
    console.log('[ThreeJSMapRenderer v2.0]   Layer 2: Political overlay (z=0.1, 65% opacity)');

    // Layer 3: Rivers (z = 0.2)
    this.riversTexture = new THREE.CanvasTexture(riversCanvas);
    this.riversMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: this.riversTexture,
        transparent: true,
        opacity: 0.6,
        depthTest: false
      })
    );
    this.riversMesh.position.z = 0.2;
    this.mapGroup.add(this.riversMesh);
    console.log('[ThreeJSMapRenderer v2.0]   Layer 3: Rivers (z=0.2)');

    // Layer 4: Borders (z = 0.3)
    this.bordersTexture = new THREE.CanvasTexture(bordersCanvas);
    this.bordersMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: this.bordersTexture,
        transparent: true,
        depthTest: false
      })
    );
    this.bordersMesh.position.z = 0.3;
    this.mapGroup.add(this.bordersMesh);
    console.log('[ThreeJSMapRenderer v2.0]   Layer 4: Borders (z=0.3)');

    // Layer 5: Overlays/Labels (z = 0.4)
    this.overlaysTexture = new THREE.CanvasTexture(overlaysCanvas);
    this.overlaysMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: this.overlaysTexture,
        transparent: true,
        depthTest: false
      })
    );
    this.overlaysMesh.position.z = 0.4;
    this.mapGroup.add(this.overlaysMesh);
    console.log('[ThreeJSMapRenderer v2.0]   Layer 5: Overlays (z=0.4)');

    console.log('[ThreeJSMapRenderer v2.0] All layers initialized');
    this.renderFrame();
  }

  private createLayer(
    canvas: HTMLCanvasElement,
    geometry: THREE.PlaneGeometry,
    zPosition: number,
    opacity: number,
    depthTest: boolean
  ): THREE.Mesh {
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: opacity,
      depthTest: depthTest
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = zPosition;
    this.mapGroup.add(mesh);
    return mesh;
  }

  /**
   * Update texture when Canvas 2D changes
   */
  public updateTerrainTexture(canvas: HTMLCanvasElement): void {
    if (this.terrainTexture) {
      this.terrainTexture.image = canvas;
      this.terrainTexture.needsUpdate = true;
      this.renderFrame();
    }
  }

  public updatePoliticalTexture(canvas: HTMLCanvasElement): void {
    if (this.politicalTexture) {
      this.politicalTexture.image = canvas;
      this.politicalTexture.needsUpdate = true;
      this.renderFrame();
    }
  }

  public updateRiversTexture(canvas: HTMLCanvasElement): void {
    if (this.riversTexture) {
      this.riversTexture.image = canvas;
      this.riversTexture.needsUpdate = true;
      this.renderFrame();
    }
  }

  public updateBordersTexture(canvas: HTMLCanvasElement): void {
    if (this.bordersTexture) {
      this.bordersTexture.image = canvas;
      this.bordersTexture.needsUpdate = true;
      this.renderFrame();
    }
  }

  public updateOverlaysTexture(canvas: HTMLCanvasElement): void {
    if (this.overlaysTexture) {
      this.overlaysTexture.image = canvas;
      this.overlaysTexture.needsUpdate = true;
      this.renderFrame();
    }
  }

  /**
   * Set political overlay opacity (0 = terrain only, 1 = full political colors)
   */
  public setPoliticalOpacity(opacity: number): void {
    if (this.politicalMesh && this.politicalMesh.material) {
      (this.politicalMesh.material as THREE.MeshBasicMaterial).opacity =
        Math.max(0, Math.min(1, opacity));
      this.renderFrame();
    }
  }

  public getPoliticalOpacity(): number {
    if (this.politicalMesh && this.politicalMesh.material) {
      return (this.politicalMesh.material as THREE.MeshBasicMaterial).opacity;
    }
    return 0.65;
  }

  /**
   * Set borders visibility
   */
  public setBordersVisible(visible: boolean): void {
    if (this.bordersMesh) {
      this.bordersMesh.visible = visible;
      this.renderFrame();
    }
  }

  /**
   * Handle window resize
   */
  public resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.renderFrame();
  }

  /**
   * Main render method - called on camera movement
   * Matches Canvas 2D API: translate(x, y) then scale(zoom, zoom)
   */
  public render(cameraX: number, cameraY: number, zoom: number): void {
    // Apply camera transform to the map group
    // Canvas 2D translate(x, y) moves the origin, which visually moves content by (-x, -y)
    // Three.js Y-axis is inverted (Y+ is up), Canvas 2D Y+ is down
    // Both X and Y need to be inverted to match Canvas 2D translate semantics
    this.mapGroup.position.set(-cameraX, -cameraY, 0);
    this.mapGroup.scale.set(zoom, zoom, 1);

    this.renderFrame();
  }

  /**
   * Force a render (for animations)
   */
  public renderFrame(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    console.log('[ThreeJSMapRenderer v2.0] Disposing...');

    // Stop animation loop first
    this.stopAnimationLoop();

    // Dispose geometries and materials
    this.mapGroup.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });

    // Dispose textures
    [this.terrainTexture, this.politicalTexture, this.riversTexture,
     this.bordersTexture, this.overlaysTexture].forEach(tex => {
      if (tex) tex.dispose();
    });

    // Dispose renderer and release WebGL context
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  /**
   * Get the WebGL canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /**
   * Start animation loop (for smooth animations)
   */
  public startAnimationLoop(getCamera: () => { x: number; y: number; zoom: number }): void {
    // Stop any existing animation loop first
    this.stopAnimationLoop();

    let frameCount = 0;
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      const cam = getCamera();

      // Debug: Log first few frames
      if (frameCount < 3) {
        console.log(`[ThreeJSMapRenderer v2.0] Frame ${frameCount}: camera=(${cam.x.toFixed(2)}, ${cam.y.toFixed(2)}, zoom=${cam.zoom.toFixed(4)})`);
        console.log(`[ThreeJSMapRenderer v2.0] MapGroup position=(${(-cam.x).toFixed(2)}, ${(-cam.y).toFixed(2)}), scale=${cam.zoom.toFixed(4)}`);
        frameCount++;
      }

      this.render(cam.x, cam.y, cam.zoom);
    };
    animate();
    console.log('[ThreeJSMapRenderer v2.0] Animation loop started');
  }

  /**
   * Stop animation loop
   */
  public stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      console.log('[ThreeJSMapRenderer v2.0] Animation loop stopped');
    }
  }
}
