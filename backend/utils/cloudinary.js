import {v2 as cloudinary} from "cloudinary"
import dotenv from "dotenv"
dotenv.config({});

cloudinary.config({
  cloud_name:process.env.CLOUD_NAME,
  api_key:process.env.API_KEY,
  api_secret:process.env.API_SECRET
})
export default cloudinary;



// 🔹 Why do we use Cloudinary?

// If you build your own backend:

// ❌ Storing files on your server:

// Takes disk space
// Slows your app
// Hard to scale
// Risk of data loss

// ✅ Using Cloudinary:

// Stores files in cloud ☁️
// Gives you a URL
// Fast delivery via CDN 🚀
// Auto optimization (resize, compress)