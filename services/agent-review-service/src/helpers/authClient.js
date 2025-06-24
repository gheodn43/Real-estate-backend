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
const getUserFromAuthService = async (userId) => {
  const res = await axios.get(`http://auth-service:4001/auth/profile/${userId}`);
  return res.data;
};
const getAgentFromAuthService = async (agentId) => {
  const res = await axios.get(`http://auth-service:4001/auth/profile/${agentId}`);
  return res.data;
};
export { getProfile, getCustomerProfile, getUserFromAuthService, getAgentFromAuthService };
