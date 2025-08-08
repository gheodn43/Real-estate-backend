import axios from 'axios';

const verifyAgent = async (property_id) => {
  console.log(`Calling verify-agent API for property_id: ${property_id}`);
  console.log(`http://property-service:4002/prop/post/verify-agent/${property_id}`);
  try {
    const response = await axios.get(`http://property-service:4002/prop/post/verify-agent/${property_id}`);
    console.log('verify-agent response:', JSON.stringify(response.data, null, 2));
    if (response.data?.isValid) {
      console.log('Agent is valid:', response.data.agent);
    } else {
      console.log('Agent is not valid');
    }
    return {
      isValid: response.data?.isValid || false,
      agent: response.data?.agent || null,
    };
  } catch (err) {
    console.log('Error in verifyAgent:', err.message);
    return { isValid: false, agent: null };
  }
};

const getAssignedProperties = async (agentEmail) => {
  console.log(`Calling getAssignedProperties API for agentEmail: ${agentEmail}`);
  console.log(`http://property-service:4002/prop/post/assigned-of-agent/${agentEmail}`);

  try {
    const res = await axios.get(`http://property-service:4002/prop/post/assigned-of-agent/${agent_id}`);
    if (res.status === 200) {
      console.log('getAssignedProperties data:', res.data.data);
      return res.data.data;
    }
    return [];
  } catch (err) {
    return [];
  }
};

export { verifyAgent, getAssignedProperties };