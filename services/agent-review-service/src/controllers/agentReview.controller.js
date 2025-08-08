import agentReviewService from '../services/agentReview.service.js';

class AgentReviewController {
  constructor() {
    this.createReview = this.createReview.bind(this);
    this.updateReview = this.updateReview.bind(this);
    this.reply = this.reply.bind(this);
    this.deleteReview = this.deleteReview.bind(this);
    this.approveReply = this.approveReply.bind(this);
    this.rejectReply = this.rejectReply.bind(this);
    this.getAgentReviews = this.getAgentReviews.bind(this);
    this.getAgentReviewSummary = this.getAgentReviewSummary.bind(this);
    this.getUserReview = this.getUserReview.bind(this);
    this.getPendingReplies = this.getPendingReplies.bind(this);
    this.getMyReplies = this.getMyReplies.bind(this);
    this.handleReviewAction = this.handleReviewAction.bind(this);
  }

async createReview(req, res) {
  try {
    const token = req.token;
    const { agent_id, rating, comment, images, parent_id, type } = req.body;
    const user = req.user;
    const review = await agentReviewService.createReview({
      token,
      user,
      agent_id: Number(agent_id),
      rating,
      comment,
      images,
      parent_id,
      type,
    });
    res.status(201).json({
      data: { review },
      message: 'Create review successfully',
      errors: [],
    });
  } catch (err) {
    return res.status(403).json({
      data: null,
      message: 'Create review failed',
      errors: [err.message],
    });
  }
}

async updateReview(req, res) {
  try {
    const token = req.token;
    const review_id = Number(req.params.id);
    const user_id = Number(req.user.userId);
    const { rating, comment, images } = req.body;
    const user = req.user;
    const review = await agentReviewService.updateReview({
      review_id,
      user_id,
      rating,
      comment,
      images,
      user,
      token,
    });
    res.status(200).json({
      data: { review },
      message: 'Update review successfully',
      errors: [],
    });
  } catch (err) {
    return res.status(403).json({
      data: null,
      message: 'Update review failed',
      errors: [err.message],
    });
  }
}

  async reply(req, res) {
  try {
    if (!req.body || !req.body.comment) {
      return res.status(400).json({
        data: { reply: null },
        message: 'Request body is missing or comment is required',
        errors: ['Comment is required in the request body'],
      });
    }

    const token = req.token;
    const review_id = Number(req.params.id);
    const user_id = Number(req.user.userId);
    const role = req.user.userRole === 4 ? 'ADMIN' : 'AGENT';
    const { comment, images } = req.body;

    const reply = await agentReviewService.reply(review_id, user_id, role, {
      comment,
      images,
      token,
    });

    res.status(201).json({
      data: { reply },
      message: `${role === 'ADMIN' ? 'Admin' : 'Agent'} reply successfully`,
      errors: [],
    });
  } catch (err) {
    return res.status(403).json({
      data: { reply: null },
      message: `${req.user.userRole === 4 ? 'Admin' : 'Agent'} reply failed`,
      errors: [err.message],
    });
  }
}

  async handleReviewAction(req, res) {
    try {
      const { id } = req.params;
      const { action } = req.query;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          data: {},
          message: 'Hành động không hợp lệ',
          errors: ['Hành động phải là approve hoặc reject'],
        });
      }

      if (action === 'approve') {
        // Gọi logic phê duyệt (tái sử dụng từ approveReply)
        return await this.approveReply(req, res);
      } else {
        // Gọi logic từ chối (tái sử dụng từ rejectReply)
        return await this.rejectReply(req, res);
      }
    } catch (error) {
      return res.status(500).json({
        data: {},
        message: 'Lỗi server',
        errors: [error.message],
      });
    }
  }

  async approveReply(req, res) {
    try {
      const token = req.token;
      const review_id = Number(req.params.id);
      const updatedReply = await agentReviewService.approveReply(review_id, token);
      res.status(200).json({
        data: { reply: updatedReply },
        message: 'Approve reply successfully',
        errors: [],
      });
    } catch (err) {
      res.status(400).json({
        data: null,
        message: 'Approve reply failed',
        errors: [err.message],
      });
    }
  }

  async rejectReply(req, res) {
    try {
      const token = req.token;
      const review_id = Number(req.params.id);
      const reply = await agentReviewService.rejectReply(review_id, token);
      res.status(200).json({ 
        data: {reply: reply},
        message: 'Reject reply successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(403).json({
        data: {reply: null},
        message: 'Reject reply failed',
        errors: [err.message],
      });
    }
  }

  async deleteReview(req, res) {
    try {
      const review_id = Number(req.params.id);
      const user_id = Number(req.user.userId);
      const user_role = Number(req.user.userRole);
      const review = await agentReviewService.deleteReview(review_id, user_id, user_role);
      res.status(200).json({ 
        data: {review: review},
        message: 'Delete review successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(403).json({
        data: {review: null},
        message: 'Delete review failed',
        errors: [err.message],
      });
    }
  }

  async getAgentReviews(req, res) {
    try {
      const { agent_id, page = 1, limit = 10 } = req.query;
      if (!agent_id) throw new Error('agent_id is required');
      const reviews = await agentReviewService.getAgentReviews(
        Number(agent_id),
        Number(page),
        Number(limit)
      );
      res.status(200).json({ 
        data: {reviews: reviews},
        message: 'Get agent reviews successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(403).json({
        data: {reviews: null},
        message: 'Get agent reviews failed',
        errors: [err.message],
      });
    }
  }

  async getAgentReviewSummary(req, res) {
    try {
      const { agent_id } = req.query;
      if (!agent_id) throw new Error('agent_id is required');
      const summary = await agentReviewService.getAgentReviewSummary(
        Number(agent_id)
      );
      res.status(200).json({ 
        data: {summary: summary},
        message: 'Get agent review summary successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(403).json({
        data: {summary: null},
        message: 'Get agent review summary failed',
        errors: [err.message],
      });
    }
  }

  async getUserReview(req, res) {
    try {
      const { agent_id } = req.params;
      const user_id = Number(req.user.userId);
      const review = await agentReviewService.getUserReview(
        Number(agent_id),
        user_id
      );
      res.status(200).json({ 
        data: {review: review},
        message: 'Get user review successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(403).json({
        data: {review: null},
        message: 'Get user review failed',
        errors: [err.message],
      });
    }
  }

  async getPendingReplies(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const replies = await agentReviewService.getPendingReplies(
      Number(page),
      Number(limit)
    );
    res.status(200).json({
      data: { replies },
      message: 'Get pending replies successfully',
      errors: [],
    });
  } catch (err) {
    return res.status(403).json({
      data: { replies: null },
      message: 'Get pending replies failed',
      errors: [err.message],
    });
  }
}

async getMyReplies(req, res) {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const agent_id = Number(req.user.userId);
    const replies = await agentReviewService.getMyReplies(
      agent_id,
      status,
      Number(page),
      Number(limit)
    );
    res.status(200).json({
      data: { replies },
      message: 'Get agent replies successfully',
      errors: [],
    });
  } catch (err) {
    return res.status(403).json({
      data: { replies: null },
      message: 'Get agent replies failed',
      errors: [err.message],
    });
  }
}
}

export default new AgentReviewController();
