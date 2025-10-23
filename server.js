import express from "express";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

let latestData = {};
let lastUpdated = Date.now();

// ✅ Upload endpoint (Unity will POST here)
app.post("/upload", (req, res) => {
  latestData = req.body;
  lastUpdated = Date.now();
  console.log("✅ [UPLOAD] JSON received from Unity:");
  console.log(JSON.stringify(latestData, null, 2));
  res.status(200).send("Received JSON");
});

// ✅ Periodically check every minute
setInterval(async () => {
  if (Object.keys(latestData).length > 0) {
    const diff = (Date.now() - lastUpdated) / 1000 / 60;
    console.log(`⏳ [CHECK] ${diff.toFixed(2)} minutes since last update`);

    if (diff >= 10) { // Changed to 10 minutes
      console.log("📬 [ACTION] 10 minutes passed — sending email...");
      await sendEmail(latestData);
      latestData = {};
    }
  } else {
    console.log("💤 [CHECK] No data to send yet...");
  }
}, 60000); // check every 60 seconds

// ✅ Email sending logic
async function sendEmail(data) {
  console.log("📧 [EMAIL] Preparing to send email...");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // from .env
      pass: process.env.EMAIL_PASS, // from .env
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "alliedcgaming@gmail.com",
    cc: "alliedcgaming@gmail.com",
    subject: "Player Data JSON",
    text: JSON.stringify(data, null, 2),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [EMAIL SENT] Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ [EMAIL ERROR]", error);
  }
}

// ✅ Use Render’s dynamic port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 [SERVER] Running on port ${PORT}`));
