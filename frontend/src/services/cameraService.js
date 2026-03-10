// Camera service for capturing images from front and back cameras
class CameraService {
  constructor() {
    this.frontStream = null;
    this.backStream = null;
  }

  // Capture image from a specific camera
  async captureFromCamera(facingMode = "user") {
    try {
      const constraints = {
        video: {
          facingMode: facingMode, // 'user' for front, 'environment' for back
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create video element to capture frame
      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", true);

      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      // Wait a moment for camera to adjust
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create canvas and capture frame
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      // Stop the stream
      stream.getTracks().forEach((track) => track.stop());

      // Convert to base64
      const base64 = canvas.toDataURL("image/jpeg", 0.8);

      return base64;
    } catch (error) {
      console.error(`Error capturing from ${facingMode} camera:`, error);
      return null;
    }
  }

  // Capture from both cameras
  async captureFromBothCameras() {
    const results = {
      frontCamera: null,
      backCamera: null,
    };

    try {
      // Try to capture from front camera
      results.frontCamera = await this.captureFromCamera("user");
    } catch (error) {
      console.error("Front camera capture failed:", error);
    }

    try {
      // Try to capture from back camera
      results.backCamera = await this.captureFromCamera("environment");
    } catch (error) {
      console.error("Back camera capture failed:", error);
    }

    return results;
  }

  // Check if camera is available
  async isCameraAvailable() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((device) => device.kind === "videoinput");
    } catch (error) {
      return false;
    }
  }

  // Get available cameras
  async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === "videoinput");
    } catch (error) {
      return [];
    }
  }
}

export const cameraService = new CameraService();
export default cameraService;
