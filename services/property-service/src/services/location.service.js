import prisma from '../middleware/prismaClient.js';

const createLocation = async (data) => {
  return await prisma.property_location.create({
    data: {
      property_id: data.propertyId,
      addr_city: data.addrCity,
      addr_district: data.addrDistrict,
      addr_street: data.addrStreet,
      addr_details: data.addrDetails || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    },
  });
};

export default {
  createLocation,
};
