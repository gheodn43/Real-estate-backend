import prisma from '../middleware/prismaClient.js';
import Stage from '../enums/stage.enum.js';
import RequestStatus from '../enums/requestStatus.enum.js';
import CommissionStatus from '../enums/commissionStatus.enum.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
import AgentHistoryType from '../enums/agentHistoryType.enum.js';
import agentHistoryService from './propertyAgentHistory.service.js';
import {
  getPublicAgentInfor,
  getAdminInfor,
  getUsersFromListIds,
} from '../helpers/authClient.js';
import CustomerRequestStatus from '../enums/CustomerRequestStatus.enum.js';

import slugify from 'slugify';
import axios from 'axios';

const createRequestProperty = async (data) => {
  let property = null;
  if (data.title) {
    const slug = slugify(data.title, { lower: true, strict: true });
    const existing = await prisma.properties.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new Error('This name is already taken');
    }
    property = await prisma.properties.create({
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
  }
  return property;
};
const createPostProperty = async (data) => {
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

const forwardDraft = async (id, requestPostStatus, requestStatus) => {
  const property = await prisma.properties.update({
    where: {
      id: id,
    },
    data: {
      sender_id: null,
      requestpost_status: requestPostStatus,
      request_status: requestStatus,
    },
  });
  return property;
};

const completeTransaction = async (id, requestPostStatus, requestStatus) => {
  const property = await prisma.properties.findUnique({
    where: { id },
    select: { requestpost_status: true }, // chỉ lấy trường cần kiểm tra cho nhẹ
  });
  if (!property) {
    throw new Error('Property not found');
  }
  if (property.requestpost_status !== RequestPostStatus.PUBLISHED) {
    throw new Error("Chỉ có thể cập nhật khi requestpost_status = 'published'");
  }
  const updatedProperty = await prisma.properties.update({
    where: { id },
    data: {
      requestpost_status: requestPostStatus,
      request_status: requestStatus,
    },
  });

  return updatedProperty;
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
      commissions: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: {
          id: true,
          type: true,
          commission: true,
          status: true,
        },
      },
      agentHistory: {
        orderBy: { created_at: 'desc' },
        take: 1,
        where: {
          type: { in: [AgentHistoryType.REQUEST, AgentHistoryType.ASSIGNED] },
        },
        select: { agent_id: true },
      },
    },
  });
  const agent_id =
    property.agentHistory.length > 0 ? property.agentHistory[0].agent_id : null;
  const responseProperty = {
    ...property,
    commission:
      property.commissions.length > 0
        ? {
            id: property.commissions[0].id,
            type: property.commissions[0].type,
            commission: Number(property.commissions[0].commission),
          }
        : null,
    commissions: undefined,
    agentHistory: undefined,
  };
  return {
    responseProperty,
    agent_id,
  };
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
        in: [
          RequestPostStatus.PUBLISHED,
          RequestPostStatus.SOLD,
          RequestPostStatus.EXPIRED,
        ],
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
      agentHistory: {
        orderBy: { created_at: 'desc' },
        take: 1,
        where: {
          type: { in: [AgentHistoryType.REQUEST, AgentHistoryType.ASSIGNED] },
        },
        select: { agent_id: true },
      },
      commissions: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: {
          type: true,
          status: true,
        },
      },
    },
    take: count,
  });

  const propertiesWithCustomerNeeds =
    await getListWithCustomerNeedsAndAgentInfo(properties);
  return propertiesWithCustomerNeeds;
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
      agentHistory: {
        orderBy: { created_at: 'desc' },
        take: 1,
        where: {
          type: { in: [AgentHistoryType.REQUEST, AgentHistoryType.ASSIGNED] },
        },
        select: { agent_id: true },
      },
      commissions: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: {
          type: true,
          status: true,
        },
      },
    },
  });
  let customerNeeds = null;
  let beforePrice = property.before_price_tag;
  let price = property.price;
  let afterPrice = property.after_price_tag;
  let agentInfo = null;
  if (
    (property.requestpost_status == RequestPostStatus.EXPIRED ||
      property.requestpost_status == RequestPostStatus.SOLD) &&
    property.commissions[0].status == CommissionStatus.COMPLETED
  ) {
    beforePrice = 'Giá liên hệ';
    price = 0;
    afterPrice = '';
  }
  if (property?.commissions?.length) {
    customerNeeds = property.commissions[0].type;
  }
  const currentAgentId = property?.agentHistory?.[0]?.agent_id;
  if (currentAgentId) {
    agentInfo = await getPublicAgentInfor(currentAgentId);
  } else {
    agentInfo = await getAdminInfor();
  }
  return {
    ...property,
    customer_needs: customerNeeds,
    before_price_tag: beforePrice,
    price: price,
    after_price_tag: afterPrice,
    commissions: undefined,
    agentHistory: undefined,
    agent: agentInfo,
  };
};

