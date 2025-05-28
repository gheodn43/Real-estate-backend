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
export default {
  createCategoryDetail,
};
