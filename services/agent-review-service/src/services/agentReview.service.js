import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import axios from 'axios';
import { getCustomerProfile, getAgentFromAuthService, getUserFromAuthService, getPublicCustomerInfor } from '../helpers/authClient.js';
import { RoleName } from '../middleware/roleGuard.js';
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


        axios.post(
          'http://mail-service:4003/mail/auth/notifyAgentNewReview',
          emailPayload
        );

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



    // Create reply
    const reply = await prisma.agent_reviews.create({
      data: {
        agent_id: Number(review.agent_id),
        user_id: Number(user_id),
        comment,
        images: images || [],
        parent_id: Number(review_id),
        type: 'repcomment',
        status: 'showing',
        rating: 0,
      },
    });

    // Role-specific email notification

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
      axios.post(
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
      axios.post(
        'http://mail-service:4003/mail/auth/notifyUserAdminReply',
        emailPayload
      );
    }


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
          { headers: { 'Content-Type': 'application/json' } }
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
          { headers: { 'Content-Type': 'application/json' } }
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
        agent = await getPublicAgentInfor(agent_id);
      } catch (err) {
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

      // Map user info vào reviews và replies
      // --- build set các user_id (reviews + replies) ---
      const userIdsSet = new Set();
      reviews.forEach(r => {
        if (r.user_id != null) userIdsSet.add(Number(r.user_id));
        if (Array.isArray(r.replies)) {
          r.replies.forEach(rep => { if (rep.user_id != null) userIdsSet.add(Number(rep.user_id)); });
        }
      });
      const userIds = Array.from(userIdsSet);

      // --- fetch tất cả users song song, chịu lỗi từng request ---
      const settled = await Promise.allSettled(userIds.map(id => getPublicCustomerInfor(id)));

      const usersById = {};
      userIds.forEach((id, idx) => {
        const res = settled[idx];
        usersById[id] = (res.status === 'fulfilled' && res.value) ? res.value : {};
      });

      // --- map reviews & replies: thay user_id bằng user object ---
      const reviewsWithUser = reviews.map(review => {
        const { user_id, replies, ...restReview } = review;
        const user = usersById[Number(user_id)] || {};

        const repliesWithUser = (Array.isArray(replies) ? replies : []).map(reply => {
          const { user_id: r_uid, ...restReply } = reply;
          const replyUser = usersById[Number(r_uid)] || {};
          return { ...restReply, user: replyUser };
        });
        const firstReplyWithUser = repliesWithUser.length > 0 ? repliesWithUser[0] : null;
        return { ...restReview, user, reply: firstReplyWithUser };
      });



      const result = {
        agent: agent || {},
        reviews: reviewsWithUser,
        rating: avg,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      };

      return result;
    } catch (err) {
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

  async getCommentsAgentNeedingReply(agent_id, page = 1, limit = 10) {
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
      // Lấy tất cả comment chưa có reply của agent này
      const comments = await prisma.agent_reviews.findMany({
        where: {
          agent_id: Number(agent_id),
          type: 'comment',
          status: 'showing',
          // Không tồn tại reply từ chính agent này

        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          replies: true, // Nếu muốn xem có reply khác không
        }
      });

      // Đếm tổng số comment cần trả lời
      const total = await prisma.agent_reviews.count({
        where: {
          agent_id: Number(agent_id),
          type: 'comment',
          status: 'showing',
          replies: {
            none: {
              type: 'repcomment',
              agent_id: Number(agent_id)
            }
          }
        }
      });

      // Map user info vào reviews và replies
      // --- build set các user_id (reviews + replies) ---
      const userIdsSet = new Set();
      comments.forEach(r => {

        if (r.user_id != null) userIdsSet.add(Number(r.user_id));
        if (Array.isArray(r.replies)) {
          r.replies.forEach(rep => { if (rep.user_id != null) userIdsSet.add(Number(rep.user_id)); });
        }
      });
      const userIds = Array.from(userIdsSet);

      // --- fetch tất cả users song song, chịu lỗi từng request ---
      const settled = await Promise.allSettled(userIds.map(id => getPublicCustomerInfor(id)));

      const usersById = {};
      userIds.forEach((id, idx) => {
        const res = settled[idx];
        usersById[id] = (res.status === 'fulfilled' && res.value) ? res.value : {};
      });

      // --- map reviews & replies: thay user_id bằng user object ---
      const reviewsWithUser = comments.map(review => {

        const { user_id, replies, ...restReview } = review;
        const user = usersById[Number(user_id)] || {};

        const repliesWithUser = (Array.isArray(replies) ? replies : []).map(reply => {
          const { user_id: r_uid, ...restReply } = reply;
          const replyUser = usersById[Number(r_uid)] || {};
          return { ...restReply, user: replyUser };
        });
        const firstReplyWithUser = repliesWithUser.length > 0 ? repliesWithUser[0] : null;
        return { ...restReview, user, reply: firstReplyWithUser };
      });


      return {
        comments: reviewsWithUser,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        }
      };
    } catch (err) {
      throw new Error(`Failed to fetch comments needing reply: ${err.message}`);
    }
  }

}



export default new AgentReviewService();