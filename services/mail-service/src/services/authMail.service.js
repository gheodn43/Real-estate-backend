import nodeMailer from 'nodemailer';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const imagePath = path.resolve(__dirname, '../../resource/images/homihub.png');

if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  throw new Error(
    'MAIL_USER and MAIL_PASS must be set in environment variables'
  );
}

const transporter = nodeMailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendRegisterOTP = async ({ email, otp, name }) => {
  if (!email || !otp) {
    return {
      data: null,
      message: 'Email and OTP are required',
      errors: ['Email and OTP are required'],
    };
  }
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: #27ae60; padding: 20px; text-align: center;">
        <img src="cid:companylogo" alt="Company Logo" style="height: 90px; margin-bottom: 10px;" />
        <h2 style="color: #fff; margin: 0;">Real Estate OTP Verification</h2>
      </div>
      <div style="padding: 30px 20px;">
      ${name ? `<p style='font-size: 16px; color: #333;'>Dear ${name},</p>` : ''}
        <p style="font-size: 16px; color: #333;">Welcome to Real-Estate, please verify OTP code to become a member of Real-estate!</p>
        <p style="font-size: 16px; color: #333;">Your OTP code is:</p>
        <div style="font-size: 32px; font-weight: bold; color: #27ae60; letter-spacing: 8px; margin: 20px 0;">${otp}</div>
        <p style="font-size: 14px; color: #555;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 13px; color: #888; text-align: center;">Thank you for choosing Real Estate!<br/>Hotline: 0123 456 789</p>
      </div>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Register OTP',
    html: htmlContent,
    attachments: [
      {
        filename: 'homihub.png',
        path: imagePath,
        cid: 'companylogo',
      },
    ],
  });
};

const sendPasswordEmail = async ({ email, password, name, roleName }) => {
  if (!email || !password) {
    return {
      data: null,
      message: 'Email and password are required',
      errors: ['Email and password are required'],
    };
  }
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: #27ae60; padding: 20px; text-align: center;">
        <img src="cid:companylogo" alt="Company Logo" style="height: 90px; margin-bottom: 10px;" />
        <h2 style="color: #fff; margin: 0;">Real Estate Account Password</h2>
      </div>
      <div style="padding: 30px 20px;">
      ${name ? `<p style='font-size: 16px; color: #333;'>Dear ${name},</p>` : ''}
        <p style="font-size: 16px; color: #333;">Welcome to Real-Estate, from today you officially become a member of Real-estate as role <b>${roleName}</b>.</p>
        <p style="font-size: 16px; color: #333;">Your account password is:</p>
        <div style="font-size: 32px; font-weight: bold; color: #27ae60; letter-spacing: 4px; margin: 20px 0;">${password}</div>
        <p style="font-size: 14px; color: #555;">Please change your password after logging in for security.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 13px; color: #888; text-align: center;">Thank you for choosing Real Estate!<br/>Hotline: 0123 456 789</p>
      </div>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Your Account Password',
    html: htmlContent,
    attachments: [
      {
        filename: 'homihub.png',
        path: imagePath,
        cid: 'companylogo',
      },
    ],
  });
};