const getDraftProperties = async (userId, pagination, filters) => {
  const { search } = filters;
  const { page, limit } = pagination;
  const where = {
    sender_id: userId,
    requestpost_status: RequestPostStatus.DRAFT,
  };
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
    }),
    prisma.properties.count({ where }),
  ]);
  return { properties, total };
};

const getFilteredProperties = async (filters, pagination) => {
  const { type, search, needsType } = filters;
  const { page, limit } = pagination;
  let where = {
    OR: [
      { requestpost_status: { notIn: [RequestPostStatus.DRAFT] } },
      { requestpost_status: null },
    ],
  };

  if (type) {
    switch (type) {
      case 'rs_rejected':
        where = {
          requestpost_status: null,
          request_status: RequestStatus.REJECTED,
        };
        break;
      case 'not_assigned':
        where = {
          requestpost_status: null,
          agentHistory: {
            none: {
              type: AgentHistoryType.ASSIGNED,
            },
          },
        };
        break;
      case 'assigned':
        where = {
          requestpost_status: null,
          agentHistory: {
            some: {
              type: AgentHistoryType.ASSIGNED,
            },
          },
        };
        break;
      default:
        where = {
          ...where,
          requestpost_status: type,
        };
        break;
    }
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (needsType) {
    where.commissions = {
      some: {
        type: needsType,
      },
    };
  }
  const [properties, total] = await Promise.all([
    prisma.properties.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updated_at: 'desc' },
      include: {
        commissions: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            type: true,
            status: true,
          },
        },
        agentHistory: {
          orderBy: { created_at: 'desc' },
          take: 1,
          where: {
            type: AgentHistoryType.ASSIGNED,
          },
          select: { agent_id: true },
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);
  let propertiesWithAssign = properties.map((p) => {
    let assign = null;
    if (p.stage === Stage.REQUEST) {
      assign = p.agentHistory.length > 0 ? 'assigned' : 'not_assigned';
    }
    // eslint-disable-next-line no-unused-vars
    const { agentHistory, ...rest } = p;
    return {
      ...rest,
      assign,
    };
  });
  if (type === 'not_assigned') {
    propertiesWithAssign = propertiesWithAssign.filter(
      (p) => p.assign === 'not_assigned'
    );
  }
  if (type === 'assigned') {
    propertiesWithAssign = propertiesWithAssign.filter(
      (p) => p.assign === 'assigned'
    );
  }
  const propertiesWithCustomerNeeds =
    await getListWithCustomerNeeds(propertiesWithAssign);

  return { properties: propertiesWithCustomerNeeds, total };
};

const getPublicFilteredProperties = async (filters, pagination) => {
  const { latitude, longitude, radius, assetsId, needsId, search, needsType } =
    filters;

  const { page, limit } = pagination;

  const where = {
    requestpost_status: {
      in: [
        RequestPostStatus.PUBLISHED,
        RequestPostStatus.SOLD,
        RequestPostStatus.EXPIRED,
      ],
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

  if (needsType) {
    where.commissions = {
      some: {
        type: needsType,
      },
    };
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
        agentHistory: {
          orderBy: { created_at: 'desc' },
          take: 1,
          where: {
            type: { in: [AgentHistoryType.REQUEST, AgentHistoryType.ASSIGNED] },
          },
          select: { agent_id: true },
        },
        commissions: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            type: true,
            status: true,
          },
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);

  const propertiesWithCustomerNeeds =
    await getListWithCustomerNeedsAndAgentInfo(properties);
  return { properties: propertiesWithCustomerNeeds, total };
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
const getRequestPostByCustomerId = async (customerId, pagination, filters) => {
  const { page, limit } = pagination;
  const { search, type } = filters;
  let where = {
    sender_id: customerId,
  };
  if (search) {
    where.OR = [{ title: { contains: search } }];
  }
  if (type) {
    where = {
      ...where,
      request_status: type,
    };
  }
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
        commissions: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            type: true,
            status: true,
          },
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);

  const propertiesWithCustomerNeeds = await getListWithCustomerNeeds(requests);
  return { requests: propertiesWithCustomerNeeds, total };
};

const getAllRequestPost = async (pagination, filters) => {
  const { page, limit } = pagination;
  const { search, type } = filters;
  let where = {
    request_status: {
      not: null,
    },
  };
  if (type) {
    switch (type) {
      case 'rs_rejected':
        where = {
          request_status: RequestStatus.REJECTED,
        };
        break;
      case 'not_assigned':
        where = {
          requestpost_status: null,
          agentHistory: {
            none: {
              type: AgentHistoryType.ASSIGNED,
            },
          },
        };
        break;
      case 'assigned':
        where = {
          requestpost_status: null,
          agentHistory: {
            some: {
              type: AgentHistoryType.ASSIGNED,
            },
          },
        };
        break;
      default:
        where = {
          ...where,
          requestpost_status: type,
        };
        break;
    }
  }
  if (search) {
    where.OR = [{ title: { contains: search } }];
  }
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
        commissions: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            type: true,
            status: true,
          },
        },
        agentHistory: {
          orderBy: { created_at: 'desc' },
          take: 1,
          where: {
            type: { in: [AgentHistoryType.ASSIGNED] },
          },
          select: { agent_id: true },
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);
  let propertiesWithAssign = requests.map((p) => {
    let assign = null;
    if (p.stage === Stage.REQUEST) {
      assign = p.agentHistory.length > 0 ? 'assigned' : 'not_assigned';
    }
    // eslint-disable-next-line no-unused-vars
    const { agentHistory, ...rest } = p;
    return {
      ...rest,
      assign,
    };
  });
  if (type === 'not_assigned') {
    propertiesWithAssign = propertiesWithAssign.filter(
      (p) => p.assign === 'not_assigned'
    );
  }
  if (type === 'assigned') {
    propertiesWithAssign = propertiesWithAssign.filter(
      (p) => p.assign === 'assigned'
    );
  }
  const propertiesWithCustomerNeeds =
    await getListWithCustomerNeeds(propertiesWithAssign);
  return { requests: propertiesWithCustomerNeeds, total };
};

