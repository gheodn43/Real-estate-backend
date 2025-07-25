import prisma from '../middleware/prismaClient.js';
import Stage from '../enums/stage.enum.js';
import RequestStatus from '../enums/requestStatus.enum.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
import AgentHistoryType from '../enums/agentHistoryType.enum.js';
import agentHistoryService from './propertyAgentHistory.service.js';
import { RoleName } from '../middleware/roleGuard.js';

import slugify from 'slugify';
import axios from 'axios';

const createRequestProperty = async (data) => {
  const slug = slugify(data.title, { lower: true, strict: true });
  const property = await prisma.properties.create({
    data: {
      sender_id: data.senderId,
      title: data.title,
      slug: slug,
      description: data.description,
      before_price_tag: data.beforePriceTag,
      price: data.price,
      after_price_tag: data.afterPriceTag,
      assets_id: data.assetsId,
      needs_id: data.needsId,
      stage: Stage.REQUEST,
      request_status: RequestStatus.PENDING,
    },
  });
  return property;
};

const createPostProperty = async (data) => {
  const slug = slugify(data.title, { lower: true, strict: true });
  const property = await prisma.properties.create({
    data: {
      title: data.title,
      slug: slug,
      description: data.description,
      before_price_tag: data.beforePriceTag,
      price: data.price,
      after_price_tag: data.afterPriceTag,
      assets_id: data.assetsId,
      needs_id: data.needsId,
      stage: Stage.POST,
      requestpost_status: data.requestPostStatus,
    },
  });
  return property;
};
const updatePostProperty = async (id, data) => {
  let property = null;
  if (data.title) {
    const slug = slugify(data.title, { lower: true, strict: true });
    const existing = await prisma.properties.findUnique({
      where: { slug },
    });

    if (existing && existing.id !== id) {
      throw new Error('This name is already taken');
    }
    property = await prisma.properties.update({
      where: {
        id: id,
      },
      data: {
        title: data.title,
        slug: slug,
        description: data.description,
        before_price_tag: data.beforePriceTag,
        price: data.price,
        after_price_tag: data.afterPriceTag,
        assets_id: data.assetsId,
        needs_id: data.needsId,
        requestpost_status: data.requestPostStatus,
        request_status: data.requestStatus,
      },
    });
  } else {
    property = await prisma.properties.update({
      where: {
        id: id,
      },
      data: {
        description: data.description,
        before_price_tag: data.beforePriceTag,
        price: data.price,
        after_price_tag: data.afterPriceTag,
        assets_id: data.assetsId,
        needs_id: data.needsId,
        requestpost_status: data.requestPostStatus,
        request_status: data.requestStatus,
      },
    });
  }

  return property;
};

const updateStatusOfPostProperty = async (
  id,
  requestPostStatus,
  requestStatus
) => {
  const property = await prisma.properties.update({
    where: {
      id: id,
    },
    data: {
      requestpost_status: requestPostStatus,
      request_status: requestStatus,
    },
  });
  return property;
};

const notifyNewPropertySubmission = async (property, location, customer) => {
  await axios.post(
    'http://mail-service:4003/mail/auth/sendConsignmentRequestToCustomer',
    {
      property: property,
      location: location,
      customer: {
        name: customer.userName,
        email: customer.userEmail,
      },
    }
  );
  await axios.post(
    'http://mail-service:4003/mail/auth/sendConsignmentRequestToAdmin',
    {
      property: property,
      location: location,
      customer: {
        name: customer.userName,
        email: customer.userEmail,
      },
    }
  );
};

const assignAgentToRequest = async (property, agents, customerData) => {
  const propertyAgentHistories = await prisma.property_agent_history.createMany(
    {
      data: agents.map((agent) => ({
        property_id: property.id,
        agent_id: agent.id,
        type: AgentHistoryType.ASSIGNED,
      })),
    }
  );
  const customer = customerData.data.user;
  await axios.post(
    'http://mail-service:4003/mail/auth/notifyAgentAssignedToProject',
    {
      property: property,
      agents: agents,
      customer: {
        name: customer.name,
        email: customer.email,
        numberPhone: customer.number_phone,
      },
    }
  );
  return propertyAgentHistories;
};

const getBasicProperty = async (propertyId) => {
  const property = await prisma.properties.findUnique({
    where: {
      id: propertyId,
    },
    include: {
      locations: true,
    },
  });
  return property;
};

