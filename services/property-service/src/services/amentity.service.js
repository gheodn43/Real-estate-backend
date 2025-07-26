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
const createMultipleAmenities = async (amenities) => {
  const createdAmenities = [];
  for (const amenity of amenities) {
    const createdAmenity = await createAmenity(amenity);
    createdAmenities.push(createdAmenity);
  }
  return createdAmenities;
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

const getAmenitiesByParentId = async (parentId, pagination, filters) => {
  const { page, limit } = pagination;
  const { search, status } = filters;
  const skip = (page - 1) * limit;
  let where = {
    deleted_at: null,
    parent_amentity_id: parentId,
  };
  if (search) {
    where.name = {
      contains: search,
    };
  }
  if (status.length > 0) {
    where.is_active = status[0];
  }
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
    where,
    skip,
    take: limit,
    orderBy: { updated_at: 'desc' },
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

const deleteByPropertyId = async (propertyId) => {
  const amenityProperties = await prisma.property_amenities.deleteMany({
    where: {
      property_id: propertyId,
    },
  });
  return amenityProperties;
};

const softDeleteAmenity = async (id) => {
  const amenity = await prisma.amenities.update({
    where: {
      id: id,
    },
    data: {
      deleted_at: new Date(),
      is_active: false,
    },
  });
  return amenity;
};

const getAllAmenities = async (filters, pagination) => {
  const { search, status } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  let where = {
    deleted_at: null,
  };
  let include = {
    _count: {
      select: {
        children: true,
      },
    },
    parent: true,
  };
  if (!search) {
    where.parent_amentity_id = null;
  }
  if (status.length > 0) {
    where.is_active = status[0];
  }
  if (search) {
    where.name = { contains: search };
  }

  const [amenities, total] = await Promise.all([
    prisma.amenities.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: { updated_at: 'desc' },
    }),
    prisma.amenities.count({ where }),
  ]);
  return {
    amenities,
    total,
  };
};
export default {
  createAmenity,
  getAmenityById,
  getAmenitiesByParentId,
  getActiveAmenities,
  updateAmenity,
  createAmenityProperty,
  createMultipleAmenities,
  deleteByPropertyId,
  softDeleteAmenity,
  getAllAmenities,
};