const getAllRequestAssign = async (pagination, filters) => {
  const { page, limit } = pagination;
  const { search } = filters;
  let where = {
    agentHistory: { some: {} },
  };
  if (search) {
    where.OR = [{ title: { contains: search } }];
  }
  const [requests] = await Promise.all([
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
        commissions: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            type: true,
            status: true,
          },
        },
        agentHistory: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.properties.count({ where }),
  ]);

  const filtered = requests.filter((p) => {
    if (p.agentHistory.length > 0) {
      return p.agentHistory[0]?.type === AgentHistoryType.REQUEST;
    }
    return false;
  });

  const propertiesWithCustomerNeeds = await getListWithCustomerNeeds(filtered);
  return { requests: propertiesWithCustomerNeeds, total: filtered.length };
};

const getAgentIDRequestAssignTOProperty = async (propertyId, pagination) => {
  const { page, limit } = pagination;
  const propertyIdNum = Number(propertyId);

  // 1️⃣ Lấy assign gần nhất
  const lastAssign = await prisma.property_agent_history.findFirst({
    where: {
      property_id: propertyIdNum,
      type: AgentHistoryType.ASSIGNED,
    },
    orderBy: { created_at: 'desc' },
  });

  // 2️⃣ Điều kiện WHERE cho REQUEST
  const requestWhere = {
    property_id: propertyIdNum,
    type: AgentHistoryType.REQUEST,
    ...(lastAssign
      ? { created_at: { gt: lastAssign.created_at } } // nếu có ASSIGNED
      : {}), // nếu không có ASSIGNED thì bỏ điều kiện này
  };

  const requests = await prisma.property_agent_history.findMany({
    where: requestWhere,
    orderBy: { created_at: 'asc' },
    skip: (page - 1) * limit,
    take: limit,
    select: { agent_id: true },
  });

  return requests.map((r) => r.agent_id);
};