// lấy property theo id gồm locations, media[], details[]. amenities[]
const getById = async (propertyId) => {
  const property = await prisma.properties.findUnique({
    where: {
      id: propertyId,
    },
    include: {
      locations: true,
      media: true,
      details: {
        include: {
          category_detail: {
            select: {
              id: true,
              field_name: true,
              field_type: true,
              field_placeholder: true,
              icon: true,
              option: true,
              is_active: true,
              is_require: true,
              is_showing: true,
            },
          },
        },
      },
      amenities: {
        include: {
          amenity: {
            select: {
              id: true,
              name: true,
              is_active: true,
            },
          },
        },
      },
      assets: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      needs: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });
  return property;
};

const getBasicInfoById = async (propertyId) => {
  const property = await prisma.properties.findUnique({
    where: {
      id: propertyId,
    },
    select: {
      id: true,
      request_status: true,
      requestpost_status: true,
    },
  });
  return property;
};

const getRelateProperties = async (currentPropertyId, assetsId, count) => {
  const propertyId = Number(currentPropertyId);
  const properties = await prisma.properties.findMany({
    where: {
      id: {
        not: propertyId,
      },
      assets_id: assetsId,
      requestpost_status: {
        in: [RequestPostStatus.PUBLISHED, RequestPostStatus.SOLD],
      },
    },
    orderBy: { updated_at: 'desc' },
    include: {
      media: {
        where: {
          type: 'image',
        },
        select: {
          id: true,
          type: true,
          url: true,
          order: true,
        },
      },
      locations: true,
      details: {
        select: {
          value: true,
          category_detail: {
            select: {
              field_name: true,
              icon: true,
              is_showing: true,
            },
          },
        },
      },
    },
    take: count,
  });
  return properties;
};

const getBySlug = async (slug) => {
  const property = await prisma.properties.findUnique({
    where: {
      slug: slug,
    },
    include: {
      locations: true,
      media: true,
      details: {
        select: {
          value: true,
          category_detail: {
            select: {
              id: true,
              field_name: true,
              icon: true,
            },
          },
        },
      },
      amenities: {
        include: {
          amenity: {
            select: {
              id: true,
              name: true,
              is_active: true,
            },
          },
        },
      },
      assets: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      needs: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });
  return property;
};

const getDraftProperties = async (userId) => {
  const propertyIds = await agentHistoryService.getHistoryByAgentId(userId);
  const properties = await prisma.properties.findMany({
    where: {
      id: {
        in: propertyIds,
      },
      requestpost_status: RequestPostStatus.DRAFT,
    },
  });
  return properties;
};

const getFilteredProperties = async (filters, pagination) => {
  const { userId, userRole, requestPostStatus, search } = filters;
  const { page, limit } = pagination;
  const where = {};

  if (requestPostStatus) {
    where.requestpost_status = requestPostStatus;
  }
  if (userRole === RoleName.Agent) {
    const propertyIdsOfAgent =
      await agentHistoryService.getHistoryByAgentId(userId);
    if (propertyIdsOfAgent.length === 0) {
      return { properties: [], total: 0 };
    }

    where.id = {
      in: propertyIdsOfAgent,
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }
  const [properties, total] = await Promise.all([
    prisma.properties.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updated_at: 'desc' },
    }),

    prisma.properties.count({ where }),
  ]);

  return { properties, total };
};

