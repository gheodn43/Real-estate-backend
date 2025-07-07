import prisma from '../middleware/prismaClient.js';
import Stage from '../enums/stage.enum.js';
import RequestStatus from '../enums/requestStatus.enum.js';
import RequestPostStatus from '../enums/requestPostStatus.enum.js';
import AgentHistoryType from '../enums/agentHistoryType.enum.js';
import agentHistoryService from './propertyAgentHistory.service.js';
import axios from 'axios';

const createRequestProperty = async (data) => {
  const property = await prisma.properties.create({
    data: {
      sender_id: data.senderId,
      title: data.title,
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
  const property = await prisma.properties.create({
    data: {
      title: data.title,
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
  const property = await prisma.properties.update({
    where: {
      id: id,
    },
    data: {
      title: data.title,
      description: data.description,
      before_price_tag: data.beforePriceTag,
      price: data.price,
      after_price_tag: data.afterPriceTag,
      assets_id: data.assetsId,
      needs_id: data.needsId,
      requestpost_status: data.requestPostStatus,
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

export default {
  createRequestProperty,
  createPostProperty,
  assignAgentToRequest,
  notifyNewPropertySubmission,
  getBasicProperty,
  updatePostProperty,
  getById,
  getDraftProperties,
};
