import agentReviewService from '../services/agentReview.service.js';

class AgentReviewController {
  constructor() {
    this.createOrUpdateReview = this.createOrUpdateReview.bind(this);
    this.createReply = this.createReply.bind(this);
    this.deleteReview = this.deleteReview.bind(this);
    this.approveReply = this.approveReply.bind(this);
    this.rejectReply = this.rejectReply.bind(this);
    this.adminReply = this.adminReply.bind(this);
    this.getAgentReviews = this.getAgentReviews.bind(this);
    this.getAgentReviewSummary = this.getAgentReviewSummary.bind(this);
    this.getUserReview = this.getUserReview.bind(this);
  }

  async createOrUpdateReview(req, res) {
    try {
      const token = req.token;
      const { agent_id, rating, comment, images, parent_id, type } = req.body;
      const user_id = Number(req.user.userId); // Lấy từ middleware
      const review = await agentReviewService.createOrUpdateReview({
        token,
        agent_id: Number(agent_id),
        user_id,
        rating,
        comment,
        images,
        parent_id,
        type,
      });
      res.status(201).json({ 
        data: {review: review},
        message: 'Create or update review successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(403).json({
        data: null,
        message: 'Create or update review failed',
        errors: [err.message],
      });
    }
  }

  async createReply(req, res) {
    try {
      const review_id = Number(req.params.id);
      const agent_id = Number(req.user.id);
      const { comment, images } = req.body;
      const reply = await agentReviewService.createReply(review_id, agent_id, {
        comment,
        images,
      });
      res.status(201).json({ success: true, data: reply });
    } catch (err) {
      return res.status(403).json({
        data: null,
        message: err.message || 'Invalid token.',
        errors: [],
      });
    }
  }

  async deleteReview(req, res) {
    try {
      const review_id = Number(req.params.id);
      const user_id = Number(req.user.id);
      const review = await agentReviewService.deleteReview(review_id, user_id);
      res.status(200).json({ success: true, data: review });
    } catch (err) {
      return res.status(403).json({
        data: null,
        message: err.message || 'Invalid token.',
        errors: [],
      });
    }
  }

  async approveReply(req, res) {
    try {
      const review_id = Number(req.params.id);
      const admin_id = Number(req.user.id);
      const reply = await agentReviewService.approveReply(review_id, admin_id);
      res.status(200).json({ success: true, data: reply });
    } catch (err) {
      return res.status(403).json({
        data: null,
        message: err.message || 'Invalid token.',
        errors: [],
      });
    }
  }

  async rejectReply(req, res) {
    try {
      const review_id = Number(req.params.id);
      const admin_id = Number(req.user.id);
      const reply = await agentReviewService.rejectReply(review_id, admin_id);
      res.status(200).json({ success: true, data: reply });
    } catch (err) {
      return res.status(403).json({
        data: null,
        message: err.message || 'Invalid token.',
        errors: [],
      });
    }
  }

  async adminReply(req, res) {
    try {
      const review_id = Number(req.params.id);
      const admin_id = Number(req.user.id);
      const { comment, images } = req.body;
      const reply = await agentReviewService.adminReply(review_id, admin_id, {
        comment,
        images,
      });
      res.status(201).json({ success: true, data: reply });
    } catch (err) {
      return res.status(403).json({
        data: null,
        message: err.message || 'Invalid token.',
        errors: [],
      });
    }
  }

  async getAgentReviews(req, res) {
    try {
      const { agent_id, page = 1, pageSize = 10 } = req.query;
      if (!agent_id) throw new Error('agent_id is required');
      const reviews = await agentReviewService.getAgentReviews(
        Number(agent_id),
        Number(page),
        Number(pageSize)
      );
      res.status(200).json({ success: true, data: reviews });
    } catch (err) {
      return res.status(403).json({
        data: null,
        message: err.message || 'Invalid token.',
        errors: [],
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
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      return res.status(403).json({
        data: null,
        message: err.message || 'Invalid token.',
        errors: [],
      });
    }
  }

  async getUserReview(req, res) {
    try {
      const { agent_id } = req.params;
      const user_id = Number(req.user.id);
      const review = await agentReviewService.getUserReview(
        Number(agent_id),
        user_id
      );
      res.status(200).json({ success: true, data: review });
    } catch (err) {
      return res.status(403).json({
        data: null,
        message: err.message || 'Invalid token.',
        errors: [],
      });
    }
  }
}

export default new AgentReviewController();
