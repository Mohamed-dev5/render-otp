import { db } from "../firebase.js";
import bcrypt from "bcrypt";
import { sendOtpEmail } from "../utils/mail.js";
import { generateOtp } from "../utils/otp.js";
import { getUserByEmail } from "../utils/mail.js";
import { v4 as uuidv4 } from "uuid";
import { ad } from "../firebase.js";

export async function forgetPassword(req, res) {
  const { email } = req.body;

  const user = await getUserByEmail(email);
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const code = generateOtp();
  const hashedOtp = await bcrypt.hash(code, 13);
  const otpId = uuidv4();
  const otpDoc = await db.collection("otps").where("email", "==", email).get();
  const dataNow = Date.now();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (!otpDoc.empty) {
    const docRef = otpDoc.docs[0].ref;
    const data = otpDoc.docs[0].data();
    if (data.sends >= 5) {
      await docRef.update({
        state: "blocked",
        hashedOtp: null,
        expiresAt: null,
        attempts: 0,
        sends: 0,
      });
      return res
        .status(400)
        .json({ message: "Too many requests, try again later" });
    } else if (dataNow < data.expiresAt) {
      return res.status(400).json({
        message: "An OTP has already been sent. Please wait for it to expire.",
      });
    }
    await docRef.update({
      hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      state: "pending",
      consumed: false,
      sends: data.sends + 1,
    });
  } else {
    await db.collection("otps").doc(otpId).set({
      email,
      hashedOtp,
      expiresAt,
      state: "pending",
      attempts: 0,
      consumed: false,
      sends: 1,
    });
  }

  await sendOtpEmail(email, code);
  res.status(200).json({ message: "OTP sent successfully" });
}

export async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const otpDoc = await db.collection("otps").where("email", "==", email).get();
  const otpRef = otpDoc.docs[0].ref;
  const data = otpDoc.docs[0].data();
  const dateNow = Date.now();
  if (otpDoc.empty) {
    return res.status(404).json({ message: "OTP not found" });
  }
  if (data.attempts >= 5) {
    await otpRef.update({
      state: "blocked",
      hashedOtp: null,
      expiresAt: null,
    });
    return res
      .status(400)
      .json({ message: "Too many attempts, try again later" });
  }
  if (data.consumed) {
    otpRef.update({
      state: "consumed",
      consumed: true,
      attempts: data.attempts + 1,
    });
    return res.status(400).json({ message: "OTP already consumed" });
  }
  if (!bcrypt.compareSync(otp, data.hashedOtp)) {
    otpRef.update({
      attempts: data.attempts + 1,
      state: "invalid",
    });
    return res.status(400).json({ message: "Wrong OTP" });
  }
  if (data.expiresAt < dateNow) {
    otpRef.update({
      state: "expired",
      attempts: data.attempts + 1,
    });
    return res.status(400).json({ message: "OTP expired" });
  }

  await otpRef.update({
    expiresAt: null,
    attempts: null,
    hashedOtp: null,
    consumed: true,
    state: "verified",
  });

  res.json({ message: "OTP verified successfully" });
}

export async function resetPassword(req, res) {
  const { email, newPassword } = req.body;
  const user = await ad.getUserByEmail(email);
  const otpDoc = await db.collection("otps").where("email", "==", email).get();
  const otpRef = otpDoc.docs[0].ref;
  const data = otpDoc.docs[0].data();

  if (otpDoc.empty) {
    return res.status(404).json({ message: "OTP not found" });
  }
  if (data.state !== "verified") {
    return res.status(400).json({ message: "OTP not verified" });
  }
  ad.updateUser(user.uid, { password: newPassword })
    .then(() => {
      res.json({ message: "Password reset successfully" });
    })
    .catch((error) => {
      console.error("Error updating user password:", error);
      res.status(500).json({ message: "Error resetting password" });
    });
}
