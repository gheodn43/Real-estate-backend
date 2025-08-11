import prisma from '../middleware/prismaClient.js';
import AgentCommissionFeeStatus from '../enums/AgentCommissionFeeStatus.js';
import { getPublicListAgent } from '../helpers/authClient.js';

// model commissions {
//   id           Int        @id @default(autoincrement())
//   property_id  Int
//   status       CommissionStatus @default(processing)
//   type         CommissionType @default(buying)
//   commission   Decimal    @db.Decimal(15, 2)
//   latest_price Decimal?   @db.Decimal(15, 2)
//   contract_url String?
//   created_at   DateTime   @default(now())
//   updated_at   DateTime   @default(now())

//   property     properties @relation(fields: [property_id], references: [id])
//   agent_commission_fee agent_commission_fee[]
// }

// model agent_commission_fee {
//   id             Int       @id @default(autoincrement())
//   commission_id  Int
//   agent_id       Int
//   commission_value Decimal @db.Decimal(15, 2)
//   reject_reason  String?
//   status         AgentCommissionFeeStatus @default(processing)
//   created_at     DateTime   @default(now())
//   updated_at     DateTime   @default(now())

//   commission     commissions @relation(fields: [commission_id], references: [id])
// }

// model sale_bonus {
//   id                 Int       @id @default(autoincrement())
//   agent_id           Int
//   buying_quantity    Int
//   rental_quantity    Int
//   total_buying_commission Decimal @db.Decimal(15, 2)
//   total_rental_commission Decimal @db.Decimal(15, 2)
//   bonus              Decimal @db.Decimal(15, 2) @default(0)
//   penalty            Decimal @db.Decimal(15, 2) @default(0)
//   review             String?
//   review_by          Int?
//   bonus_of_month     String?
//   created_at         DateTime  @default(now())
//   updated_at         DateTime  @default(now())
// }

const getListAgentAndOverviewTransactionInMonth = async (
  filters,
  pagination
) => {
  const { bonusMonth, start_date, end_date, search } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const onlyAgent = true;
  const { agents, total } = await getPublicListAgent(
    page,
    limit,
    search,
    onlyAgent
  );

  // Chuẩn bị điều kiện filter thời gian
  let dateFilter = {};
  if (start_date && end_date) {
    dateFilter = {
      updated_at: {
        gte: start_date,
        lte: end_date,
      },
    };
  }

  // Lấy commission cho từng agent
  const results = await Promise.all(
    agents.map(async (agent) => {
      const commissions = await prisma.commissions.findMany({
        where: {
          ...dateFilter,
          agent_commission_fee: {
            some: {
              agent_id: agent.id,
              status: {
                in: [
                  AgentCommissionFeeStatus.CONFIRMED,
                  AgentCommissionFeeStatus.REJECTED,
                ],
              },
            },
          },
        },
        skip,
        take: limit,
        include: {
          agent_commission_fee: {
            select: {
              commission_value: true,
              status: true,
            },
          },
        },
      });
      const saleBonus = await prisma.sale_bonus.findMany({
        where: {
          agent_id: agent.id,
          bonus_of_month: bonusMonth,
        },
      });

      // Tính toán các field
      let buying_quantity_completed = 0;
      let rental_quantity_completed = 0;
      let quantity_rejected = 0;
      let total_commissions = 0;

      commissions.forEach((c) => {
        const status = c.agent_commission_fee?.[0]?.status;
        const commissionValue = Number(
          c.agent_commission_fee?.[0]?.commission_value || 0
        );

        if (status === 'confirmed') {
          if (c.type === 'buying') buying_quantity_completed++;
          if (c.type === 'rental') rental_quantity_completed++;
          total_commissions += commissionValue;
        } else if (status === 'rejected') {
          quantity_rejected++;
        }
      });

      return {
        ...agent,
        buying_quantity_completed,
        rental_quantity_completed,
        quantity_rejected,
        total_commissions,
        sent_mail: saleBonus.length > 0 ? true : false,
      };
    })
  );
  const sentMailForAll = results.every((item) => item.sent_mail === true);
  return { total, results, sentMailForAll };
};

