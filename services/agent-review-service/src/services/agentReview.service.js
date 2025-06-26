import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import axios from 'axios';
import { getCustomerProfile, getAgentFromAuthService, getUserFromAuthService } from '../helpers/authClient.js';



class AgentReviewService {
  async createReview({
  token,
  user,
  agent_id,
  rating,
  comment,
  images,
  parent_id,
  type,
}) {
  if (!parent_id && type === 'comment') {
    const existingReview = await prisma.agent_reviews.findFirst({
      where: {
        user_id: Number(user.userId),
        agent_id: Number(agent_id),
        type: 'comment',
        status: { not: 'deleted' },
      },
    });

    if (existingReview) {
      throw new Error('Review already exists for this user and agent. Use PUT to update.');
    }

    const review = await prisma.agent_reviews.create({
      data: {
        agent_id: Number(agent_id),
        user_id: Number(user.userId),
        rating,
        comment,
        images: images || [],
        parent_id,
        type: 'comment',
        status: 'showing',
      },
    });

    const agent = await getCustomerProfile(agent_id, token);
    const agentUser = agent?.data?.user;

    if (agentUser?.email && agentUser?.name && user?.userName) {
      const emailPayload = {
        agentEmail: agentUser.email,
        agentName: agentUser.name,
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          images: review.images,
          created_at: review.created_at,
        },
        reviewer: {
          id: user?.userId,
          name: user?.userName,
          email: user?.userEmail,
        },
      };

      try {
        const response = await axios.post(
          'http://mail-service:4003/mail/auth/notifyAgentNewReview',
          emailPayload,
          { timeout: 20000 }
        );
      } catch (emailErr) {
      }
    }

    return review;
  } else {
    throw new Error('Invalid review type or parent_id for comment');
  }
}

async updateReview({
  review_id,
  user_id,
  rating,
  comment,
  images,
  token,
  user,
}) {
  const review = await prisma.agent_reviews.findUnique({
    where: { id: Number(review_id) },
  });

  if (!review) {
    throw new Error('Review not found');
  }
  if (review.user_id !== Number(user_id)) {
    throw new Error('Unauthorized to update this review');
  }
  if (review.type !== 'comment') {
    throw new Error('Invalid review type');
  }
  if (review.status === 'deleted') {
    throw new Error('Cannot update a deleted review');
  }

  const agent = await getCustomerProfile(review.agent_id, token);
  const agentUser = agent?.data?.user;

  let emailResponse;
  if (agentUser?.email && agentUser?.name && user?.userName) {
    const emailPayload = {
      agentEmail: agentUser.email,
      agentName: agentUser.name,
      review: {
        id: review.id,
        rating: rating,
        comment: comment,
        images: images || [],
        created_at: review.created_at,
      },
      reviewer: {
        id: user_id,
        name: user?.userName,
        email: user?.userEmail,
      },
    };

    try {
      emailResponse = await axios.post(
        'http://mail-service:4003/mail/auth/notifyAgentReviewUpdated',
        emailPayload,
        { timeout: 20000 }
      );
    } catch (emailErr) {
      throw new Error('Failed to send update email notification');
    }
  }

  const updatedReview = await prisma.$transaction(async (prisma) => {
    const reviewUpdate = await prisma.agent_reviews.update({
      where: { id: Number(review_id) },
      data: {
        rating,
        comment,
        images: images || [],
        status: 'showing',
        updated_at: new Date(),
      },
    });
    return reviewUpdate;
  });

  return updatedReview;
}

  async createReply(review_id, agent_id, { comment, images, token }) {
  const review = await prisma.agent_reviews.findUnique({
    where: { id: Number(review_id) },
  });
  if (!review) throw new Error('Review not found');
  if (Number(review.agent_id) !== Number(agent_id)) {
    throw new Error('Agent not authorized to reply this review');
  }
  const reply = await prisma.agent_reviews.create({
    data: {
      agent_id: Number(agent_id),
      user_id: review.user_id,
      comment,
      images,
      parent_id: Number(review_id),
      type: 'repcomment',
      status: 'pending',
      rating: 0
    },
  });

  try {
    const admin = { email: 'kietnguyen23012002@gmail.com', name: 'Admin' };
    const agent = await getAgentFromAuthService(agent_id, token);
    const agentUser = agent?.data?.user;
    
    const emailPayload = {
      adminEmail: admin.email,
      adminName: admin.name,
      reply: {
        id: reply.id,
        comment: reply.comment,
        images: reply.images,
        created_at: reply.created_at
      },
      agent: {
        id: agentUser?.id,
        name: agentUser?.name,
        email: agentUser?.email
      },
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        images: review.images,
        created_at: review.created_at
      }
    };
    const emailResponse = await axios.post(
      'http://mail-service:4003/mail/auth/notifyAdminAgentReply',
      emailPayload,
    );
  } catch (emailErr) {
    
  }

  return reply;
}

  async approveReply(review_id, token) {

  const reply = await prisma.agent_reviews.findUnique({
    where: { id: Number(review_id) },
  });
  if (!reply || reply.type !== 'repcomment')
    throw new Error('Reply not found or invalid');

  const updatedReply = await prisma.agent_reviews.update({
    where: { id: Number(review_id) },
    data: { status: 'showing' },
  });

  const agent = await getAgentFromAuthService(reply.agent_id, token);
  const agentUser = agent?.data?.user;
  if (agentUser?.email) {
    
    const response = await axios.post(
      'http://mail-service:4003/mail/auth/notifyAgentReplyApproved',
      {
        agentEmail: agentUser.email,
        agentName: agentUser.name,
        replyId: updatedReply.id
      }
    );
  } else {
  }

  return updatedReply;
}

