import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { db } from "../firebase.js";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendOtpEmail(to, otp) {
  const msg = {
    to,
    from: 'emotica.noreply@gmail.com',
    subject: 'Your OTP Code',
    html: `
      <p>Hello,</p>
      <p>Your <strong>OTP code is <span style="font-size: 1.2em; color: #2E86C1;">${otp}</span></strong>. It is valid for <strong>5 minutes</strong>.</p>
      <p>If you did not request this code, please ignore this email.</p>
      <p>Thank you,<br/>Emotica Team</p>
    `,
  };
  await sgMail.send(msg);
  try {
    await sgMail.send(msg);
    console.log("✅ OTP email sent to", to);
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
}

export async function getUserByEmail(email) {
  try {
    const userRef = db.collection("users").where("email", "==", email).limit(1);
    const snapshot = await userRef.get();

    if (snapshot.empty) {
      return null;
    }

    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw new Error("Error fetching user by email");
  }
}
