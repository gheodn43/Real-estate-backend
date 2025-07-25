import prisma from '../middleware/prismaClient.js';
import CommissionStatus from '../enums/commissionStatus.enum.js';

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

export default {
  initCommission,
};
