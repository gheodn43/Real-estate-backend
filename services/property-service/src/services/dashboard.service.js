import prisma from '../middleware/prismaClient.js';
import RequestStatus from '../enums/requestStatus.enum.js';
import AgentHistoryType from '../enums/agentHistoryType.enum.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
import { RoleName } from '../middleware/roleGuard.js';
import AgentCommissionFeeStatus from '../enums/AgentCommissionFeeStatus.js';
import CommissionType from '../enums/commissionType.enum.js';

const getPropertyType = async (filter, userData) => {
  const { start_date, end_date } = filter;
  const whereBase = {
    created_at: {
      gte: start_date,
      lte: end_date,
    },
  };

  let properties = await prisma.properties.findMany({
    where: whereBase,
    select: {
      sender_id: true,
      request_status: true,
      requestpost_status: true,
      agentHistory: {
        orderBy: { created_at: 'desc' },
        take: 1,
        where: {
          type: AgentHistoryType.ASSIGNED,
        },
        select: {
          agent_id: true,
          type: true,
        },
      },
    },
  });

  // Nếu là agent thì filter lại theo agent_id
  if (userData.userRole === RoleName.Agent) {
    properties = properties.filter(
      (p) => p.agentHistory[0]?.agent_id === userData.userId
    );
  }

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
    consignment: {
      total: consignmentTotal,
      completed: consignmentCompleted,
      pending: consignmentPending,
      negotiating: consignmentNegotiating,
      published: consignmentPublished,
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

async function getRevenueWithType(filter) {
  const { mooc_date } = filter;
  const moocDate = mooc_date;

  // Lấy ngày đầu tháng của moocDate
  const baseDate = new Date(moocDate.getFullYear(), moocDate.getMonth(), 1);

  // Tạo mảng 12 tháng gần nhất
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(baseDate);
    date.setMonth(baseDate.getMonth() - (11 - i));

    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const monthStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

    return { month: monthStr, start, end };
  });
  const startDate = months[0].start;
  const endDate = months[months.length - 1].end;
  const commissions = await prisma.commissions.findMany({
    where: {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      agent_commission_fee: {
        where: {
          status: AgentCommissionFeeStatus.CONFIRMED,
        },
      },
    },
  });
  const result = months.map(({ month, start, end }) => {
    const monthCommissions = commissions.filter(
      (c) => c.updated_at >= start && c.updated_at <= end
    );

    let rentalCommissionValue = 0;
    let buyingCommissionValue = 0;

    monthCommissions.forEach((c) => {
      const totalValue = c.agent_commission_fee.reduce(
        (sum, fee) => sum + Number(fee.commission_value),
        0
      );

      if (c.type === CommissionType.RENTAL) {
        rentalCommissionValue += totalValue;
      } else if (c.type === CommissionType.BUYING) {
        buyingCommissionValue += totalValue;
      }
    });

    return {
      month,
      rentalCommissionValue,
      buyingCommissionValue,
    };
  });

  return result;
}

export default {
  getPropertyType,
  getRevenueWithType,
};
