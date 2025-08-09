import prisma from '../middleware/prismaClient.js';
import RequestStatus from '../enums/requestStatus.enum.js';
// import AgentHistoryType from '../enums/agentHistoryType.enum.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
// import CommissionStatus from '../enums/commissionStatus.enum.js';
const getPropertyType = async ({ start_date, end_date }) => {
  const whereBase = {
    created_at: {
      gte: start_date,
      lte: end_date,
    },
  };

  // Lấy toàn bộ bản ghi trong khoảng thời gian
  const properties = await prisma.properties.findMany({
    where: whereBase,
    select: {
      sender_id: true,
      request_status: true,
      requestpost_status: true,
    },
  });

  let consignmentTotal = 0;
  let consignmentCompleted = 0;
  let consignmentPending = 0;
  let consignmentNegotiating = 0;
  let consignmentPublished = 0;
  let consignmentRejected = 0;

  let outsideTotal = 0;
  let outsidePending = 0;
  let outsidePublished = 0;
  let outsideRejected = 0;
  let outsideCompleted = 0;

  for (const p of properties) {
    const isConsignment = p.sender_id !== null;
    if (isConsignment) {
      if (
        p.request_status !== RequestStatus.HIDDEN &&
        p.request_status !== null
      ) {
        consignmentTotal++;
      }
      switch (p.request_status) {
        case RequestStatus.COMPLETED:
          consignmentCompleted++;
          break;
        case RequestStatus.PENDING:
          consignmentPending++;
          break;
        case RequestStatus.NEGOTIATING:
          consignmentNegotiating++;
          break;
        case RequestStatus.PUBLISHED:
          consignmentPublished++;
          break;
        case RequestStatus.REJECTED:
          consignmentRejected++;
          break;
      }
    } else {
      if (p.requestpost_status !== RequestPostStatus.HIDDEN) {
        outsideTotal++;
      }
      switch (p.requestpost_status) {
        case RequestPostStatus.PENDING_APPROVAL:
          outsidePending++;
          break;
        case RequestPostStatus.PUBLISHED:
          outsidePublished++;
          break;
        case RequestPostStatus.REJECTED:
          outsideRejected++;
          break;
        case RequestPostStatus.EXPIRED:
          outsideCompleted++;
          break;
      }
    }
  }

  return {
    total_property: consignmentTotal + outsideTotal,
    consignment: {
      total: consignmentTotal,
      pending: consignmentPending,
      negotiating: consignmentNegotiating,
      published: consignmentPublished,
      rejected: consignmentRejected,
      completed: consignmentCompleted,
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
