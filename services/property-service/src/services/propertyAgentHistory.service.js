import prisma from '../middleware/prismaClient.js';
import AgentHistoryType from '../enums/agentHistoryType.enum.js';
import { RoleName } from '../middleware/roleGuard.js';

const createHistory = async (data) => {
  let type = '';
  if (data.userRole === RoleName.Admin) {
    type = AgentHistoryType.ASSIGNED;
  } else {
    type = AgentHistoryType.REQUEST;
  }
  const history = await prisma.property_agent_history.create({
    data: {
      property_id: data.propertyId,
      agent_id: data.agentId,
      type: type,
    },
  });
  return history;
};
const verifyOwnerPost = async (agentId, propertyId) => {
  const history = await prisma.property_agent_history.findFirst({
    where: {
      property_id: propertyId,
      agent_id: agentId,
      type: {
        in: [AgentHistoryType.ASSIGNED, AgentHistoryType.REQUEST],
      },
    },
  });
  if (history) {
    return true;
  }
  return false;
};

const getHistoryByAgentId = async (agentId) => {
  const histories = await prisma.property_agent_history.findMany({
    where: {
      agent_id: agentId,
      type: {
        in: [AgentHistoryType.ASSIGNED, AgentHistoryType.REQUEST],
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  const propertyIdMap = new Map();
  histories.forEach((history) => {
    propertyIdMap.set(history.property_id, history);
  });
  return Array.from(propertyIdMap.keys());
};

export default {
  createHistory,
  verifyOwnerPost,
  getHistoryByAgentId,
};
