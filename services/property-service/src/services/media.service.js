import prisma from '../middleware/prismaClient.js';

const createMedia = async (dataArray) => {
  return await prisma.property_media.createMany({
    data: dataArray.map((item) => ({
      name: item.name || null,
      property_id: item.propertyId,
      type: item.type,
      url: item.url,
      order: item.order || 99,
    })),
    skipDuplicates: true,
  });
};

const deleteByPropertyId = async (propertyId) => {
  return await prisma.property_media.deleteMany({
    where: {
      property_id: propertyId,
    },
  });
};

export default {
  createMedia,
  deleteByPropertyId,
};
