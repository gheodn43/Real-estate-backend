import prisma from '../middleware/prismaClient.js';

const createCategory = async ({ type, parentCategoryId, name, isActive }) => {
  const category = await prisma.property_categories.create({
    data: {
      type,
      parent_category_id: parentCategoryId,
      name,
      is_active: isActive ?? true,
    },
  });
  return category;
};

const updateCategory = async (id, { parentCategoryId, name, isActive }) => {
  const category = await prisma.property_categories.update({
    where: {
      id,
    },
    data: {
      parent_category_id: parentCategoryId,
      name,
      is_active: isActive,
    },
  });
  return category;
};

const getCategoryById = async (id) => {
  const category = await prisma.property_categories.findUnique({
    where: {
      id,
    },
  });
  return category;
};

const getCategoryByType = async (type) => {
  const category = await prisma.property_categories.findMany({
    where: {
      type,
    },
  });
  return category;
};

const getCategoryActiveByType = async (type) => {
  const category = await prisma.property_categories.findMany({
    where: {
      type,
      is_active: true,
    },
  });
  return category;
};

export default {
  createCategory,
  updateCategory,
  getCategoryById,
  getCategoryByType,
  getCategoryActiveByType,
};
