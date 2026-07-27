import express from "express"

import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import { getMessage, sendMessage } from "../controllers/message_controller.js";

const router = express.Router();

router.route('/send/:id').post(isAuthenticated, sendMessage);
router.route('/all/:id').post(isAuthenticated, getMessage);


export default router; 





// Multer is a middleware for Node.js (used with Express.js) that helps you handle file uploads from the frontend.

// 👉 In simple terms:
// When a user uploads a file (image, video, pdf), Multer processes that file on the backend.
