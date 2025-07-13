import prisma from '../middleware/prismaClient.js';
import slugify from 'slugify';

const createCategory = async ({ type, parentCategoryId, name, isActive }) => {
  const slug = slugify(name, { lower: true, strict: true });
  const existing = await prisma.property_categories.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new Error('This name is already taken');
  }

  const category = await prisma.property_categories.create({
    data: {
      type: type,
      parent_category_id: parentCategoryId,
      name: name,
      slug: slug,
      is_active: isActive ?? true,
    },
  });
  return category;
};

const updateCategory = async (id, { parentCategoryId, name, isActive }) => {
  let category = null;
  if (name && name.trim() !== '') {
    const slug = slugify(name, { lower: true, strict: true });
    const existing = await prisma.property_categories.findUnique({
      where: { slug },
    });

    if (existing && existing.id !== id) {
      throw new Error('This name is already taken');
    }

    category = await prisma.property_categories.update({
      where: { id },
      data: {
        parent_category_id: parentCategoryId,
        name: name,
        slug: slug,
        is_active: isActive,
      },
    });
  } else {
    category = await prisma.property_categories.update({
      where: { id },
      data: {
        parent_category_id: parentCategoryId,
        is_active: isActive,
      },
    });
  }

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
