const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

// Thêm log để debug Prisma Client
console.log('Prisma initialized:', !!prisma);
console.log('Prisma users model:', !!prisma.users);
console.log('Prisma user_roles model:', !!prisma.user_roles);
console.log('Prisma agent_reviews model:', !!prisma.agent_reviews);

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
    console.log('Checking agent_id:', agent_id, 'user_id:', user_id);
    try {
      // Kiểm tra agent_id tồn tại trong users và có vai trò 'agent'
      const agent = await prisma.users.findUnique({
        where: { id: Number(agent_id) },
        include: { role: true },
      });
      console.log('Agent found:', agent);
      if (!agent || agent.role.rolename !== 'Agent')
        throw new Error('Agent not found or invalid role');

      // Kiểm tra user_id tồn tại
      const user = await prisma.users.findUnique({
        where: { id: Number(user_id) },
      });
      console.log('User found:', user);
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

      // Gửi mail thông báo cho agent
      try {
        await axios.post(
          'http://mail-service:4003/mail/auth/agent-review/notify',
          {
            agent_id,
            user_id,
            review_id: review.id,
            rating,
            comment,
          },
          {
            timeout: 5000, // Thêm timeout
          }
        );
        console.log('Mail sent successfully to agent:', agent.email);
      } catch (err) {
        console.error('Failed to send mail:', err.message, err.response?.data);
        // Không throw lỗi để không làm gián đoạn flow chính
      }

      return review;
    } catch (err) {
      console.error('Error in createOrUpdateReview:', err.message, err.stack);
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

      // Gửi mail cho admin
      try {
        await axios.post(
          'http://mail-service:4003/mail/auth/agent-review/admin-notify',
          {
            review_id,
            reply_id: reply.id,
            agent_id,
            comment,
          },
          {
            timeout: 5000,
          }
        );
        console.log('Mail sent successfully to admin');
      } catch (err) {
        console.error('Failed to send mail:', err.message, err.response?.data);
      }

      return reply;
    } catch (err) {
      console.error('Error in createReply:', err.message, err.stack);
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
      console.error('Error in deleteReview:', err.message, err.stack);
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

      // Gửi mail cho agent
      try {
        await axios.post(
          'http://mail-service:4003/mail/auth/agent-review/approved',
          {
            review_id,
            reply_id: updatedReply.id,
            agent_id: updatedReply.agent_id,
          },
          {
            timeout: 5000,
          }
        );
        console.log('Mail sent successfully to agent:', updatedReply.agent_id);
      } catch (err) {
        console.error('Failed to send mail:', err.message, err.response?.data);
      }

      return updatedReply;
    } catch (err) {
      console.error('Error in approveReply:', err.message, err.stack);
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

      // Gửi mail cho agent
      try {
        await axios.post(
          'http://mail-service:4003/mail/auth/agent-review/rejected',
          {
            review_id,
            reply_id: updatedReply.id,
            agent_id: updatedReply.agent_id,
          },
          {
            timeout: 5000,
          }
        );
        console.log('Mail sent successfully to agent:', updatedReply.agent_id);
      } catch (err) {
        console.error('Failed to send mail:', err.message, err.response?.data);
      }

      return updatedReply;
    } catch (err) {
      console.error('Error in rejectReply:', err.message, err.stack);
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

      // Gửi mail cho user
      try {
        await axios.post(
          'http://mail-service:4003/mail/auth/agent-review/user-notify',
          {
            review_id,
            reply_id: reply.id,
            user_id: review.user_id,
          },
          {
            timeout: 5000,
          }
        );
        console.log('Mail sent successfully to user:', review.user_id);
      } catch (err) {
        console.error('Failed to send mail:', err.message, err.response?.data);
      }

      return reply;
    } catch (err) {
      console.error('Error in adminReply:', err.message, err.stack);
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
      console.error('Error in getAgentReviews:', err.message, err.stack);
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
      console.error('Error in getAgentReviewSummary:', err.message, err.stack);
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
      console.error('Error in getUserReview:', err.message, err.stack);
      throw err;
    }
  }
}

module.exports = new AgentReviewService();
