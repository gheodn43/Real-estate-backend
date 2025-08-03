import prisma from '../middleware/prismaClient.js';
import AgentHistoryType from '../enums/agentHistoryType.enum.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';

const createHistory = async (data) => {
  const history = await prisma.property_agent_history.create({
    data: {
      property_id: data.propertyId,
      agent_id: data.agentId,
      type: AgentHistoryType.ASSIGNED,
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
        in: [AgentHistoryType.ASSIGNED],
      },
    },
  });
  const draftPost = await prisma.properties.findFirst({
    where: {
      id: propertyId,
      requestpost_status: RequestPostStatus.DRAFT,
      sender_id: agentId,
    },
  });
  if (history || draftPost) {
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

const getPropertyAssignedForAgent = async (agentId) => {
  const histories = await prisma.property_agent_history.findMany({
    where: {
      agent_id: agentId,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  const propertyGroups = new Map();
  histories.forEach((history) => {
    if (!propertyGroups.has(history.property_id)) {
      propertyGroups.set(history.property_id, []);
    }
    propertyGroups.get(history.property_id).push(history);
  });

  const propertyIds = [];
  propertyGroups.forEach((records, propertyId) => {
    const lastAssigned = [...records]
      .reverse()
      .find((r) => r.type === 'ASSIGNED');
    if (lastAssigned) {
      propertyIds.push(propertyId);
    }
  });

  return propertyIds;
};

const requestAssignToProject = async (propertyId, userData) => {
  const request = await prisma.property_agent_history.create({
    data: {
      property_id: propertyId,
      agent_id: userData.userId,
      type: AgentHistoryType.REQUEST,
    },
  });
  return request;
};

const acceptRequestAssign = async (propertyId, agent_id) => {
  return await prisma.$transaction(async (tx) => {
    // 1️⃣ Xoá các record REQUEST sau lần ASSIGNED gần nhất
    const lastAssign = await tx.property_agent_history.findFirst({
      where: {
        property_id: propertyId,
        type: AgentHistoryType.ASSIGNED,
      },
      orderBy: { created_at: 'desc' },
    });

    if (lastAssign) {
      await tx.property_agent_history.deleteMany({
        where: {
          property_id: propertyId,
          type: AgentHistoryType.REQUEST,
          agent_id: { not: agent_id },
          created_at: { gt: lastAssign.created_at },
        },
      });
    } else {
      // Nếu chưa từng assign, có thể xoá tất cả request cũ
      await tx.property_agent_history.deleteMany({
        where: {
          property_id: propertyId,
          type: AgentHistoryType.REQUEST,
          agent_id: { not: agent_id },
        },
      });
    }

    //tạo ASSIGNED mới
    const newAssign = await tx.property_agent_history.create({
      data: {
        property_id: propertyId,
        agent_id,
        type: AgentHistoryType.ASSIGNED,
      },
    });

    return newAssign;
  });
};

const removeRequestAssign = async (propertyId, agent_id) => {
  const request = await prisma.property_agent_history.create({
    data: {
      property_id: propertyId,
      agent_id: agent_id,
      type: AgentHistoryType.LEAVED,
    },
  });
  return request;
};

const rejectRequestAssign = async (propertyId, agent_id) => {
  await prisma.property_agent_history.deleteMany({
    where: {
      property_id: propertyId,
      agent_id: agent_id,
    },
  });
};

export default {
  createHistory,
  verifyOwnerPost,
  getHistoryByAgentId,
  getPropertyAssignedForAgent,
  acceptRequestAssign,
  rejectRequestAssign,
  removeRequestAssign,
  requestAssignToProject,
};