async rejectReply(review_id, token) {

  const reply = await prisma.agent_reviews.findUnique({
    where: { id: Number(review_id) },
  });
  if (!reply || reply.type !== 'repcomment')
    throw new Error('Reply not found or invalid');

  const updatedReply = await prisma.agent_reviews.update({
    where: { id: Number(review_id) },
    data: { status: 'rejected' },
  });

  const agent = await getAgentFromAuthService(reply.agent_id, token);
  const agentUser = agent?.data?.user;
  if (agentUser?.email) {
    
    const response = await axios.post(
      'http://mail-service:4003/mail/auth/notifyAgentReplyRejected',
      {
        agentEmail: agentUser.email,
        agentName: agentUser.name,
        replyId: updatedReply.id,
      }
    );
  } else {
  }

  return updatedReply;
}


  async deleteReview(review_id, user_id, user_role) {
    try {
      const review = await prisma.agent_reviews.findUnique({
        where: { id: Number(review_id) },
      });
      if (!review || (Number(review.user_id) !== Number(user_id) && user_role !== 4))
        throw new Error('Review not found or unauthorized');
      return prisma.agent_reviews.update({
        where: { id: Number(review_id) },
        data: { status: 'deleted' },
      });
    } catch (err) {
      throw err;
    }
  }

  async adminReply(review_id, admin_id, { comment, images, token }) {
    const review = await prisma.agent_reviews.findUnique({
      where: { id: Number(review_id) },
    });
    if (!review) throw new Error('Review not found');

    const reply = await prisma.agent_reviews.create({
      data: {
        agent_id: Number(review.agent_id),
        user_id: Number(admin_id),
        comment,
        images: images || [],
        parent_id: Number(review_id),
        type: 'comment',
        status: 'showing',
        rating: 0
      },
    });

    try {
      const user = await getUserFromAuthService(review.user_id, token);
      const admin = await getUserFromAuthService(admin_id, token);
      const userData = user?.data?.user;
      const adminData = admin?.data?.user;

      

      const emailPayload = {
        userEmail: userData?.email,
        userName: userData?.name,
        reply: {
          id: reply.id,
          comment: reply.comment,
          images: reply.images,
          created_at: reply.created_at
        },
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          images: review.images,
          created_at: review.created_at
        },
        admin: {
          id: adminData?.id || admin_id,
          name: adminData?.name,
          email: adminData?.email
        }
      };

      const emailResponse = await axios.post(
        'http://mail-service:4003/mail/auth/notifyUserAdminReply',
        emailPayload,
      );
    } catch (emailErr) {
      
    }

    return reply;
  }

  async getAgentReviews(agent_id, page = 1, pageSize = 10) {
    try {
      return prisma.agent_reviews.findMany({
        where: {
          agent_id: Number(agent_id),
          type: 'comment',
          status: 'showing',
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { replies: { where: { status: 'showing' } } },
      });
    } catch (err) {
      throw err;
    }
  }

  async getAgentReviewSummary(agent_id) {
    try {
      const reviews = await prisma.agent_reviews.findMany({
        where: {
          agent_id: Number(agent_id),
          type: 'comment',
          status: 'showing',
        },
        select: { rating: true },
      });
      const total = reviews.length;
      const avg = total
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;
      return { total, avg };
    } catch (err) {
      throw err;
    }
  }

  async getUserReview(agent_id, user_id) {
    try {
      return prisma.agent_reviews.findMany({
        where: {
          agent_id: Number(agent_id),
          user_id: Number(user_id),
          type: 'comment',
        },
      });
    } catch (err) {
      throw err;
    }
  }
}

export default new AgentReviewService();