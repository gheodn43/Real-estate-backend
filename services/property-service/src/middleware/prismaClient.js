import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  const now = new Date();
  if (
    (params.action === 'update' || params.action === 'updateMany') &&
    params.model
  ) {
    if (!params.args.data) {
      params.args.data = {};
    }
    params.args.data.updated_at = now;
  }
  return next(params);
});
export default prisma;
