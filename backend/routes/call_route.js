import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getTurnCredentials } from "../utils/twilio.js";

const router = express.Router();

router.route('/ice-servers').get(isAuthenticated, async (req, res) => {
  try {
    const iceServers = await getTurnCredentials();
    return res.status(200).json({ success: true, iceServers });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch ICE servers' });
  }
});

export default router;