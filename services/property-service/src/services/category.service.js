import { CategoryType, RequestPostStatus } from '@prisma/client';
import prisma from '../middleware/prismaClient.js';
import slugify from 'slugify';

const createCategory = async ({ type, parentCategoryId, name, isActive }) => {
  const slug = slugify(name, { lower: true, strict: true });
  const existing = await prisma.property_categories.findUnique({
    where: {
      slug,
      deleted_at: null,
    },
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
      where: {
        slug,
        deleted_at: null,
      },
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
      deleted_at: null,
    },
  });
  return category;
};

const getCategoryNeeds = async () => {
  const category = await prisma.property_categories.findMany({
    where: {
      type: CategoryType.needs,
      is_active: true,
    },
  });
  return category;
};

const getCategoryAssetsIncludeCount = async (type) => {
  const category = await prisma.property_categories.findMany({
    where: {
      type,
      is_active: true,
    },
    include: {
      _count: {
        select: {
          asAsset: type === CategoryType.assets && {
            where: {
              requestpost_status: RequestPostStatus.published,
            },
          },
        },
      },
    },
  });

  return category.map((cat) => ({
    id: cat.id,
    type: cat.type,
    parent_category_id: cat.parent_category_id,
    name: cat.name,
    slug: cat.slug,
    is_active: cat.is_active,
    property_count:
      type === CategoryType.assets ? cat._count.asAsset : undefined,
    created_at: cat.created_at,
    updated_at: cat.updated_at,
  }));
};
const softDeleteCategory = async (id) => {
  const category = await prisma.property_categories.update({
    where: { id },
    data: {
      is_active: false,
      deleted_at: new Date(),
    },
  });
  return category;
};

export default {
  createCategory,
  updateCategory,
  getCategoryById,
  getCategoryByType,
  getCategoryNeeds,
  getCategoryAssetsIncludeCount,
  softDeleteCategory,
};