const getAllRequestAssignOfProperty = async (
  propertyId,
  pagination,
  filters,
  token
) => {
  const { search } = filters;
  if (filters) {
    pagination = {
      page: 1,
      limit: 100,
    };
  }
  const agentIds = await getAgentIDRequestAssignTOProperty(
    propertyId,
    pagination
  );
  const agents = await getUsersFromListIds(agentIds, search, token);
  return {
    agents: agents.data,
    total: agents.data.length,
  };
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
      return RequestStatus.NEGOTIATING;
    case RequestPostStatus.PENDING_APPROVAL:
      return RequestStatus.NEGOTIATING;
    case RequestPostStatus.HIDDEN:
      return RequestStatus.HIDDEN;
    default:
      return RequestStatus.PENDING;
  }
};

const getListWithCustomerNeeds = async (list) => {
  const propertiesWithCustomerNeeds = await Promise.all(
    list.map(async (property) => {
      let customerNeeds = null;
      let beforePrice = property.before_price_tag;
      let price = property.price;
      let afterPrice = property.after_price_tag;

      if (
        (property.requestpost_status === RequestPostStatus.EXPIRED ||
          property.requestpost_status === RequestPostStatus.SOLD) &&
        property.commissions[0].status === CommissionStatus.COMPLETED
      ) {
        beforePrice = 'Giá liên hệ';
        price = 0;
        afterPrice = '';
      }
      if (property?.commissions?.length) {
        customerNeeds = property.commissions[0].type;
      }

      return {
        ...property,
        customer_needs: customerNeeds,
        before_price_tag: beforePrice,
        price: price,
        after_price_tag: afterPrice,
        commissions: undefined,
        agentHistory: undefined,
      };
    })
  );
  return propertiesWithCustomerNeeds;
};

const getListWithCustomerNeedsAndAgentInfo = async (list) => {
  const propertiesWithCustomerNeeds = await Promise.all(
    list.map(async (property, index, array) => {
      let customerNeeds = null;
      let beforePrice = property.before_price_tag;
      let price = property.price;
      let afterPrice = property.after_price_tag;
      let agentInfo = null;

      if (
        (property.requestpost_status === RequestPostStatus.EXPIRED ||
          property.requestpost_status === RequestPostStatus.SOLD) &&
        property.commissions[0].status === CommissionStatus.COMPLETED
      ) {
        beforePrice = 'Giá liên hệ';
        price = 0;
        afterPrice = '';
      }
      if (property?.commissions?.length) {
        customerNeeds = property.commissions[0].type;
      }

      const currentAgentId = property?.agentHistory?.[0]?.agent_id;
      if (currentAgentId) {
        if (
          index > 0 &&
          currentAgentId === array[index - 1]?.agentHistory?.[0]?.agent_id
        ) {
          agentInfo = array[index - 1].agentInfo;
        } else {
          agentInfo = await getPublicAgentInfor(currentAgentId); // Sử dụng await
        }
      } else {
        agentInfo = await getAdminInfor();
      }

      return {
        ...property,
        customer_needs: customerNeeds,
        before_price_tag: beforePrice,
        price: price,
        after_price_tag: afterPrice,
        commissions: undefined,
        agentHistory: undefined,
        agent: agentInfo,
      };
    })
  );
  return propertiesWithCustomerNeeds;
};

