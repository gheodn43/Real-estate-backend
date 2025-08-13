import prisma from '../middleware/prismaClient.js';
import RequestStatus from '../enums/requestStatus.enum.js';
import AgentHistoryType from '../enums/agentHistoryType.enum.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
import { RoleName } from '../middleware/roleGuard.js';
import AgentCommissionFeeStatus from '../enums/AgentCommissionFeeStatus.js';
import CommissionType from '../enums/commissionType.enum.js';
import { getUsersFromListIds } from '../helpers/authClient.js';

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

async function getRevenueWithType(filter, userData) {
  const { mooc_date, month_lenght } = filter;
  const moocDate = mooc_date;
  const monthLenght = Number(month_lenght);

  // Lấy mốc 00:01 của tháng sau moocDate
  const baseDate = new Date(
    moocDate.getFullYear(),
    moocDate.getMonth() + 1,
    1,
    0,
    1,
    0,
    0
  );
  // Tạo mảng 12 tháng gần nhất
  const months = Array.from({ length: monthLenght }, (_, i) => {
    const date = new Date(baseDate);
    date.setMonth(baseDate.getMonth() - (monthLenght - i));

    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 1, 0, 0);
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

  const agentFeeWhere = {
    status: AgentCommissionFeeStatus.CONFIRMED,
    ...(userData.userRole === RoleName.Agent
      ? { agent_id: userData.userId }
      : {}),
  };
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
        where: agentFeeWhere,
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

async function getTop3AgentsInMonth(filter, token) {
  const { mooc_date } = filter;
  const search = '';
  const moocDate = mooc_date instanceof Date ? mooc_date : new Date(mooc_date);

  // ===== Bước 1: Xác định ngày bắt đầu và kết thúc của tháng =====
  const startOfMonth = new Date(
    moocDate.getFullYear(),
    moocDate.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
  const endOfMonth = new Date(
    moocDate.getFullYear(),
    moocDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  // ===== Bước 2: Lấy agent_commission_fee hợp lệ trong tháng =====
  const commissionFees = await prisma.agent_commission_fee.findMany({
    where: {
      status: AgentCommissionFeeStatus.CONFIRMED,
      created_at: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      commission: true,
    },
  });

  // Gom dữ liệu theo agent_id
  const agentStatsMap = {};
  commissionFees.forEach((fee) => {
    const agentId = fee.agent_id;
    if (!agentStatsMap[agentId]) {
      agentStatsMap[agentId] = {
        rentalCommissionCount: 0,
        rentalCommissionValue: 0,
        buyingCommissionCount: 0,
        buyingCommissionValue: 0,
      };
    }

    const value = Number(fee.commission_value);
    const type = fee.commission?.type;

    if (type === CommissionType.RENTAL) {
      agentStatsMap[agentId].rentalCommissionValue += value;
      agentStatsMap[agentId].rentalCommissionCount += 1;
    } else if (type === CommissionType.BUYING) {
      agentStatsMap[agentId].buyingCommissionValue += value;
      agentStatsMap[agentId].buyingCommissionCount += 1;
    }
  });

  // ===== Bước 3: Lấy thông tin agent =====
  const agentIds = Object.keys(agentStatsMap).map((id) => Number(id));
  if (agentIds.length === 0) {
    return { top1: [], top2: [], top3: [] };
  }

  const agentsInfo = await getUsersFromListIds(agentIds, search, token);

  // ===== Bước 4: Kết hợp dữ liệu và sắp xếp =====
  const combinedList = agentsInfo.data.map((agent) => {
    return {
      agent: {
        id: agent.id,
        email: agent.email,
        name: agent.name,
        avatar: agent.avatar,
        number_phone: agent.number_phone,
      },
      ...agentStatsMap[agent.id],
      totalValue:
        agentStatsMap[agent.id].rentalCommissionValue +
        agentStatsMap[agent.id].buyingCommissionValue,
    };
  });

  combinedList.sort((a, b) => b.totalValue - a.totalValue);

  // ===== Bước 5: Chia top1, top2, top3 theo giá trị tổng =====
  const top1Value = combinedList[0]?.totalValue ?? 0;
  const top1 = combinedList.filter((a) => a.totalValue === top1Value);

  const remainingAfterTop1 = combinedList.filter(
    (a) => a.totalValue < top1Value
  );
  const top2Value = remainingAfterTop1[0]?.totalValue ?? 0;
  const top2 = remainingAfterTop1.filter((a) => a.totalValue === top2Value);

  const remainingAfterTop2 = remainingAfterTop1.filter(
    (a) => a.totalValue < top2Value
  );
  const top3Value = remainingAfterTop2[0]?.totalValue ?? 0;
  const top3 = remainingAfterTop2.filter((a) => a.totalValue === top3Value);

  return { top1, top2, top3 };
}

export default {
  getPropertyType,
  getRevenueWithType,
  getTop3AgentsInMonth,
};
