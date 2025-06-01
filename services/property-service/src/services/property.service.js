import prisma from '../middleware/prismaClient.js';
import RequestStatus from '../enums/requestStatus.enum.js';
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
      stage: data.stage,
      request_status: RequestStatus.PENDING,
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

const assignAgentToRequest = async (
  property,
  location,
  agents,
  customerData
) => {
  // const propertyAgentHistories = await prisma.property_agent_history.createMany(
  //   {
  //     data: agents.map((agent) => ({
  //       property_id: property.id,
  //       agent_id: agent.id,
  //     })),
  //   }
  // );
  const customer = customerData.data.user;
  // await axios.post('http://mail-service:4003/mail/auth/sendConsignmentRequestToAgents', {
  //   property: property,
  //   location: location,
  //   agents: agents,
  //   customer: {
  //     name: customer.name,
  //     email: customer.email,
  //     numberPhone: customer.number_phone,
  //   },
  // });

  console.log({
    property: property,
    location: location,
    agents: agents,
    customer: {
      name: customer.name,
      email: customer.email,
      numberPhone: customer.number_phone,
    },
  });
  // return propertyAgentHistories;
};

export default {
  createRequestProperty,
  assignAgentToRequest,
  notifyNewPropertySubmission,
};
