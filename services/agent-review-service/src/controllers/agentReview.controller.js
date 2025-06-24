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
      const user_id = Number(req.user.userId); 
      const user = req.user;
      const review = await agentReviewService.createOrUpdateReview({
        token,
        user,
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
      const agent_id = Number(req.user.userId); 
      const { comment, images } = req.body;
      const reply = await agentReviewService.createReply(review_id, agent_id, {
        comment,
        images,
      });
      res.status(201).json({ 
        data: {reply: reply}, 
        message: 'Create reply successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(403).json({
        data: null,
        message: 'Create reply failed',
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

  async approveReply(req, res) {
    try {
      const review_id = Number(req.params.id);
      const updatedReply = await agentReviewService.approveReply(review_id);
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
      const review_id = Number(req.params.id);
      const admin_id = Number(req.user.id);
      const reply = await agentReviewService.rejectReply(review_id, admin_id);
      res.status(200).json({ 
        data: {reply: reply},
        message: 'Reject reply successfully',
        errors: [],
      });
    } catch (err) {
      console.error('Reject reply error:', err);
      return res.status(403).json({
        data: {reply: null},
        message: 'Reject reply failed',
        errors: [err.message],
      });
    }
  }

  async adminReply(req, res) {
    try {
      const review_id = Number(req.params.id);
      const admin_id = Number(req.user.userId);
      const { comment, images } = req.body;
      const reply = await agentReviewService.adminReply(review_id, admin_id, {
        comment,
        images,
      });
      res.status(201).json({ 
        data: {reply: reply}, 
        message: 'Admin reply successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(403).json({
        data: {reply: null},
        message: 'Admin reply failed',
        errors: [err.message],
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
}

export default new AgentReviewController();
