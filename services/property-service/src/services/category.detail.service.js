import prisma from '../middleware/prismaClient.js';

const createDetail = async (data) => {
  const existing = await prisma.property_category_detail.findFirst({
    where: {
      field_name: data.fieldName,
      category_id: data.categoryId,
      deleted_at: null,
    },
  });

  if (existing) {
    throw new Error('Field name already exists in this category');
  }
  const categoryDetail = await prisma.property_category_detail.create({
    data: {
      category_id: data.categoryId,
      field_name: data.fieldName,
      field_type: data.fieldType,
      field_placeholder: data.fieldPlaceholder,
      icon: data.icon,
      option: data.option,
      unit: data.unit,
      is_active: data.isActive,
      is_require: data.isRequire,
      is_showing: data.isShowing,
    },
  });

  return categoryDetail;
};

const getDetailById = async (id) => {
  const categoryDetail = await prisma.property_category_detail.findUnique({
    where: {
      id: id,
    },
  });
  return categoryDetail;
};

const getDetailByCategoryId = async (categoryId) => {
  const category = await prisma.property_categories.findUnique({
    where: { id: categoryId },
    include: {
      details: {
        where: { deleted_at: null },
      },
    },
  });
  if (!category) return null;
  const { details, ...categoryInfo } = category;
  return {
    category: categoryInfo,
    details,
  };
};

const updateDetail = async (id, data) => {
  const currentDetail = await prisma.property_category_detail.findUnique({
    where: { id: Number(id) },
  });
  if (!currentDetail || currentDetail.deleted_at !== null) {
    throw new Error('Detail not found or has been deleted');
  }
  const duplicate = await prisma.property_category_detail.findFirst({
    where: {
      id: { not: Number(id) },
      category_id: data.categoryId,
      field_name: data.fieldName,
      deleted_at: null,
    },
  });

  if (duplicate) {
    throw new Error('Field name already exists in this category');
  }
  const categoryDetail = await prisma.property_category_detail.update({
    where: { id: Number(id) },
    data: {
      category_id: data.categoryId,
      field_name: data.fieldName,
      field_type: data.fieldType,
      field_placeholder: data.fieldPlaceholder,
      icon: data.icon,
      option: data.option,
      unit: data.unit,
      is_active: data.isActive,
      is_require: data.isRequire,
      is_showing: data.isShowing,
    },
  });
  return categoryDetail;
};

const softDeleteDetail = async (id) => {
  const categoryDetail = await prisma.property_category_detail.update({
    where: {
      id: id,
    },
    data: {
      deleted_at: new Date(),
      is_active: false,
    },
  });
  return categoryDetail;
};

const getActiveDetailByCategoryId = async (categoryId) => {
  const categoryDetail = await prisma.property_category_detail.findMany({
    where: {
      category_id: categoryId,
      is_active: true,
    },
  });
  return categoryDetail;
};

const createProperyDetail = async (dataArray) => {
  const propertyDetail = await prisma.property_detail.createMany({
    data: dataArray.map((item) => ({
      property_id: item.propertyId,
      category_detail_id: item.categoryDetailId,
      value: item.value,
    })),
    skipDuplicates: true,
  });
  return propertyDetail;
};
const deleteByPropertyId = async (propertyId) => {
  const propertyDetail = await prisma.property_detail.deleteMany({
    where: {
      property_id: propertyId,
    },
  });
  return propertyDetail;
};

export default {
  createDetail,
  getDetailById,
  updateDetail,
  softDeleteDetail,
  getDetailByCategoryId,
  getActiveDetailByCategoryId,
  createProperyDetail,
  deleteByPropertyId,
};
