const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads/sos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sosDir = path.join(
      __dirname,
      "../uploads/sos",
      req.user._id.toString(),
    );
    if (!fs.existsSync(sosDir)) {
      fs.mkdirSync(sosDir, { recursive: true });
    }
    cb(null, sosDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${timestamp}-${file.fieldname}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."),
      false,
    );
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Upload middleware for SOS images (front and back camera)
const sosImageUpload = upload.fields([
  { name: "frontCamera", maxCount: 1 },
  { name: "backCamera", maxCount: 1 },
]);

// Base64 image handler for when files are sent as base64
const handleBase64Upload = async (req, res, next) => {
  try {
    const { frontCameraBase64, backCameraBase64 } = req.body;

    if (frontCameraBase64 || backCameraBase64) {
      const sosDir = path.join(
        __dirname,
        "../uploads/sos",
        req.user._id.toString(),
      );
      if (!fs.existsSync(sosDir)) {
        fs.mkdirSync(sosDir, { recursive: true });
      }

      req.files = {};
      const timestamp = Date.now();

      if (frontCameraBase64) {
        const frontData = frontCameraBase64.replace(
          /^data:image\/\w+;base64,/,
          "",
        );
        const frontBuffer = Buffer.from(frontData, "base64");
        const frontFilename = `${timestamp}-frontCamera.jpg`;
        const frontPath = path.join(sosDir, frontFilename);
        fs.writeFileSync(frontPath, frontBuffer);
        req.files.frontCamera = [
          {
            filename: frontFilename,
            path: frontPath,
            mimetype: "image/jpeg",
          },
        ];
      }

      if (backCameraBase64) {
        const backData = backCameraBase64.replace(
          /^data:image\/\w+;base64,/,
          "",
        );
        const backBuffer = Buffer.from(backData, "base64");
        const backFilename = `${timestamp}-backCamera.jpg`;
        const backPath = path.join(sosDir, backFilename);
        fs.writeFileSync(backPath, backBuffer);
        req.files.backCamera = [
          {
            filename: backFilename,
            path: backPath,
            mimetype: "image/jpeg",
          },
        ];
      }
    }
    next();
  } catch (error) {
    console.error("Error processing base64 images:", error);
    next();
  }
};

module.exports = {
  upload,
  sosImageUpload,
  handleBase64Upload,
};
