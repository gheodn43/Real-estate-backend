import axios from 'axios';

const verifyAgent = async (property_id, token) => {
  try {
    const res = await axios.get(`http://property-service:4002/prop/post/verify-agent/${property_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 200) {
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error in getPropertyAgent for property_id ${property_id}:`, err.message);
    return false;
  }
};



const getAssignedProperties = async (agent_id, token) => {
  try {
    const res = await axios.get(`http://property-service:4002/prop/post/assigned-of-agent/${agent_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 200) {
            console.log(res.data.data);

      return res.data.data; 
    }
    return [];
  } catch (err) {
    console.error(`Error in getAssignedProperties for agent_id ${agent_id}:`, err.message);
    return [];
  }
};

export { verifyAgent, getAssignedProperties };
