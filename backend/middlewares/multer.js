import multer from "multer"
const upload = multer({
  storage:multer.memoryStorage(),

})
export default upload;

// 2. storage: multer.memoryStorage()
// This is the most important line 👇
// 👉 It tells Multer:
// “Don’t save files on disk, keep them in RAM (memory) instead”

// Flow 👇

// User uploads image
// Multer stores it in memory (buffer)
// You send buffer → Cloudinary
// Cloudinary returns URL
// Save URL in DB