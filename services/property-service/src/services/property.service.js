import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createProperty = async (propertyData) => {
  return await prisma.properties.create({
    data: propertyData,
  });
};
