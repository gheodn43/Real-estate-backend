import nodeMailer from 'nodemailer';
const transporter = nodeMailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
const sendRegisterOTP = async (verifyData) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: #27ae60; padding: 20px; text-align: center;">
        <img src="cid:companylogo" alt="Company Logo" style="height: 90px; margin-bottom: 10px;" />
        <h2 style="color: #fff; margin: 0;">Real Estate OTP Verification</h2>
      </div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px; color: #333;">Dear Customer,</p>
        <p style="font-size: 16px; color: #333;">Your OTP code is:</p>
        <div style="font-size: 32px; font-weight: bold; color: #27ae60; letter-spacing: 8px; margin: 20px 0;">${verifyData.otp}</div>
        <p style="font-size: 14px; color: #555;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 13px; color: #888; text-align: center;">Thank you for choosing Real Estate!<br/>Hotline: 0123 456 789</p>
      </div>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: verifyData.email,
    subject: 'Register OTP',
    html: htmlContent,
    attachments: [
      {
        filename: 'homihub.png',
        path: './Real-estate-backend/image/homihub.png',
        cid: 'companylogo',
      },
    ],
  });
};

export default {
  sendRegisterOTP,
};
