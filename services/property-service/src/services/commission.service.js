import prisma from '../middleware/prismaClient.js';
import CommissionStatus from '../enums/commissionStatus.enum.js';
import AgentCommissionFeeStatus from '../enums/AgentCommissionFeeStatus.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
import { getPublicAgentInfor } from '../helpers/authClient.js';

// model properties {
//   id                  Int                  @id @default(autoincrement())
//   sender_id           Int?
//   title               String
//   slug                String?               @unique
//   description         String?
//   before_price_tag    String
//   price               Decimal              @db.Decimal(15, 2)
//   after_price_tag     String
//   assets_id           Int
//   needs_id            Int
//   stage               Stage
//   request_status      RequestStatus?
//   requestpost_status  RequestPostStatus?
//   created_at          DateTime             @default(now())
//   updated_at          DateTime             @default(now())

//   assets              property_categories  @relation("AssetCategory", fields: [assets_id], references: [id])
//   needs               property_categories  @relation("NeedCategory", fields: [needs_id], references: [id])

//   locations           property_location?
//   media               property_media[]
//   details             property_detail[]
//   amenities           property_amenities[]
//   agentHistory        property_agent_history[]
//   commissions         commissions[]
// }
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

// enum AgentCommissionFeeStatus{
//   processing
//   confirmed
//   rejected
// }
// enum CommissionStatus {
//   processing
//   completed
//   failed
// }

const initCommission = async ({ property_id, type, commission }) => {
  return await prisma.commissions.create({
    data: {
      property_id,
      status: CommissionStatus.PROCESSING,
      type,
      commission,
    },
  });
};

const updateCommission = async (data) => {
  return await prisma.commissions.update({
    where: {
      id: data.id,
    },
    data: {
      status: data.status,
      type: data.type,
      commission: data.commission,
      latest_price: data.latest_price,
      contract_url: data.contract_url,
    },
  });
};

const createAgentCommissionFee = async (data) => {
  return await prisma.agent_commission_fee.create({
    data: {
      commission_id: data.commission_id,
      agent_id: data.agent_id,
      commission_value: data.commission_value,
      status: data.status,
    },
  });
};

const confirmCommissionFee = async (id) => {
  return await prisma.agent_commission_fee.update({
    where: {
      id,
    },
    data: {
      status: AgentCommissionFeeStatus.CONFIRMED,
    },
  });
};

const rejectCommissionFee = async (id, rejectReason) => {
  return await prisma.agent_commission_fee.update({
    where: {
      id,
    },
    data: {
      status: AgentCommissionFeeStatus.REJECTED,
      reject_reason: rejectReason,
    },
  });
};