const sendResetPasswordOTP = async ({ email, otp, name }) => {
  if (!email || !otp) {
    return {
      data: null,
      message: 'Email and OTP are required',
      errors: ['Email and OTP are required'],
    };
  }
  const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
    <div style="background: #27ae60; padding: 20px; text-align: center;">
      <img src="cid:companylogo" alt="Company Logo" style="height: 90px; margin-bottom: 10px;" />
      <h2 style="color: #fff; margin: 0;">Reset Password OTP</h2>
    </div>
    <div style="padding: 30px 20px;">
    ${name ? `<p style='font-size: 16px; color: #333;'>Dear ${name},</p>` : ''}
      <p style="font-size: 16px; color: #333;">You have requested to reset your password for your Real Estate account.</p>
      <p style="font-size: 16px; color: #333;">Your OTP code for reset password is:</p>
      <div style="font-size: 32px; font-weight: bold; color: #27ae60; letter-spacing: 8px; margin: 20px 0;">${otp}</div>
      <p style="font-size: 14px; color: #555;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 13px; color: #888; text-align: center;">If you did not request a password reset, please ignore this email.<br/>Thank you for choosing Real Estate!<br/>Hotline: 0123 456 789</p>
    </div>
  </div>
`;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Reset Password OTP',
    html: htmlContent,
    attachments: [
      {
        filename: 'homihub.png',
        path: imagePath,
        cid: 'companylogo',
      },
    ],
  });
};

const sendConsignmentRequestToCustomer = async ({
  email,
  name,
  propertyInfo,
  status,
}) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: #27ae60; padding: 20px; text-align: center;">
        <img src="cid:companylogo" alt="Company Logo" style="height: 90px; margin-bottom: 10px;" />
        <h2 style="color: #fff; margin: 0;">Xác nhận gửi yêu cầu ký gửi</h2>
      </div>
      <div style="padding: 30px 20px;">
        <p style='font-size: 16px; color: #333;'>Kính chào ${name},</p>
        <p style="font-size: 16px; color: #333;">Bạn đã gửi yêu cầu ký gửi bất động sản thành công.</p>
        <p style="font-size: 16px; color: #333;">Trạng thái hiện tại: <b>${status || 'Đang chờ xử lý'}</b></p>
        <p style="font-size: 16px; color: #333;">Thông tin ký gửi:</p>
        <ul>
          <li>Loại: ${propertyInfo.type}</li>
          <li>Diện tích: ${propertyInfo.area} m²</li>
          <li>Địa chỉ: ${propertyInfo.address}</li>
        </ul>
        <p style="font-size: 14px; color: #555;">Chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 13px; color: #888; text-align: center;">Cảm ơn bạn đã tin tưởng dịch vụ!<br/>Hotline: 0123 456 789</p>
      </div>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Xác nhận gửi yêu cầu ký gửi',
    html: htmlContent,
    attachments: [
      {
        filename: 'homihub.png',
        path: imagePath,
        cid: 'companylogo',
      },
    ],
  });
};

const sendConsignmentRequestToAdmin = async ({
  adminEmail,
  propertyInfo,
  customerInfo,
}) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: #27ae60; padding: 20px; text-align: center;">
        <img src="cid:companylogo" alt="Company Logo" style="height: 90px; margin-bottom: 10px;" />
        <h2 style="color: #fff; margin: 0;">Yêu cầu ký gửi mới</h2>
      </div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px; color: #333;">Có một yêu cầu ký gửi mới vừa được gửi lên hệ thống:</p>
        <h3 style="margin-bottom: 5px;">Thông tin bất động sản</h3>
        <ul>
          <li>Loại: ${propertyInfo.type}</li>
          <li>Diện tích: ${propertyInfo.area} m²</li>
          <li>Địa chỉ: ${propertyInfo.address}</li>
        </ul>
        <h3 style="margin-bottom: 5px;">Thông tin khách hàng</h3>
        <ul>
          <li>Tên: ${customerInfo.name}</li>
          <li>SĐT: ${customerInfo.phone}</li>
          <li>Email: ${customerInfo.email}</li>
        </ul>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 13px; color: #888; text-align: center;">Vui lòng kiểm tra và xử lý trên hệ thống.<br/>Hotline: 0123 456 789</p>
      </div>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: adminEmail,
    subject: 'Yêu cầu ký gửi mới',
    html: htmlContent,
    attachments: [
      {
        filename: 'homihub.png',
        path: imagePath,
        cid: 'companylogo',
      },
    ],
  });
};

const sendConsignmentRequestToAgent = async ({
  agentEmail,
  propertyInfo,
  customerInfo,
}) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: #27ae60; padding: 20px; text-align: center;">
        <img src="cid:companylogo" alt="Company Logo" style="height: 90px; margin-bottom: 10px;" />
        <h2 style="color: #fff; margin: 0;">Yêu cầu ký gửi mới tại khu vực bạn phụ trách</h2>
      </div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px; color: #333;">Có một yêu cầu ký gửi mới tại khu vực bạn phụ trách:</p>
        <h3 style="margin-bottom: 5px;">Thông tin bất động sản</h3>
        <ul>
          <li>Loại: ${propertyInfo.type}</li>
          <li>Diện tích: ${propertyInfo.area} m²</li>
          <li>Địa chỉ: ${propertyInfo.address}</li>
        </ul>
        <h3 style="margin-bottom: 5px;">Thông tin khách hàng</h3>
        <ul>
          <li>Tên: ${customerInfo.name}</li>
          <li>SĐT: ${customerInfo.phone}</li>
          <li>Email: ${customerInfo.email}</li>
        </ul>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 13px; color: #888; text-align: center;">Vui lòng chủ động liên hệ và hỗ trợ khách hàng.<br/>Hotline: 0123 456 789</p>
      </div>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: agentEmail,
    subject: 'Yêu cầu ký gửi mới tại khu vực bạn phụ trách',
    html: htmlContent,
    attachments: [
      {
        filename: 'homihub.png',
        path: imagePath,
        cid: 'companylogo',
      },
    ],
  });
};

// Gán cứng danh sách agent nếu muốn gửi cho nhiều agent
const AGENT_EMAILS = ['tuankiet11a2@gmail.com'];

async function sendConsignmentRequestToAgents({
  propertyInfo,
  customerInfo,
  agentEmails,
}) {
  // Nếu truyền agentEmails từ request thì dùng, không thì dùng AGENT_EMAILS cứng
  const emails =
    agentEmails && agentEmails.length > 0 ? agentEmails : AGENT_EMAILS;
  const batchSize = 10;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    await Promise.all(
      batch.map((agentEmail) =>
        sendConsignmentRequestToAgent({
          agentEmail,
          propertyInfo,
          customerInfo,
        })
      )
    );
    await new Promise((res) => setTimeout(res, 2000));
  }
}

// Thay thế đoạn dùng Prisma lấy admin bằng danh sách email cứng
const ADMIN_EMAILS = [
  'kietnguyen23012002@gmail.com', // Thay bằng email admin thực tế của bạn
  // "anotheradmin@example.com" // Thêm nếu có nhiều admin
];

async function sendConsignmentRequestToAdmins({ propertyInfo, customerInfo }) {
  for (const adminEmail of ADMIN_EMAILS) {
    await sendConsignmentRequestToAdmin({
      adminEmail,
      propertyInfo,
      customerInfo,
    });
  }
}

export default {
  sendRegisterOTP,
  sendPasswordEmail,
  sendResetPasswordOTP,
  sendConsignmentRequestToAdmin,
  sendConsignmentRequestToCustomer,
  sendConsignmentRequestToAgent,
  sendConsignmentRequestToAgents,
  sendConsignmentRequestToAdmins,
};
