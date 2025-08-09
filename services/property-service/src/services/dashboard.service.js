import prisma from '../middleware/prismaClient.js';
import RequestStatus from '../enums/requestStatus.enum.js';
import AgentHistoryType from '../enums/agentHistoryType.enum.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
// import CommissionStatus from '../enums/commissionStatus.enum.js';

const getPropertyType = async ({ start_date, end_date }) => {
  const whereBase = {
    created_at: {
      gte: start_date,
      lte: end_date,
    },
  };

  // 1. Consignment: sender_id != null
  const consignmentWhere = {
    ...whereBase,
    sender_id: null,
    request_status: {
      notIn: [RequestStatus.HIDDEN, null],
    },
  };
  const consignmentTotal = await prisma.properties.count({
    where: consignmentWhere,
  });

  const consignmentAssigned = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: {
        not: null,
      },
      agentHistory: {
        some: {
          type: AgentHistoryType.ASSIGNED,
        },
      },
    },
  });

  const consignmentNotAssigned = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: {
        not: null,
      },
      agentHistory: {
        none: {
          type: AgentHistoryType.ASSIGNED,
        },
      },
    },
  });

  const consignmentPublished = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: {
        not: null,
      },
      request_status: RequestStatus.PUBLISHED,
    },
  });

  const consignmentRejected = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: {
        not: null,
      },
      request_status: RequestStatus.REJECTED,
    },
  });

  // 2. Outside: sender_id == null
  const outsideWhere = {
    ...whereBase,
    sender_id: null,
    requestpost_status: {
      not: RequestPostStatus.HIDDEN,
    },
  };

  const outsideTotal = await prisma.properties.count({ where: outsideWhere });

  const outsidePending = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: null,
      requestpost_status: RequestPostStatus.PENDING_APPROVAL,
    },
  });

  const outsidePublished = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: null,
      requestpost_status: RequestPostStatus.PUBLISHED,
    },
  });

  const outsideRejected = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: null,
      requestpost_status: RequestPostStatus.REJECTED,
    },
  });

  const outsideCompleted = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: null,
      requestpost_status: RequestPostStatus.EXPIRED,
    },
  });

  return {
    total_property: consignmentTotal + outsideTotal,
    consignment: {
      total: consignmentTotal,
      not_assigned: consignmentNotAssigned,
      assigned: consignmentAssigned,
      publish: consignmentPublished,
      rejected: consignmentRejected,
    },
    outside: {
      total: outsideTotal,
      pending: outsidePending,
      published: outsidePublished,
      rejected: outsideRejected,
      completed: outsideCompleted,
    },
  };
};

export default {
  getPropertyType,
};
