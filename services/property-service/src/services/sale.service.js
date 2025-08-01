import prisma from '../middleware/prismaClient.js';
import AgentCommissionFeeStatus from '../enums/AgentCommissionFeeStatus.js';

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
//   payment_at         DateTime?
//   created_at         DateTime  @default(now())
//   updated_at         DateTime  @default(now())
// }

const getCompleteTransactionOfAgentInMonth = async (filters, pagination) => {
  const { agent_id, start_date, end_date, search } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const where = {
    agent_commission_fee: {
      some: {
        agent_id,
        status: AgentCommissionFeeStatus.CONFIRMED,
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
  const [total, results] = await Promise.all([
    prisma.commissions.count({
      where,
    }),
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
            id: true,
            commission_value: true,
          },
        },
      },
    }),
  ]);
  return { total, results };
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
      payment_at: data.payment_at,
    },
  });
};

export default {
  getCompleteTransactionOfAgentInMonth,
  initSaleBonus,
};
