import prisma from '../middleware/prismaClient.js';

const createAmenity = async ({ name, parentAmenityId, isActive }) => {
  if (parentAmenityId) {
    const parentAmenity = await prisma.amenities.findUnique({
      where: { id: parentAmenityId },
    });
    if (!parentAmenity) {
      throw new Error('Parent amenity not found');
    }
    if (parentAmenity.parent_amentity_id !== null) {
      throw new Error('Cannot create amenity deeper than 2 levels');
    }
  }
  const amenity = await prisma.amenities.create({
    data: {
      name: name,
      parent_amentity_id: parentAmenityId,
      is_active: isActive,
    },
  });
  return amenity;
};
const getAmenityById = async (id) => {
  const amenity = await prisma.amenities.findUnique({
    where: { id: id },
    include: {
      _count: {
        select: {
          children: true,
        },
      },
    },
  });
  return amenity;
};

const getAmenitiesByParentId = async (parentId) => {
  const parentAmenity = await prisma.amenities.findUnique({
    where: { id: parentId },
    include: {
      _count: {
        select: {
          children: true,
        },
      },
    },
  });
  const children = await prisma.amenities.findMany({
    where: {
      parent_amentity_id: parentId,
    },
  });
  return {
    parent: parentAmenity,
    children: children,
  };
};
const getActiveAmenities = async () => {
  const amenities = await prisma.amenities.findMany({
    where: {
      is_active: true,
      parent_amentity_id: null,
    },
    include: {
      children: {
        where: {
          is_active: true,
        },
      },
    },
  });
  return amenities;
};

const updateAmenity = async (id, { name, parentAmenityId, isActive }) => {
  const amenity = await prisma.amenities.update({
    where: {
      id: id,
    },
    data: {
      name: name,
      parent_amentity_id: parentAmenityId,
      is_active: isActive,
    },
  });
  return amenity;
};

const createAmenityProperty = async (dataArray) => {
  const amenityProperties = await prisma.property_amenities.createMany({
    data: dataArray.map((item) => ({
      property_id: item.propertyId,
      amenity_id: item.amenity_id,
    })),
    skipDuplicates: true,
  });
  return amenityProperties;
};
export default {
  createAmenity,
  getAmenityById,
  getAmenitiesByParentId,
  getActiveAmenities,
  updateAmenity,
  createAmenityProperty,
};
