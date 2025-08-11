import axios from 'axios';
const sendMailToAgents = async (agentCommissions) => {
  const res = await axios.post(
    'http://mail-service:4003/mail/auth/sendBulkCommissionEmails',
    { agentCommissions }
  );
  return res.data;
};

export { sendMailToAgents };
