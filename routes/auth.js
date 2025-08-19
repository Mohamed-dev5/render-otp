import express from "express";
import rateLimit from "express-rate-limit";

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // max requests
  message: "Too many requests, please try again later.",
});

import {
  forgetPassword,
  verifyOtp,
  resetPassword,
} from "../controllers/authcontroller.js";

const router = express.Router();

router.post("/forget-password", forgetPassword, globalLimiter);
router.post("/verify-otp", verifyOtp, globalLimiter);
router.post("/reset-password", resetPassword, globalLimiter);

export default router;