const getCompleteTransactionOfAgentInMonth = async (filters, pagination) => {
  const { agent_id, start_date, end_date, search, bonusMonth } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    agent_commission_fee: {
      some: {
        agent_id,
        status: {
          in: [
            AgentCommissionFeeStatus.CONFIRMED,
            AgentCommissionFeeStatus.REJECTED,
          ],
        },
      },
    },
  };

  if (search) {
    where.property = {
      title: { contains: search },
    };
  }

  if (start_date && end_date) {
    where.updated_at = {
      gte: start_date,
      lte: end_date,
    };
  }

  const [total, resultsRaw] = await Promise.all([
    prisma.commissions.count({ where }),
    prisma.commissions.findMany({
      where,
      skip,
      take: limit,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            before_price_tag: true,
            price: true,
            after_price_tag: true,
          },
        },
        agent_commission_fee: {
          select: {
            commission_value: true,
            status: true,
          },
        },
      },
    }),
  ]);
  const saleBonus = await prisma.sale_bonus.findMany({
    where: {
      agent_id: agent_id,
      bonus_of_month: bonusMonth,
    },
  });

  // Format lại kết quả
  const results = resultsRaw.map((item) => {
    const { agent_commission_fee, ...rest } = item;
    return {
      ...rest,
      commission_value: agent_commission_fee?.[0]?.commission_value,
      status: agent_commission_fee?.[0]?.status,
    };
  });
  const sent_mail = saleBonus.length > 0 ? true : false;

  return { total, results, sent_mail };
};

const initSaleBonus = async (data) => {
  await prisma.sale_bonus.create({
    data: {
      agent_id: data.agent_id,
      buying_quantity: data.buying_quantity,
      rental_quantity: data.rental_quantity,
      total_buying_commission: data.total_buying_commission,
      total_rental_commission: data.total_rental_commission,
      bonus: data.bonus,
      penalty: data.penalty,
      review: data.review,
      review_by: data.review_by,
      bonus_of_month: data.bonus_of_month,
    },
  });
};

const getBonusHistoryOfAgent = async (filters, pagination) => {
  let { start_date, end_date } = normalizeDateRange(
    filters.start_date,
    filters.end_date
  );
  const { page, limit } = pagination;
  const { agent_id } = filters;

  const where = {
    agent_id,
    ...(start_date || end_date
      ? {
          created_at: {
            ...(start_date && { gte: start_date }),
            ...(end_date && { lte: end_date }),
          },
        }
      : {}),
  };

  const [total, results] = await Promise.all([
    prisma.sale_bonus.count({
      where,
    }),
    prisma.sale_bonus.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
  ]);
  return { total, results };
};

const getOneBonusHistoryOfAgent = async (id) => {
  return await prisma.sale_bonus.findUnique({
    where: {
      id,
    },
  });
};

function normalizeDateRange(start_date, end_date) {
  let normalizedStart = start_date;
  let normalizedEnd = end_date;
  if (start_date && !end_date) {
    normalizedEnd = new Date();
  }
  if (!start_date && end_date) {
    normalizedStart = new Date(2020, 0, 1); // 01/01/2020
  }
  return { start_date: normalizedStart, end_date: normalizedEnd };
}

