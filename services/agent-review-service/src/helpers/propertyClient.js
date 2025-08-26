import axios from 'axios';

const verifyAgent = async (property_id) => {
  try {
    const response = await axios.get(
      `http://property-service:4002/prop/post/verify-agent/${property_id}`
    );
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
    const res = await axios.get(
      `http://property-service:4002/prop/get-agent-assigned-for-property/${propertyId}`
    );
    if (res.status === 200) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    return null;
  }
};

const getPropertyInfor = async (property_id, token) => {
  try {
    const res = await axios.get(
      `http://property-service:4002/prop/post/${property_id}`,
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

const getListPropOfAgent = async (agentId, page, limit, search) => {
  try {
    const res = await axios.get(
      `http://property-service:4002/prop/of-agent/${agentId}`,
      {
        params: {
          page,
          limit,
          search,
        },
      }
    );
    return res.data.data;
  } catch (err) {
    // TODO: handle error later
  }
};

export {
  verifyAgent,
  getAssignedProperties,
  getAgentAssignedForProperty,
  getPropertyInfor,
  getListPropOfAgent,
};