const getPublicFilteredProperties = async (filters, pagination) => {
  const { latitude, longitude, radius, assetsId, needsId, search } = filters;

  const { page, limit } = pagination;

  const where = {
    requestpost_status: {
      in: [RequestPostStatus.PUBLISHED, RequestPostStatus.SOLD],
    },
  };

  // Bán kính địa lý ~ tính gần đúng bằng độ
  if (latitude && longitude && radius) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusInDegree = radius / 111.32;

    where.locations = {
      latitude: {
        gte: lat - radiusInDegree,
        lte: lat + radiusInDegree,
      },
      longitude: {
        gte: lng - radiusInDegree,
        lte: lng + radiusInDegree,
      },
    };
  }

  if (assetsId) {
    where.assets_id = Number(assetsId);
  }

  if (needsId) {
    where.needs_id = Number(needsId);
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [properties, total] = await Promise.all([
    prisma.properties.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updated_at: 'desc' },
      include: {
        media: {
          where: {
            type: 'image',
          },
          select: {
            id: true,
            type: true,
            url: true,
            order: true,
          },
        },
        locations: true,
        details: {
          select: {
            value: true,
            category_detail: {
              select: {
                field_name: true,
                icon: true,
                is_showing: true,
              },
            },
          },
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);

  return { properties, total };
};

const getFilteredPropertiesForPrivate = async (filters, pagination) => {
  const { latitude, longitude, radius, assetsId, needsId, search } = filters;

  const { page, limit } = pagination;

  const where = {
    requestpost_status: {
      in: [RequestPostStatus.PUBLISHED, RequestPostStatus.SOLD],
    },
  };

  // Bán kính địa lý ~ tính gần đúng bằng độ
  if (latitude && longitude && radius) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusInDegree = radius / 111.32;

    where.locations = {
      latitude: {
        gte: lat - radiusInDegree,
        lte: lat + radiusInDegree,
      },
      longitude: {
        gte: lng - radiusInDegree,
        lte: lng + radiusInDegree,
      },
    };
  }

  if (assetsId) {
    where.assets_id = Number(assetsId);
  }

  if (needsId) {
    where.needs_id = Number(needsId);
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [properties, total] = await Promise.all([
    prisma.properties.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updated_at: 'desc' },
      include: {
        media: {
          where: {
            type: 'image',
          },
          select: {
            id: true,
            type: true,
            url: true,
            order: true,
          },
        },
        locations: true,
        details: {
          select: {
            value: true,
            category_detail: {
              select: {
                field_name: true,
                icon: true,
                is_showing: true,
              },
            },
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                name: true,
                is_active: true,
              },
            },
          },
        },
        assets: {
          select: {
            id: true,
            name: true,
          },
        },
        needs: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);

  return { properties, total };
};
const getRequestPostByCustomerId = async (customerId, pagination) => {
  const { page, limit } = pagination;
  const where = {
    sender_id: customerId,
  };
  const [requests, total] = await Promise.all([
    prisma.properties.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updated_at: 'desc' },
      include: {
        media: {
          where: {
            type: 'image',
          },
          select: {
            id: true,
            type: true,
            url: true,
            order: true,
          },
        },
        locations: true,
        details: {
          select: {
            value: true,
            category_detail: {
              select: {
                field_name: true,
                icon: true,
                is_showing: true,
              },
            },
          },
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);
  return { requests, total };
};

const getAllRequestPost = async (pagination) => {
  const { page, limit } = pagination;
  const where = {
    request_status: {
      not: null,
    },
  };
  const [requests, total] = await Promise.all([
    prisma.properties.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updated_at: 'desc' },
      include: {
        media: {
          where: {
            type: 'image',
          },
          select: {
            id: true,
            type: true,
            url: true,
            order: true,
          },
        },
        locations: true,
        details: {
          select: {
            value: true,
            category_detail: {
              select: {
                field_name: true,
                icon: true,
                is_showing: true,
              },
            },
          },
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);
  console.log('total', total);
  return { requests, total };
};

const getRequestStatusFromRequestPostStatus = (requestPostStatus) => {
  switch (requestPostStatus) {
    case RequestPostStatus.PUBLISHED:
      return RequestStatus.PUBLISHED;
    case RequestPostStatus.SOLD:
      return RequestStatus.COMPLETED;
    case RequestPostStatus.EXPIRED:
      return RequestStatus.COMPLETED;
    case RequestPostStatus.REJECTED:
      return RequestStatus.PENDING;
    case RequestPostStatus.PENDING_APPROVAL:
      return RequestStatus.PENDING;
    case RequestPostStatus.HIDDEN:
      return RequestStatus.HIDDEN;
    default:
      return RequestStatus.PENDING;
  }
};

export default {
  createRequestProperty,
  createPostProperty,
  assignAgentToRequest,
  notifyNewPropertySubmission,
  getBasicProperty,
  updatePostProperty,
  updateStatusOfPostProperty,
  getById,
  getBasicInfoById,
  getBySlug,
  getDraftProperties,
  getFilteredProperties,
  getPublicFilteredProperties,
  getRequestPostByCustomerId,
  getRelateProperties,
  getFilteredPropertiesForPrivate,
  getRequestStatusFromRequestPostStatus,
  getAllRequestPost,
};
