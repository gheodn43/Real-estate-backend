import prisma from '../middleware/prismaClient.js';

const createCategoryDetail = async ({
  categoryId,
  fieldName,
  fieldType,
  fieldPlaceholder,
  option,
  isActive,
  isRequire,
}) => {
  const categoryDetail = await prisma.property_category_detail.create({
    data: {
      category_id: categoryId,
      field_name: fieldName,
      field_type: fieldType,
      field_placeholder: fieldPlaceholder,
      option: option,
      is_active: isActive,
      is_require: isRequire,
    },
  });
  return categoryDetail;
};

const getCategoryDetailById = async (id) => {
  const categoryDetail = await prisma.property_category_detail.findUnique({
    where: {
      id: id,
    },
  });
  return categoryDetail;
};

const updateCategoryDetail = async (
  id,
  {
    categoryId,
    fieldName,
    fieldType,
    fieldPlaceholder,
    option,
    isActive,
    isRequire,
  }
) => {
  const categoryDetail = await prisma.property_category_detail.update({
    where: {
      id: id,
    },
    data: {
      category_id: categoryId,
      field_name: fieldName,
      field_type: fieldType,
      field_placeholder: fieldPlaceholder,
      option: option,
      is_active: isActive,
      is_require: isRequire,
    },
  });
  return categoryDetail;
};

const deleteCategoryDetail = async (id) => {
  const categoryDetail = await prisma.property_category_detail.delete({
    where: {
      id: id,
    },
  });
  return categoryDetail;
};
export default {
  createCategoryDetail,
  getCategoryDetailById,
  updateCategoryDetail,
  deleteCategoryDetail,
};
