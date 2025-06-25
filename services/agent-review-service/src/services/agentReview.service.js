import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import axios from 'axios';
import { getCustomerProfile, getAgentFromAuthService, getUserFromAuthService } from '../helpers/authClient.js';



class AgentReviewService {
  async createOrUpdateReview({
    token,
    user,
    agent_id,
    rating,
    comment,
    images,
    parent_id,
    type,
  }) {
    
      
      const agent = await getCustomerProfile(agent_id, token);
      const agentUser = agent?.data?.user;

      console.log('Agent info:', {
        agentEmail: agentUser?.email,
        agentName: agentUser?.name,
      });
      console.log('User info:', user);

      if (!agentUser?.email || !agentUser?.name || !user?.name) {
        console.log('Missing required data for email notification:', {
          agentEmail: agentUser?.email,
          agentName: agentUser?.name,
          userName: user?.name,
        });
      }
      
    
      let review;
      if (!parent_id && type === 'comment') {
       review = await prisma.agent_reviews.create({
            data: {
              agent_id: agent_id,
              user_id: user.userId,
              rating,
              comment,
              images,
              parent_id,
              type: 'comment',
              status: 'showing',
       }})
      } else {
        throw new Error('Invalid review type or parent_id for comment');
      }
      
      if (agentUser?.email && agentUser?.name && user?.userName) {
        const response = await axios.post(
          'http://mail-service:4003/mail/auth/notifyAgentNewReview',
          {
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
              id: user?.id,
              name: user?.userName,
              email: user?.userEmail,
            },
          },
      
        );
        console.log('Email notification response:', response.data);
      } else {
        console.log('Skipping email notification due to missing data');
      }
    
      return review;
    }

  async createReply(review_id, agent_id, { comment, images, token }) {
  const review = await prisma.agent_reviews.findUnique({
    where: { id: Number(review_id) },
  });
  if (!review) throw new Error('Review not found');
  console.log('DEBUG: review.agent_id =', review.agent_id, '| agent_id =', agent_id, '| typeof review.agent_id =', typeof review.agent_id, '| typeof agent_id =', typeof agent_id);
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
    console.log('DEBUG: Calling getAgentFromAuthService with agent_id =', agent_id, 'and token =', token);
    const agent = await getAgentFromAuthService(agent_id, token);
    const agentUser = agent?.data?.user;
    if (!agentUser?.email || !agentUser?.name) {
      console.warn('WARNING: Agent user data incomplete:', agentUser);
    }
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
    console.log('DEBUG: Sending email to admin with payload:', emailPayload);
    const emailResponse = await axios.post(
      'http://mail-service:4003/mail/auth/notifyAdminAgentReply',
      emailPayload,
      { timeout: 5000 }
    );
    console.log('DEBUG: Email sent successfully to admin, response:', emailResponse.status, emailResponse.data);
  } catch (emailErr) {
    console.error('ERROR: Failed to send email:', {
      message: emailErr.message,
      response: emailErr.response?.data,
      status: emailErr.response?.status
    });
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
    console.log('DEBUG: Sending approval mail with payload:', {
      agentEmail: agentUser.email,
      agentName: agentUser.name,
      replyId: updatedReply.id,
      timestamp: new Date().toISOString()
    });
    const response = await axios.post(
      'http://mail-service:4003/mail/auth/notifyAgentReplyApproved',
      {
        agentEmail: agentUser.email,
        agentName: agentUser.name,
        replyId: updatedReply.id
      }
    );
    console.log('INFO: Approval mail sent successfully for replyId:', updatedReply.id, 'Response:', response.data);
  } else {
    console.log('INFO: No email found for agent:', reply.agent_id);
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
    console.log('DEBUG: Sending rejection mail with payload:', {
      agentEmail: agentUser.email,
      agentName: agentUser.name,
      replyId: updatedReply.id,
      timestamp: new Date().toISOString()
    });
    const response = await axios.post(
      'http://mail-service:4003/mail/auth/notifyAgentReplyRejected',
      {
        agentEmail: agentUser.email,
        agentName: agentUser.name,
        replyId: updatedReply.id,
      }
    );
    console.log('INFO: Rejection mail sent successfully for replyId:', updatedReply.id, 'Response:', response.data);
  } else {
    console.log('INFO: No email found for agent:', reply.agent_id);
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
      console.log('DEBUG: Fetching user with user_id:', review.user_id, 'and admin with admin_id:', admin_id);
      const user = await getUserFromAuthService(review.user_id, token);
      const admin = await getUserFromAuthService(admin_id, token);
      const userData = user?.data?.user;
      const adminData = admin?.data?.user;

      if (!userData?.email || !adminData?.name) {
        console.warn('WARNING: User or admin data incomplete:', {
          userEmail: userData?.email,
          adminName: adminData?.name
        });
      }

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

      console.log('DEBUG: Sending email to user with payload:', emailPayload);
      const emailResponse = await axios.post(
        'http://mail-service:4003/mail/auth/notifyUserAdminReply',
        emailPayload,
      );
      console.log('DEBUG: Email sent successfully to user, response:', emailResponse.status, emailResponse.data);
    } catch (emailErr) {
      console.error('ERROR: Failed to send email:', {
        message: emailErr.message,
        response: emailErr.response?.data,
        status: emailErr.response?.status
      });
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