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

const getAssignedProperties = async (agent_id, token) => {
  try {
    const res = await axios.get(
    `http://property-service:4002/prop/post/assigned-of-agent/${agent_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
    if (res.status === 200) {
      return res.data.data;
    }
    return [];
  } catch (err) {
    return [];
  }
};

const getAgentAssignedForProperty = async (propertyId) => {
  
  try {
    const res = await axios.get(`http://property-service:4002/prop/get-agent-assigned-for-property/${propertyId}`);
    if (res.status === 200) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    return null;
  }
};



export { verifyAgent, getAssignedProperties, getAgentAssignedForProperty };