const initCustomerRequest = async (data) => {
  const request = await prisma.customer_request.create({
    data: {
      customer_id: data.customer_id,
      property_id: data.property_id,
      type: data.type,
      status: data.status,
      reason: data.reason,
    },
  });
  return request;
};

const getCustomerRequests = async (pagination, filters) => {
  const { page, limit } = pagination;
  const { type, status } = filters;
  const where = {};
  if (type) {
    where.type = type;
  }
  if (status) {
    where.status = status;
  }

  const requests = await prisma.customer_request.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { created_at: 'desc' },
  });
  return {
    requests,
    total: await prisma.customer_request.count({ where }),
  };
};

const acceptDeleteRequest = async (request_id) => {
  const request = await prisma.customer_request.update({
    where: { id: request_id },
    data: {
      status: CustomerRequestStatus.COMPLETED,
    },
  });
  return request;
};

const getMyCustomerRequests = async (filters, pagination) => {
  const { page, limit } = pagination;
  const { type, status, customer_id } = filters;
  const where = {};
  if (type) {
    where.type = type;
  }
  if (status) {
    where.status = status;
  }
  if (customer_id) {
    where.customer_id = customer_id;
  }
  const requests = await prisma.customer_request.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { created_at: 'desc' },
  });
  return {
    requests,
    total: await prisma.customer_request.count({ where }),
  };
};
const getRequestPostWaitingAssignByAgentId = async (
  agent_id,
  pagination,
  filters
) => {
  const { page, limit } = pagination;
  const { search, type } = filters;

  const propertyIds =
    await agentHistoryService.getPropertyAssignedForAgent(agent_id);

  let where = {
    request_status: RequestStatus.PENDING,
    id: { notIn: propertyIds },
  };

  if (type) {
    switch (type) {
      case 'request_assign':
        where = {
          ...where,
          agentHistory: {
            some: {
              agent_id: agent_id,
              type: { in: [AgentHistoryType.REQUEST] },
            },
          },
        };
        break;
      case 'waiting_assign':
        where = {
          ...where,
          agentHistory: {
            none: {
              agent_id: agent_id,
            },
          },
        };
        break;
      default:
        break;
    }
  }

  if (search) {
    where.title = { contains: search };
  }

  const requests = await prisma.properties.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { created_at: 'desc' },
    include: {
      agentHistory: true,
    },
  });

  const total = await prisma.properties.count({ where });
  const requestsWithAssign = requests.map((req) => {
    let assign = 'waiting_assign';
    const hasRequestAssign = req.agentHistory.some(
      (h) => h.agent_id === agent_id && h.type === AgentHistoryType.REQUEST
    );

    if (hasRequestAssign) {
      assign = 'request_assign';
    }
    // eslint-disable-next-line no-unused-vars
    const { agentHistory, ...rest } = req;
    return { ...rest, assign };
  });
  return {
    requests: requestsWithAssign,
    total,
  };
};

const getRequestPostAssignedForAgentId = async (
  agent_id,
  pagination,
  filters
) => {
  const { page, limit } = pagination;
  const { search, type } = filters;
  const propertyIds =
    await agentHistoryService.getPropertyAssignedForAgent(agent_id);

  let where = {
    id: { in: propertyIds },
  };
  if (type) {
    switch (type) {
      case 'rs_rejected':
        where = {
          ...where,
          request_status: RequestStatus.REJECTED,
        };
        break;
      default:
        where = {
          ...where,
          sender_id: null,
          requestpost_status: type,
        };
        break;
    }
  }
  if (search) {
    where.title = {
      contains: search,
    };
  }

  const requests = await prisma.properties.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { created_at: 'desc' },
  });
  return {
    requests,
    total: await prisma.properties.count({ where }),
  };
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
  completeTransaction,
  initCustomerRequest,
  getCustomerRequests,
  acceptDeleteRequest,
  getMyCustomerRequests,
  getRequestPostWaitingAssignByAgentId,
  getRequestPostAssignedForAgentId,
  getAllRequestAssign,
  forwardDraft,
  getAllRequestAssignOfProperty,
};
