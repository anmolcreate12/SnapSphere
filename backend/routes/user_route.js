import express from "express"
import { editProfile, followOrUnfollow, getProfile, getSuggestedUsers, login, logout, register, searchUsers } from "../controllers/user_controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/:id/profile').get(isAuthenticated, getProfile);
router.route('/profile/edit').post(isAuthenticated, upload.single('profilePicture'), editProfile);
router.route('/suggested').get(isAuthenticated, getSuggestedUsers);
router.route('/search').get(isAuthenticated, searchUsers);
router.route('/followorunfollow/:id').post(isAuthenticated, followOrUnfollow);

export default router;

  
 




// Multer is a middleware for Node.js (used with Express.js) that helps you handle file uploads from the frontend.

// 👉 In simple terms:
// When a user uploads a file (image, video, pdf), Multer processes that file on the backend.
