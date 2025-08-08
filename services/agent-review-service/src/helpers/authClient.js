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
const getUserFromAuthService = async (userId, token) => {
  const res = await axios.get(`http://auth-service:4001/auth/profile/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
const getAgentFromAuthService = async (agentId, token) => {
  const res = await axios.get(
    `http://auth-service:4001/auth/profile/${agentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

const getPublicAgentInfor = async (userId) => {
  // Validate userId
  if (!Number.isInteger(Number(userId)) || userId <= 0) {
    throw new Error('Invalid userId: Must be a positive integer');
  }

  try {
    
    const res = await axios.get(
      `http://auth-service:4001/auth/publish-agent-profile/${userId}`

    );

    // Kiểm tra cấu trúc dữ liệu trả về
    const customerData = res.data?.data?.user;
    if (!customerData) {
      throw new Error('No user data found in response');
    }

    // Trả về object với các thuộc tính cần thiết, loại bỏ key trùng lặp
    return {
      id: customerData.id,
      email: customerData.email,
      name: customerData.name,
      avatar: customerData.avatar,
      number_phone: customerData.number_phone,
      gender: customerData.gender,
      addr_city: customerData.addr_city,
      addr_district: customerData.addr_district,
      addr_street: customerData.addr_street,
      addr_detail: customerData.addr_detail,
    };
  } catch (err) {

    throw new Error(`Failed to fetch agent information: ${err.message}`);
  }
};
export { getProfile, getCustomerProfile, getUserFromAuthService, getAgentFromAuthService, getPublicAgentInfor };

