import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import axios from 'axios';

// Hàm gọi sang auth-service để lấy thông tin user
async function getUserFromAuthService(user_id) {
  try {
    const res = await axios.get(`http://auth-service:4001/api/users/${user_id}`);
    return res.data;
  } catch (err) {
    return null;
  }
}

// Hàm gọi sang auth-service để lấy thông tin agent
async function getAgentFromAuthService(agent_id) {
  try {
    const res = await axios.get(`http://auth-service:4001/api/agents/${agent_id}`);
    return res.data;
  } catch (err) {
    return null;
  }
}

class AgentReviewService {
  async createOrUpdateReview({
    agent_id,
    user_id,
    rating,
    comment,
    images,
    parent_id,
    type,
  }) {
    try {
      // Kiểm tra agent qua auth-service
      const agent = await getAgentFromAuthService(agent_id);
      if (!agent) throw new Error('Agent not found or invalid role');
      // Kiểm tra user qua auth-service
      const user = await getUserFromAuthService(user_id);
      if (!user) throw new Error('User not found');

      let review;
      if (!parent_id && type === 'comment') {
        const existing = await prisma.agent_reviews.findFirst({
          where: {
            agent_id: Number(agent_id),
            user_id: Number(user_id),
            type: 'comment',
            parent_id: null,
          },
        });
        if (existing) {
          review = await prisma.agent_reviews.update({
            where: { id: existing.id },
            data: {
              rating,
              comment,
              images,
              updated_at: new Date(),
              status: 'pending',
            },
          });
        } else {
          review = await prisma.agent_reviews.create({
            data: {
              agent_id: Number(agent_id),
              user_id: Number(user_id),
              rating,
              comment,
              images,
              parent_id,
              type: 'comment',
              status: 'pending',
            },
          });
        }
      } else {
        throw new Error('Invalid review type or parent_id for comment');
      }

      // Gửi mail thông báo cho agent khi có review mới
      try {
        await axios.post(
          'http://mail-service:4003/mail/auth/notifyAgentNewReview',
          {
            agentEmail: agent.email,
            agentName: agent.name,
            review: {
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              images: review.images,
              created_at: review.created_at
            },
            reviewer: {
              id: user.id,
              name: user.name,
              email: user.email
            }
          },
          { timeout: 5000 }
        );
      } catch (err) {}

      return review;
    } catch (err) {
      throw err;
    }
  }

  async createReply(review_id, agent_id, { comment, images }) {
    try {
      const review = await prisma.agent_reviews.findUnique({
        where: { id: Number(review_id) },
      });
      if (!review || review.agent_id !== Number(agent_id))
        throw new Error('Review or Agent not found');

      const reply = await prisma.agent_reviews.create({
        data: {
          agent_id: Number(agent_id),
          user_id: Number(agent_id), // Agent cũng là user
          comment,
          images,
          parent_id: Number(review_id),
          type: 'repcomment',
          status: 'pending',
        },
      });

      // Gửi mail cho admin khi agent reply
      try {
        // Giả sử bạn lấy thông tin admin từ đâu đó, ví dụ admin mặc định hoặc lấy từ config
        const admin = { email: 'kietnguyen23012002@gmail.com', name: 'Admin' };
        const agent = await getAgentFromAuthService(agent_id);
        await axios.post(
          'http://mail-service:4003/mail/auth/notifyAdminAgentReply',
          {
            adminEmail: admin.email,
            adminName: admin.name,
            reply: {
              id: reply.id,
              comment: reply.comment,
              images: reply.images,
              created_at: reply.created_at
            },
            agent: {
              id: agent.id,
              name: agent.name,
              email: agent.email
            },
            review: {
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              images: review.images,
              created_at: review.created_at
            }
          },
          { timeout: 5000 }
        );
      } catch (err) {}

      return reply;
    } catch (err) {
      throw err;
    }
  }

  async deleteReview(review_id, user_id) {
    try {
      const review = await prisma.agent_reviews.findUnique({
        where: { id: Number(review_id) },
      });
      if (!review || review.user_id !== Number(user_id))
        throw new Error('Review not found or unauthorized');

      return prisma.agent_reviews.update({
        where: { id: Number(review_id) },
        data: { status: 'deleted' },
      });
    } catch (err) {
      throw err;
    }
  }

  async approveReply(review_id) {
    try {
      const reply = await prisma.agent_reviews.findUnique({
        where: { id: Number(review_id) },
      });
      if (!reply || reply.type !== 'repcomment')
        throw new Error('Reply not found or invalid');

      const updatedReply = await prisma.agent_reviews.update({
        where: { id: Number(review_id) },
        data: { status: 'showing' },
      });

      // Gửi mail cho agent khi reply được duyệt
      try {
        const agent = await getAgentFromAuthService(reply.agent_id);
        await axios.post(
          'http://mail-service:4003/mail/auth/notifyAgentReplyApproved',
          {
            agentEmail: agent.email,
            agentName: agent.name
          },
          { timeout: 5000 }
        );
      } catch (err) {}

      return updatedReply;
    } catch (err) {
      throw err;
    }
  }

  async rejectReply(review_id) {
    try {
      const reply = await prisma.agent_reviews.findUnique({
        where: { id: Number(review_id) },
      });
      if (!reply || reply.type !== 'repcomment')
        throw new Error('Reply not found or invalid');

      const updatedReply = await prisma.agent_reviews.update({
        where: { id: Number(review_id) },
        data: { status: 'rejected' },
      });

      // Gửi mail cho agent khi reply bị từ chối
      try {
        const agent = await getAgentFromAuthService(reply.agent_id);
        await axios.post(
          'http://mail-service:4003/mail/auth/notifyAgentReplyRejected',
          {
            agentEmail: agent.email,
            agentName: agent.name
          },
          { timeout: 5000 }
        );
      } catch (err) {}

      return updatedReply;
    } catch (err) {
      throw err;
    }
  }

  async adminReply(review_id, admin_id, { comment, images }) {
    try {
      const review = await prisma.agent_reviews.findUnique({
        where: { id: Number(review_id) },
      });
      if (!review) throw new Error('Review not found');

      const reply = await prisma.agent_reviews.create({
        data: {
          agent_id: review.agent_id,
          user_id: Number(admin_id),
          comment,
          images,
          parent_id: Number(review_id),
          type: 'repcomment',
          status: 'showing',
        },
      });

      // Gửi mail cho user khi admin trả lời review
      try {
        const user = await getUserFromAuthService(review.user_id);
        const admin = await getUserFromAuthService(admin_id);
        await axios.post(
          'http://mail-service:4003/mail/auth/notifyUserAdminReply',
          {
            userEmail: user.email,
            userName: user.name,
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
              id: admin.id,
              name: admin.name,
              email: admin.email
            }
          },
          { timeout: 5000 }
        );
      } catch (err) {}

      return reply;
    } catch (err) {
      throw err;
    }
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
      return prisma.agent_reviews.findFirst({
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