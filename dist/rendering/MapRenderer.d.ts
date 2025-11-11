import { CanvasManager } from './CanvasManager.js';
import { CameraController } from '../camera/CameraController.js';
export declare class MapRenderer {
    private canvasManager;
    private cameraController;
    constructor(canvasManager: CanvasManager, cameraController: CameraController);
    render(): void;
}