const getAgentAndThemTransactionInfoNeededSendMail = async (
  month,
  start_date,
  end_date
) => {
  const page = 1;
  const limit = 1000;
  const search = '';
  const onlyAgent = true;

  // 1. Lấy danh sách agent đã gửi mail
  const agentHadSentMail = await prisma.sale_bonus.findMany({
    where: { bonus_of_month: month },
    select: { agent_id: true },
  });
  const sentMailSet = new Set(agentHadSentMail.map((a) => a.agent_id));

  // 2. Lấy tất cả agent
  const { agents, total } = await getPublicListAgent(
    page,
    limit,
    search,
    onlyAgent
  );

  // 3. Filter agent chưa gửi mail
  const agentsToSendMail = agents.filter((agent) => !sentMailSet.has(agent.id));

  if (!agentsToSendMail.length) {
    return { total, agentCommissions: [] };
  }

  // 4. Lấy danh sách agent_id để query commission
  const agentIds = agentsToSendMail.map((a) => a.id);

  const where = {
    agent_commission_fee: {
      some: {
        agent_id: { in: agentIds },
        status: {
          in: [
            AgentCommissionFeeStatus.CONFIRMED,
            AgentCommissionFeeStatus.REJECTED,
          ],
        },
      },
    },
  };
  if (start_date && end_date) {
    where.updated_at = {
      gte: start_date,
      lte: end_date,
    };
  }

  // 5. Query commissions
  const commissions = await prisma.commissions.findMany({
    where,
    select: {
      type: true,
      commission: true,
      latest_price: true,
      property: {
        select: {
          id: true,
          title: true,
          description: true,
          before_price_tag: true,
          price: true,
          after_price_tag: true,
          locations: {
            select: {
              addr_details: true,
              addr_street: true,
              addr_district: true,
              addr_city: true,
            },
          },
        },
      },
      agent_commission_fee: {
        select: {
          agent_id: true,
          commission_value: true,
          status: true,
        },
      },
    },
  });

  // 6. Nhóm commission theo agent_id và type
  const commissionMap = {};
  for (const c of commissions) {
    for (const fee of c.agent_commission_fee) {
      if (!commissionMap[fee.agent_id]) {
        commissionMap[fee.agent_id] = {
          rentalCommissionCompleted: [],
          buyingCommissionCompleted: [],
          bonus: 0,
          penalty: 0,
          review: null,
        };
      }

      const commissionItem = {
        propertyId: c.property.id,
        propertyName: c.property.title,
        propertyPrice: c.property.price,
        propertyAddress: c.property.locations
          ? `${c.property.locations.addr_details || ''}, ${c.property.locations.addr_street || ''}, ${c.property.locations.addr_district || ''}, ${c.property.locations.addr_city || ''}`
          : null,
        commission: `${c.commission}%`,
        commissionValue: fee.commission_value,
      };

      if (
        c.type === 'rental' &&
        fee.status === AgentCommissionFeeStatus.CONFIRMED
      ) {
        commissionMap[fee.agent_id].rentalCommissionCompleted.push(
          commissionItem
        );
      } else if (
        c.type === 'buying' &&
        fee.status === AgentCommissionFeeStatus.CONFIRMED
      ) {
        commissionMap[fee.agent_id].buyingCommissionCompleted.push(
          commissionItem
        );
      }
    }
  }

  // 7. Gắn commissionOfMonth vào agents
  const enrichedAgents = agentsToSendMail.map((agent) => ({
    agent: {
      id: agent.id,
      name: agent.name,
      email: agent.email,
      number_phone: agent.number_phone,
    },
    commissionOfMonth: commissionMap[agent.id] || {
      rentalCommissionCompleted: [],
      buyingCommissionCompleted: [],
      bonus: 0,
      penalty: 0,
      review: null,
    },
  }));

  const saleBonusData = enrichedAgents.map(({ agent, commissionOfMonth }) => {
    const rentalQuantity = commissionOfMonth.rentalCommissionCompleted.length;
    const buyingQuantity = commissionOfMonth.buyingCommissionCompleted.length;

    const totalRentalCommission =
      commissionOfMonth.rentalCommissionCompleted.reduce(
        (sum, item) => sum + (Number(item.commissionValue) || 0),
        0
      );

    const totalBuyingCommission =
      commissionOfMonth.buyingCommissionCompleted.reduce(
        (sum, item) => sum + (Number(item.commissionValue) || 0),
        0
      );

    return {
      agent_id: agent.id,
      buying_quantity: buyingQuantity,
      rental_quantity: rentalQuantity,
      total_buying_commission: totalBuyingCommission,
      total_rental_commission: totalRentalCommission,
      bonus: commissionOfMonth.bonus || 0,
      penalty: commissionOfMonth.penalty || 0,
      review: commissionOfMonth.review || null,
      bonus_of_month: month,
    };
  });

  // Insert nhiều record cùng lúc
  await prisma.sale_bonus.createMany({
    data: saleBonusData,
  });

  return { total, agentCommissions: enrichedAgents };
};

export default {
  getCompleteTransactionOfAgentInMonth,
  initSaleBonus,
  getBonusHistoryOfAgent,
  getOneBonusHistoryOfAgent,
  getListAgentAndOverviewTransactionInMonth,
  getAgentAndThemTransactionInfoNeededSendMail,
};
