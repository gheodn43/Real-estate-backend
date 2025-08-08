import axios from 'axios';

const verifyAgent = async (property_id) => {
  
  try {
    const response = await axios.get(`http://property-service:4002/prop/post/verify-agent/${property_id}`);
    if (response.data?.isValid) {
    } else {
    }
    return {
      isValid: response.data?.isValid || false,
      agent: response.data?.agent || null,
    };
  } catch (err) {
    return { isValid: false, agent: null };
  }
};

const getAssignedProperties = async (agentEmail) => {
  
  try {
    const res = await axios.get(`http://property-service:4002/prop/post/assigned-of-agent/${agent_id}`);
    if (res.status === 200) {
      return res.data.data;
    }
    return [];
  } catch (err) {
    return [];
  }
};

export { verifyAgent, getAssignedProperties };