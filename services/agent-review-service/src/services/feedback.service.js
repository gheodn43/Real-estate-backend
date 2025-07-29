import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class FeedbackService {
  // Tạo mới phản hồi từ khách hàng
  async createFeedback({ first_name, last_name, address, city, email, number_phone, message }) {
    try {
      if (!first_name || !email || !number_phone || !message) {
        throw new Error('Missing required fields');
      }

      const feedback = await prisma.feedbacks.create({
        data: {
          first_name,
          last_name,
          address,
          city,
          email,
          number_phone,
          message,
          status: 'not_responded',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return feedback;
    } catch (err) {
      console.error('Create feedback error:', err.message, err.stack);
      throw new Error('Failed to create feedback: ' + err.message);
    }
  }

  // Lấy danh sách phản hồi cho admin (không bao gồm hidden)
  async getAllFeedback({ page = 1, limit = 10, status }) {
    const skip = (page - 1) * limit;
    const where = {
      status: status ? status : { not: 'hidden' },
    };

    const [feedbacks, total] = await Promise.all([
      prisma.feedbacks.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
      }),
      prisma.feedbacks.count({ where }),
    ]);

    return {
      data: feedbacks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Xem chi tiết một phản hồi
  async getFeedbackById(id) {
    const feedback = await prisma.feedbacks.findUnique({
      where: { id: Number(id) },
    });

    if (!feedback) {
      throw new Error('Feedback not found');
    }
    if (feedback.status === 'hidden') {
      throw new Error('Feedback is hidden');
    }

    return feedback;
  }

  // Trả lời phản hồi
  async replyFeedback(id, { response, response_by }) {
    const feedback = await prisma.feedbacks.findUnique({
      where: { id: Number(id) },
    });

    if (!feedback) {
      throw new Error('Feedback not found');
    }
    if (feedback.status === 'hidden') {
      throw new Error('Cannot reply to hidden feedback');
    }

    return await prisma.feedbacks.update({
      where: { id: Number(id) },
      data: {
        response,
        response_by,
        status: 'responded',
        updated_at: new Date(),
      },
    });
  }

  // Ẩn phản hồi (chuyển status thành hidden)
  async hideFeedback(id) {
    const feedback = await prisma.feedbacks.findUnique({
      where: { id: Number(id) },
    });

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    return await prisma.feedbacks.update({
      where: { id: Number(id) },
      data: { status: 'hidden', updated_at: new Date() },
    });
  }

  // Lấy danh sách phản hồi đã được trả lời (status = responded) cho tất cả role
  async getRespondedFeedback({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const where = { status: 'responded' };

    const [feedbacks, total] = await Promise.all([
      prisma.feedbacks.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
      }),
      prisma.feedbacks.count({ where }),
    ]);

    return {
      data: feedbacks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new FeedbackService();