const getAllCompleted = async (filters, pagination) => {
  const { search, status } = filters;
  const { page, limit } = pagination;

  const where = {
    commissions: {
      some: {
        status: CommissionStatus.COMPLETED,
      },
    },
    ...(search && {
      title: { contains: search },
    }),
    ...(status && {
      commissions: {
        some: {
          agent_commission_fee: {
            some: {
              status: status,
            },
          },
        },
      },
    }),
  };

  const [properties, total] = await Promise.all([
    prisma.properties.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updated_at: 'desc' },
      include: {
        media: {
          where: { type: 'image' },
          select: { id: true, type: true, url: true, order: true },
        },
        commissions: {
          where: {
            status: CommissionStatus.COMPLETED,
          },
          select: {
            id: true,
            agent_commission_fee: {
              orderBy: { created_at: 'desc' },
              take: 1,
              where: {
                status: {
                  in: [
                    AgentCommissionFeeStatus.REJECTED,
                    AgentCommissionFeeStatus.PROCESSING,
                  ],
                },
              },
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);

  const propertiesWithCommission = properties.map((property) => {
    if (
      property.commissions.length > 0 &&
      property.commissions[0].agent_commission_fee.length > 0
    ) {
      return {
        ...property,
        transaction: {
          transaction_status:
            property.commissions[0].agent_commission_fee[0].status,
          commission_id: property.commissions[0].id,
          commission_fee_id: property.commissions[0].agent_commission_fee[0].id,
        },

        commissions: undefined,
      };
    }
    return property;
  });
  return { properties: propertiesWithCommission, total };
};

const getProcessingOfAgent = async (filters, pagination) => {
  const { agent_id, status, search } = filters;
  const { page, limit } = pagination;

  const where = {
    requestpost_status: RequestPostStatus.PUBLISHED,
    commissions: {
      some: {
        agent_commission_fee: {
          some: {
            agent_id: agent_id,
            ...(status && { status }),
          },
        },
      },
    },
    ...(search && {
      title: { contains: search },
    }),
  };

  const [properties, total] = await Promise.all([
    prisma.properties.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updated_at: 'desc' },
      include: {
        media: {
          where: { type: 'image' },
          select: { id: true, type: true, url: true, order: true },
        },
        commissions: {
          where: {
            status: CommissionStatus.COMPLETED,
          },
          select: {
            id: true,
            agent_commission_fee: {
              orderBy: { created_at: 'desc' },
              take: 1,
              where: {
                agent_id,
                status: {
                  in: [
                    AgentCommissionFeeStatus.REJECTED,
                    AgentCommissionFeeStatus.PROCESSING,
                  ],
                },
              },
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);
  const propertiesWithCommission = properties.map((property) => {
    if (
      property.commissions.length > 0 &&
      property.commissions[0].agent_commission_fee.length > 0
    ) {
      return {
        ...property,
        transaction: {
          transaction_status:
            property.commissions[0].agent_commission_fee[0].status,
          commission_id: property.commissions[0].id,
          commission_fee_id: property.commissions[0].agent_commission_fee[0].id,
        },
        commissions: undefined,
      };
    }
    return property;
  });
  return { properties: propertiesWithCommission, total };
};

const getByPropertyId = async (propertyId) => {
  const property = await prisma.properties.findUnique({
    where: {
      id: propertyId,
    },
    include: {
      locations: true,
      media: true,
      details: {
        select: {
          value: true,
          category_detail: {
            select: {
              id: true,
              field_name: true,
              icon: true,
            },
          },
        },
      },
      amenities: {
        include: {
          amenity: {
            select: {
              id: true,
              name: true,
              is_active: true,
            },
          },
        },
      },
      assets: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      needs: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      commissions: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  });
  if (!property) {
    throw new Error('property not found');
  }
  let customerNeeds = 'Chưa xác định';
  let beforePrice = property.before_price_tag;
  let price = property.price;
  let afterPrice = property.after_price_tag;
  if (property?.commissions?.length) {
    const type = property.commissions[0].type;
    if (
      (property.requestpost_status == RequestPostStatus.EXPIRED ||
        property.requestpost_status == RequestPostStatus.SOLD) &&
      property.commissions[0].status == CommissionStatus.COMPLETED
    ) {
      if (type === 'buying') customerNeeds = 'Đã bán';
      if (type === 'rental') customerNeeds = 'Đã cho thuê';
      beforePrice = 'Giá liên hệ';
      price = null;
      afterPrice = '';
    } else {
      if (type === 'buying') customerNeeds = 'Cần bán';
      if (type === 'rental') customerNeeds = 'Cho thuê';
    }
  }
  return {
    ...property,
    customer_needs: customerNeeds,
    before_price_tag: beforePrice,
    price: price,
    after_price_tag: afterPrice,
  };
};

const getCommissionFeeByCommission = async (commissionId, token) => {
  const commissionFees = await prisma.agent_commission_fee.findMany({
    where: {
      commission_id: commissionId,
      status: {
        in: [
          AgentCommissionFeeStatus.PROCESSING,
          AgentCommissionFeeStatus.CONFIRMED,
        ],
      },
    },
  });
  const agent = await getPublicAgentInfor(commissionFees[0].agent_id, token);
  return {
    commissionFee: commissionFees[0],
    agent: agent,
  };
};
const getDetailCommission = async (commissionId) => {
  const commission = await prisma.commissions.findUnique({
    where: { id: commissionId },
    include: {
      property: true,
      agent_commission_fee: true,
    },
  });

  if (!commission) {
    throw new Error('Commission not found');
  }

  const transactionDetail =
    commission.agent_commission_fee?.length > 0
      ? commission.agent_commission_fee[0]
      : null;

  let agent = null;
  if (transactionDetail?.agent_id) {
    agent = await getPublicAgentInfor(transactionDetail.agent_id);
  }

  // eslint-disable-next-line no-unused-vars
  const { agent_commission_fee, ...restCommission } = commission;

  const commissionWithAgentAndTransaction = {
    ...restCommission,
    transaction_detail: transactionDetail,
    agent,
  };

  return commissionWithAgentAndTransaction;
};

export default {
  initCommission,
  updateCommission,
  createAgentCommissionFee,
  confirmCommissionFee,
  rejectCommissionFee,
  getAllCompleted,
  getProcessingOfAgent,
  getByPropertyId,
  getCommissionFeeByCommission,
  getDetailCommission,
};
