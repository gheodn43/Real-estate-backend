import prisma from '../middleware/prismaClient.js';
import RequestStatus from '../enums/requestStatus.enum.js';

const createRequestProperty = async (data) => {
  const property = await prisma.properties.create({
    data: {
      sender_id: data.senderId,
      title: data.title,
      description: data.description,
      before_price_tag: data.beforePriceTag,
      price: data.price,
      after_price_tag: data.afterPriceTag,
      assets_id: data.assetsId,
      needs_id: data.needsId,
      stage: data.stage,
      request_status: RequestStatus.PENDING,
    },
  });
  return property;
};

export default {
  createRequestProperty,
};
