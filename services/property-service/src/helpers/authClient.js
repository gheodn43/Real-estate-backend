import axios from 'axios';

const getProfile = async (token) => {
  const res = await axios.get('http://auth-service:4001/auth/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
const getCustomerProfile = async (customerId, token) => {
  const res = await axios.get(
    `http://auth-service:4001/auth/profile/${customerId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

const getPublicAgentInfor = async (userId, token) => {
  const res = await axios.get(
    `http://auth-service:4001/auth/publish-agent-profile/${userId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const customerData = res.data.data.user;
  return {
    id: customerData.id,
    email: customerData.email,
    name: customerData.name,
    avatar: customerData.avatar,
    number_phone: customerData.number_phone,
  };
};

const getCustomerInfor = async (customerId, token) => {
  const res = await axios.get(
    `http://auth-service:4001/auth/profile/${customerId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const customerData = res.data.data.user;
  return {
    id: customerData.id,
    email: customerData.email,
    name: customerData.name,
    avatar: customerData.avatar,
    number_phone: customerData.number_phone,
  };
};

const getAdminInfor = async () => {
  return {
    id: 68,
    email: 'ngvatuan01052002@gmail.com',
    name: 'Nguyễn Viết Anh Tuấn',
    avatar:
      'https://res.cloudinary.com/dln9xmmqe/image/upload/v1753881654/admin-avatar_qibb4r.png',
    number_phone: '0794982254',
  };
};

const getUsersFromListIds = async (userIds, search, token) => {
  const res = await axios.post(
    'http://auth-service:4001/auth/get-user-from-list',
    { userIds, search }, // 👈 gửi body JSON
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export {
  getProfile,
  getCustomerProfile,
  getPublicAgentInfor,
  getAdminInfor,
  getUsersFromListIds,
  getCustomerInfor,
};
