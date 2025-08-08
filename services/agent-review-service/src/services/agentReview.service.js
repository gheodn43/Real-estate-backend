import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import axios from 'axios';
import { getCustomerProfile, getAgentFromAuthService, getUserFromAuthService } from '../helpers/authClient.js';
import {RoleName} from '../middleware/roleGuard.js';
import { getPublicAgentInfor } from '../helpers/authClient.js';



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

async reply(review_id, user_id, role, { comment, images, token }) {
    const review = await prisma.agent_reviews.findUnique({
      where: { id: Number(review_id) },
    });
    if (!review) throw new Error('Review not found');

    // Role-specific validation
    if (role === RoleName.Agent && Number(review.agent_id) !== Number(user_id)) {
      throw new Error('Agent not authorized to reply to this review');
    }

    // Role-specific status
    const status = role === RoleName.Admin ? 'showing' : 'pending';

    // Create reply
    const reply = await prisma.agent_reviews.create({
      data: {
        agent_id: Number(review.agent_id),
        user_id: Number(user_id),
        comment,
        images: images || [],
        parent_id: Number(review_id),
        type: 'repcomment',
        status,
        rating: 0,
      },
    });

    // Role-specific email notification
    try {
      if (role === RoleName.Agent) {
        const admin = { email: 'kietnguyen23012002@gmail.com', name: 'Admin' };
        const agent = await getAgentFromAuthService(user_id, token);
        const agentUser = agent?.data?.user;

        const emailPayload = {
          adminEmail: admin.email,
          adminName: admin.name,
          reply: {
            id: reply.id,
            comment: reply.comment,
            images: reply.images,
            created_at: reply.created_at,
          },
          agent: {
            id: agentUser?.id,
            name: agentUser?.name,
            email: agentUser?.email,
          },
          review: {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            images: review.images,
            created_at: review.created_at,
          },
        };
        await axios.post(
          'http://mail-service:4003/mail/auth/notifyAdminAgentReply',
          emailPayload
        );
      } else if (role === RoleName.Admin) {
        const user = await getUserFromAuthService(review.user_id, token);
        const admin = await getUserFromAuthService(user_id, token);
        const userData = user?.data?.user;
        const adminData = admin?.data?.user;

        const emailPayload = {
          userEmail: userData?.email,
          userName: userData?.name,
          reply: {
            id: reply.id,
            comment: reply.comment,
            images: reply.images,
            created_at: reply.created_at,
          },
          review: {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            images: review.images,
            created_at: review.created_at,
          },
          admin: {
            id: adminData?.id || user_id,
            name: adminData?.name,
            email: adminData?.email,
          },
        };
        await axios.post(
          'http://mail-service:4003/mail/auth/notifyUserAdminReply',
          emailPayload
        );
      }
    } catch (emailErr) {}

    return reply;
  }

