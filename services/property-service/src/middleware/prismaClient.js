import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  const now = new Date();
  const normalizeIds = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      const val = obj[key];

      if (typeof val === 'string' && /id$/i.test(key) && /^\d+$/.test(val)) {
        obj[key] = parseInt(val, 10);
      }

      // xử lý đệ quy nếu là object
      if (typeof val === 'object' && val !== null) {
        normalizeIds(val);
      }
    }
  };

  if (params.args?.where) {
    normalizeIds(params.args.where);
  }

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
