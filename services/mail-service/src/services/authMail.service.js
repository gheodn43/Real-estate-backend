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

// Template HTML mới dựa trên mẫu VinaHost, màu xanh lá cây
const getEmailTemplate = ({ title, greeting, mainMessage, infoSections }) => `
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 0; background-color: #f5f7fa; font-family: 'Roboto', Arial, sans-serif; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; overflow: hidden; }
        .header { background-color: #27ae60; padding: 20px; text-align: center; }
        .header img { max-width: 120px; height: auto; }
        .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin: 10px 0 0; }
        .content { padding: 20px; }
        .greeting { font-size: 18px; color: #333333; margin-bottom: 20px; }
        .main-message { font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 20px; }
        .highlight-section { background-color: #e8f5e9; padding: 15px; border: 1px solid #27ae60; border-radius: 5px; margin-bottom: 20px; }
        .highlight-section h3 { font-size: 20px; color: #27ae60; font-weight: 700; margin-bottom: 10px; }
        .highlight-section ul { list-style: none; padding: 0; }
        .highlight-section li { font-size: 16px; color: #333333; font-weight: bold; margin-bottom: 8px; }
        .highlight-section li:before { content: "•"; color: #27ae60; margin-right: 10px; }
        .otp-code { font-size: 36px; font-weight: bold; color: #27ae60; letter-spacing: 5px; text-align: center; padding: 15px; background-color: #f0f4f8; border-radius: 8px; margin: 20px 0; }
        .footer { background-color: #27ae60; padding: 15px; text-align: center; }
        .footer p { font-size: 13px; color: #ffffff; margin: 5px 0; line-height: 1.5; }
        .footer a { color: #ffffff; text-decoration: none; }
        .footer .contact { margin-top: 10px; }
        .footer .contact a { color: #ffffff; }
        .footer .services { font-size: 14px; font-weight: bold; }
        .footer .address { font-size: 12px; }
        @media screen and (max-width: 600px) {
          .container { margin: 10px; }
          .content { padding: 10px; }
          .header { padding: 15px; }
          .highlight-section h3 { font-size: 18px; }
          .highlight-section li { font-size: 14px; }
          .otp-code { font-size: 28px; }
          .footer { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:companylogo" alt="Real Estate Logo" />
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${greeting ? `<p class="greeting">${greeting}</p>` : ''}
          <p class="main-message">${mainMessage}</p>
          ${infoSections}
        </div>
        <div class="footer">
          <p class="services">BEST SERVICES FOR YOUR BUSINESS: SERVER - CDN - CLOUD - VPS - HOSTING - WEBSITE - DOMAIN - EMAIL</p>
          <p class="address"> FPT urban area, Hoa Hai ward,Ngu Hanh Son District, Da Nang City</p>
          <div class="contact">
            <p>Hotline: <a href="tel:0123456789">0123 456 789</a> | Email: <a href="mailto:support@realestate.com">support@realestate.com</a></p>
            <p>Follow us: <a href="https://facebook.com/realestate">Facebook</a> | <a href="https://linkedin.com/company/realestate">LinkedIn</a></p>
            <p><a href="https://yourdomain.com">Visit our website</a></p>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

const sendRegisterOTP = async ({ email, otp, name }) => {
  if (!email || !otp) {
    return {
      data: null,
      message: 'Email and OTP are required',
      errors: ['Email and OTP are required'],
    };
  }
  const htmlContent = getEmailTemplate({
    title: 'Homihub OTP Verification',
    greeting: name ? `Dear ${name},` : '',
    mainMessage:
      'Welcome to HomiHub! Please verify your OTP code to become a member of our platform. This OTP is valid for 5 minutes. Please do not share it with anyone.',
    infoSections: `
      <div class="otp-code">${otp}</div>
    `,
  });

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
  const htmlContent = getEmailTemplate({
    title: 'HomiHub Account Password',
    greeting: name ? `Dear ${name},` : '',
    mainMessage: `Welcome to HomiHub! From today, you officially become a member of our platform as a <strong>${roleName}</strong>. Please change your password after logging in for security.`,
    infoSections: `
      <p class="main-message">Your account password is:</p>
      <div class="otp-code">${password}</div>
    `,
  });

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
  const htmlContent = getEmailTemplate({
    title: 'Reset Password OTP',
    greeting: name ? `Dear ${name},` : '',
    mainMessage:
      'You have requested to reset your password for your Homihub account. This OTP is valid for 5 minutes. Please do not share it with anyone. If you did not request a password reset, please ignore this email.',
    infoSections: `
      <p class="main-message">Your OTP code for password reset is:</p>
      <div class="otp-code">${otp}</div>
    `,
  });

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
  property,
  location,
  customer,
}) => {
  const htmlContent = getEmailTemplate({
    title: 'Xác nhận yêu cầu ký gửi bất động sản',
    greeting: customer?.name
      ? `Kính chào ${customer.name},`
      : 'Kính chào Quý khách,',
    mainMessage: `
      Cảm ơn bạn đã tin tưởng và lựa chọn dịch vụ ký gửi bất động sản của HomiHub! Chúng tôi rất vui mừng thông báo rằng yêu cầu ký gửi của bạn đã được ghi nhận thành công. Đội ngũ chuyên gia của chúng tôi sẽ nhanh chóng xem xét và liên hệ với bạn trong vòng 24-48 giờ để hỗ trợ các bước tiếp theo.<br><br>
      Với mạng lưới đại lý rộng khắp và kinh nghiệm chuyên sâu trong lĩnh vực bất động sản, chúng tôi cam kết mang đến cho bạn một quy trình ký gửi minh bạch, hiệu quả và tối ưu giá trị tài sản của bạn. Dưới đây là thông tin chi tiết về yêu cầu ký gửi của bạn:
    `,
    infoSections: `
      <div class="highlight-section">
        <h3>Thông tin bất động sản</h3>
        <ul>
          <li>Tiêu đề: ${property?.title || 'Chưa cung cấp'}</li>
          <li>Giá đề xuất: ${property?.price ? property.price.toLocaleString() + ' VNĐ' : 'Chưa cung cấp'}</li>
          <li>Địa chỉ: ${location?.addrCity || ''}${location?.addrDistrict ? ', ' + location.addrStreet : ''}</li>
        </ul>
      </div>
      <div class="highlight-section">
        <h3>Thông tin khách hàng</h3>
        <ul>
          <li>Tên: ${customer?.name || 'Chưa cung cấp'}</li>
          <li>Số điện thoại: ${customer?.phone || 'Chưa cung cấp'}</li>
          <li>Email: ${customer?.email || 'Chưa cung cấp'}</li>
        </ul>
      </div>
      <div class="info-section">
        <h3>Quy trình tiếp theo</h3>
        <ul>
          <li>Đội ngũ của chúng tôi sẽ thẩm định thông tin bất động sản trong vòng 24 giờ.</li>
          <li>Một đại lý chuyên trách sẽ liên hệ để tư vấn và xác nhận chi tiết.</li>
          <li>Bạn có thể liên hệ hotline 0123 456 789 để được hỗ trợ bất kỳ lúc nào.</li>
        </ul>
      </div>
    `,
  });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: customer?.email,
    subject: 'Xác nhận yêu cầu ký gửi bất động sản',
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
  property,
  location,
  customer,
}) => {
  const htmlContent = getEmailTemplate({
    title: 'Yêu cầu ký gửi bất động sản mới',
    greeting: 'Kính gửi Quý Quản trị viên,',
    mainMessage: `
      Một yêu cầu ký gửi bất động sản mới vừa được gửi lên hệ thống HomiHub. Đây là cơ hội để chúng ta tiếp tục mang lại giá trị cho khách hàng thông qua dịch vụ chuyên nghiệp và hiệu quả. Vui lòng kiểm tra thông tin chi tiết dưới đây và thực hiện các bước xử lý cần thiết trong thời gian sớm nhất.<br><br>
      Đội ngũ HomiHub cam kết hỗ trợ bạn trong việc quản lý và phân phối yêu cầu này đến các đại lý phù hợp, đảm bảo quy trình minh bạch và tối ưu. Xin vui lòng cập nhật trạng thái xử lý trên hệ thống để theo dõi tiến độ.
    `,
    infoSections: `
      <div class="highlight-section">
        <h3>Thông tin bất động sản</h3>
        <ul>
          <li>Tiêu đề: ${property?.title || 'Chưa cung cấp'}</li>
          <li>Giá đề xuất: ${property?.price ? property.price.toLocaleString() + ' VNĐ' : 'Chưa cung cấp'}</li>
          <li>Địa chỉ: ${location?.addrCity || ''}${location?.addrDistrict ? ', ' + location.addrStreet : ''}</li>
        </ul>
      </div>
      <div class="highlight-section">
        <h3>Thông tin khách hàng</h3>
        <ul>
          <li>Tên: ${customer?.name || 'Chưa cung cấp'}</li>
          <li>Số điện thoại: ${customer?.phone || 'Chưa cung cấp'}</li>
          <li>Email: ${customer?.email || 'Chưa cung cấp'}</li>
        </ul>
      </div>
      <div class="info-section">
        <h3>Quy trình xử lý</h3>
        <ul>
          <li>Xác nhận thông tin yêu cầu trong vòng 12 giờ.</li>
          <li>Phân công đại lý phù hợp để liên hệ khách hàng.</li>
          <li>Cập nhật trạng thái yêu cầu trên hệ thống quản lý.</li>
          <li>Liên hệ hotline nội bộ 0123 456 789 nếu cần hỗ trợ.</li>
        </ul>
      </div>
    `,
  });

  for (const adminEmail of ADMIN_EMAILS) {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: adminEmail,
      subject: 'Yêu cầu ký gửi bất động sản mới',
      html: htmlContent,
      attachments: [
        {
          filename: 'homihub.png',
          path: imagePath,
          cid: 'companylogo',
        },
      ],
    });
  }
};

const notifyAgentAssignedToProject = async ({
  property,
  location,
  agents,
  customer,
}) => {
  if (!Array.isArray(agents)) return;
  const batchSize = 10;
  for (let i = 0; i < agents.length; i += batchSize) {
    const batch = agents.slice(i, i + batchSize);
    await Promise.all(
      batch.map((agent) => {
        const htmlContent = getEmailTemplate({
          title: 'Yêu cầu ký gửi mới tại khu vực bạn phụ trách',
          greeting: agent?.name
            ? `Kính gửi ${agent.name},`
            : 'Kính gửi Nhà Môi Giới,',
          mainMessage: `Một yêu cầu ký gửi bất động sản mới vừa được ghi nhận tại khu vực bạn phụ trách. Đây là cơ hội tuyệt vời để bạn kết nối với khách hàng và mang lại giá trị thông qua dịch vụ tư vấn chuyên nghiệp của HomiHub.<br><br>Vui lòng xem xét thông tin chi tiết dưới đây và chủ động liên hệ với khách hàng trong vòng 24 giờ để thảo luận về yêu cầu ký gửi. Đội ngũ HomiHub luôn sẵn sàng hỗ trợ bạn trong quá trình xử lý, đảm bảo quy trình diễn ra suôn sẻ và hiệu quả.`,
          infoSections: `
            <div class="highlight-section">
              <h3>Thông tin bất động sản</h3>
              <ul>
                <li>Tiêu đề: ${property?.title || 'Chưa cung cấp'}</li>
                <li>Giá đề xuất: ${property?.price ? Number(property.price).toLocaleString() + ' VNĐ' : 'Chưa cung cấp'}</li>
                <li>Địa chỉ: ${location?.addr_street || ''}${location?.addr_details ? ', ' + location.addr_details : ''}${location?.addr_district ? ', ' + location.addr_district : ''}${location?.addr_city ? ', ' + location.addr_city : ''}</li>
              </ul>
            </div>
            <div class="highlight-section">
              <h3>Thông tin khách hàng</h3>
              <ul>
                <li>Tên: ${customer?.name || 'Chưa cung cấp'}</li>
                <li>Số điện thoại: ${customer?.numberPhone || 'Chưa cung cấp'}</li>
                <li>Email: ${customer?.email || 'Chưa cung cấp'}</li>
              </ul>
            </div>
            <div class="info-section">
              <h3>Hành động tiếp theo</h3>
              <ul>
                <li>Liên hệ khách hàng trong vòng 24 giờ để tư vấn chi tiết.</li>
                <li>Thu thập thêm thông tin về bất động sản (nếu cần) và báo cáo cho quản trị viên.</li>
                <li>Cập nhật tiến độ xử lý trên hệ thống để theo dõi.</li>
                <li>Liên hệ hotline nội bộ 0123 456 789 nếu cần hỗ trợ.</li>
              </ul>
            </div>
          `,
        });
        return transporter.sendMail({
          from: process.env.MAIL_USER,
          to: agent.gmail || agent.email,
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
      })
    );
    await new Promise((res) => setTimeout(res, 2000));
  }
};

const ADMIN_EMAILS = ['kietnguyen23012002@gmail.com'];

async function sendConsignmentRequestToAdmins({ propertyInfo, customerInfo }) {
  for (const adminEmail of ADMIN_EMAILS) {
    await sendConsignmentRequestToAdmin({
      adminEmail,
      propertyInfo,
      customerInfo,
    });
  }
}


const notifyAgentNewReview = async ({ agentEmail, agentName, review, reviewer }) => {
  // Kiểm tra đầu vào (tương tự các hàm auth-service)
  if (!agentEmail || !review?.rating || !reviewer?.name) {
    return {
      data: null,
      message: 'agentEmail, review.rating, and reviewer.name are required',
      errors: ['agentEmail, review.rating, and reviewer.name are required'],
    };
  }

  const htmlContent = getEmailTemplate({
    title: 'Bạn nhận được một đánh giá mới',
    greeting: agentName ? `Kính gửi ${agentName},` : 'Kính gửi Nhà Môi Giới,',
    mainMessage: `Bạn vừa nhận được một đánh giá mới từ khách hàng <b>${reviewer.name}
    </b> với số sao: <b>${review.rating}
    </b>.<br><br>Nội dung đánh giá: <i>${review.comment || ''}</i>`,
    infoSections: '',
  });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: agentEmail,
    subject: 'Bạn nhận được một đánh giá mới',
    html: htmlContent,
    attachments: [
      {
        filename: 'homihub.png',
        path: imagePath,
        cid: 'companylogo',
      },
    ],
  });
}



const sendAgentReplyAdminNotify = async ({ adminEmail, agentName, comment }) => {
  const htmlContent = getEmailTemplate({
    title: 'Agent vừa trả lời đánh giá',
    greeting: 'Kính gửi Quản trị viên,',
    mainMessage: `Agent <b>${agentName}
    </b> vừa trả lời một đánh giá của khách hàng.<br><br>Nội dung trả lời: <i>${comment}</i>`,
    infoSections: ''
  });
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: adminEmail,
    subject: 'Agent vừa trả lời đánh giá',
    html: htmlContent,
    attachments: [{ filename: 'homihub.png', path: imagePath, cid: 'companylogo' }],
  });
};


const sendAgentReplyApproved = async ({ agentEmail, agentName }) => {
  const htmlContent = getEmailTemplate({
    title: 'Phản hồi của bạn đã được duyệt',
    greeting: agentName ? `Kính gửi ${agentName},` : 'Kính gửi Nhà Môi Giới,',
    mainMessage: 'Phản hồi của bạn cho đánh giá khách hàng đã được quản trị viên duyệt và hiển thị công khai.',
    infoSections: ''
  });
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: agentEmail,
    subject: 'Phản hồi của bạn đã được duyệt',
    html: htmlContent,
    attachments: [{ filename: 'homihub.png', path: imagePath, cid: 'companylogo' }],
  });
};


const sendAgentReplyRejected = async ({ agentEmail, agentName }) => {
  const htmlContent = getEmailTemplate({
    title: 'Phản hồi của bạn bị từ chối',
    greeting: agentName ? `Kính gửi ${agentName},` : 'Kính gửi Nhà Môi Giới,',
    mainMessage: 'Phản hồi của bạn cho đánh giá khách hàng đã bị quản trị viên từ chối. Vui lòng kiểm tra lại nội dung và gửi lại nếu cần.',
    infoSections: ''
  });
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: agentEmail,
    subject: 'Phản hồi của bạn bị từ chối',
    html: htmlContent,
    attachments: [{ filename: 'homihub.png', path: imagePath, cid: 'companylogo' }],
  });
};


const sendAdminReplyUserNotify = async ({ userEmail, userName, comment }) => {
  const htmlContent = getEmailTemplate({
    title: 'Quản trị viên đã trả lời đánh giá của bạn',
    greeting: userName ? `Kính gửi ${userName},` : 'Kính gửi Quý khách,',
    mainMessage: `Quản trị viên đã trả lời đánh giá của bạn với nội dung: <i>${comment}</i>`,
    infoSections: ''
  });
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: userEmail,
    subject: 'Quản trị viên đã trả lời đánh giá của bạn',
    html: htmlContent,
    attachments: [{ filename: 'homihub.png', path: imagePath, cid: 'companylogo' }],
  });
};

export default {
  sendRegisterOTP,
  sendPasswordEmail,
  sendResetPasswordOTP,
  sendConsignmentRequestToAdmin,
  sendConsignmentRequestToCustomer,
  notifyAgentAssignedToProject,
  sendConsignmentRequestToAdmins,

  notifyAgentNewReview,
  sendAgentReplyAdminNotify,
  sendAgentReplyApproved,
  sendAgentReplyRejected,
  sendAdminReplyUserNotify,
};