async approveReply(review_id, token) {
  const reply = await prisma.agent_reviews.findUnique({
    where: { id: Number(review_id) },
  });
  if (!reply || reply.type !== 'repcomment') {
    throw new Error('Reply not found or invalid');
  }

  const updatedReply = await prisma.agent_reviews.update({
    where: { id: Number(review_id) },
    data: { status: 'showing' },
  });

  const agent = await getAgentFromAuthService(reply.agent_id, token);
  const agentUser = agent?.data?.user;
  const review = await prisma.agent_reviews.findUnique({ where: { id: reply.parent_id } });

  if (agentUser?.email) {
    try {
      const emailPayload = {
        agentEmail: agentUser.email,
        agentName: agentUser.name || 'Unknown Agent',
        reply: {
          id: updatedReply.id,
          comment: updatedReply.comment || '',
          images: updatedReply.images || [],
          created_at: updatedReply.created_at ? updatedReply.created_at.toISOString() : '',
          status: updatedReply.status || 'showing'
        },
        review: review ? {
          id: review.id,
          rating: review.rating || '',
          comment: review.comment || '',
          images: review.images || [],
          created_at: review.created_at ? review.created_at.toISOString() : ''
        } : {
          id: '',
          rating: '',
          comment: 'Không tìm thấy đánh giá gốc',
          images: [],
          created_at: ''
        }
      };

      await axios.post(
        'http://mail-service:4003/mail/auth/notifyAgentReplyApproved',
        emailPayload,
        { headers: { 'Content-Type': 'application/json' }}
      );
    } catch (emailErr) {
      
    }
  } else {
    
  }

  return updatedReply;
}

  async rejectReply(review_id, token) {
    const reply = await prisma.agent_reviews.findUnique({
      where: { id: Number(review_id) },
    });
    if (!reply || reply.type !== 'repcomment') {
      throw new Error('Reply not found or invalid');
    }
  
    const updatedReply = await prisma.agent_reviews.update({
      where: { id: Number(review_id) },
      data: { status: 'rejected' },
    });
  
    const agent = await getAgentFromAuthService(reply.agent_id, token);
    const agentUser = agent?.data?.user;
    const review = await prisma.agent_reviews.findUnique({ where: { id: reply.parent_id } });
  
    if (agentUser?.email) {
      try {
        const emailPayload = {
          agentEmail: agentUser.email,
          agentName: agentUser.name || 'Unknown Agent',
          reply: {
            id: updatedReply.id,
            comment: updatedReply.comment || '',
            images: updatedReply.images || [],
            created_at: updatedReply.created_at ? updatedReply.created_at.toISOString() : '',
            status: updatedReply.status || 'rejected'
          },
          review: review ? {
            id: review.id,
            rating: review.rating || '',
            comment: review.comment || '',
            images: review.images || [],
            created_at: review.created_at ? review.created_at.toISOString() : ''
          } : {
            id: '',
            rating: '',
            comment: 'Không tìm thấy đánh giá gốc',
            images: [],
            created_at: ''
          }
        };
    
        await axios.post(
          'http://mail-service:4003/mail/auth/notifyAgentReplyRejected',
          emailPayload,
          { headers: { 'Content-Type': 'application/json' }}
        );

      } catch (emailErr) {
        
      }
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


  async getAgentReviewsAndSummary(agent_id, page = 1, limit = 10) {
  if (!Number.isInteger(Number(agent_id)) || agent_id <= 0) {
    throw new Error('Invalid agent_id: Must be a positive integer');
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Invalid page number: Must be a positive integer');
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('Invalid limit: Must be a positive integer');
  }

  try {
    let agent = null;
    try {
      console.log('Calling getPublicAgentInfor with agent_id:', agent_id);
      agent = await getPublicAgentInfor(agent_id);
      console.log('Agent:', agent);
    } catch (err) {
      console.error('Error in getPublicAgentInfor:', err.message, err.response?.status);
      // Tiếp tục với agent = null
    }

    const reviews = await prisma.agent_reviews.findMany({
      where: {
        agent_id: Number(agent_id),
        type: 'comment',
        status: 'showing',
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { replies: { where: { status: 'showing' } } },
    });

    const summaryReviews = await prisma.agent_reviews.findMany({
      where: {
        agent_id: Number(agent_id),
        type: 'comment',
        status: 'showing',
      },
      select: { rating: true },
    });

    const total = summaryReviews.length;
    const avg = total
      ? summaryReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / total
      : 0;

    const result = {
      agent: agent || {},
      reviews,
      rating: avg ,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };

    console.log('Result of getAgentReviewsAndSummary:', result);
    return result;
  } catch (err) {
    console.error('Error in getAgentReviewsAndSummary:', err.message, err.stack);
    throw new Error(`Failed to fetch reviews: ${err.message}`);
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

  async getPendingReplies(page = 1, limit = 10) {
  try {
    return await prisma.agent_reviews.findMany({
      where: {
        type: 'repcomment',
        status: 'pending',
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        parent: { select: { id: true, comment: true, rating: true, user_id: true } },
      },
    });
  } catch (err) {
    throw new Error('Failed to get pending replies: ' + err.message);
  }
}

async getMyReplies(agent_id, status = null, page = 1, limit = 10) {
  try {
    const where = {
      agent_id: Number(agent_id),
      type: 'repcomment',
    };
    if (status) {
      where.status = status;
    }
    return await prisma.agent_reviews.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        parent: { select: { id: true, comment: true, rating: true, user_id: true } },
      },
    });
  } catch (err) {
    throw new Error('Failed to get agent replies: ' + err.message);
  }
}
}



export default new AgentReviewService();