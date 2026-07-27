import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getNotifications, markNotificationsRead, createNotification } from "../controllers/notification_controller.js";

const router = express.Router();

router.route('/all').get(isAuthenticated, getNotifications);
router.route('/mark-read').post(isAuthenticated, markNotificationsRead);
router.route('/create').post(isAuthenticated, createNotification);

export default router;