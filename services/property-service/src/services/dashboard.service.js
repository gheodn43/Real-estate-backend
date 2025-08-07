import prisma from '../middleware/prismaClient.js';
import RequestStatus from '../enums/requestStatus.enum.js';
// import CommissionStatus from '../enums/commissionStatus.enum.js';
// import RequestPostStatus from '../enums/requestPostStatus.enum.js';

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
    sender_id: {
      not: null,
    },
    request_status: {
      not: RequestStatus.HIDDEN,
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
          type: 'assigned',
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
      request_status: 'pending',
      agentHistory: {
        none: {
          type: 'assigned',
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
      request_status: 'published',
    },
  });

  const consignmentRejected = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: {
        not: null,
      },
      request_status: 'rejected',
    },
  });

  // 2. Outside: sender_id == null
  const outsideWhere = {
    ...whereBase,
    sender_id: null,
    requestpost_status: {
      not: 'hidden',
    },
  };

  const outsideTotal = await prisma.properties.count({ where: outsideWhere });

  const outsidePending = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: null,
      requestpost_status: 'pending',
    },
  });

  const outsidePublished = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: null,
      requestpost_status: 'published',
    },
  });

  const outsideRejected = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: null,
      requestpost_status: 'rejected',
    },
  });

  const outsideCompleted = await prisma.properties.count({
    where: {
      ...whereBase,
      sender_id: null,
      requestpost_status: 'expired',
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

module.exports = {
  getPropertyType,
};
