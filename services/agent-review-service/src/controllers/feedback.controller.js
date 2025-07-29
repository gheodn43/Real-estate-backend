import FeedbackService from '../services/feedback.service.js';

class FeedbackController {
  constructor() {
    this.createFeedback = this.createFeedback.bind(this);
    this.getAllFeedback = this.getAllFeedback.bind(this);
    this.getFeedbackById = this.getFeedbackById.bind(this);
    this.replyFeedback = this.replyFeedback.bind(this);
    this.hideFeedback = this.hideFeedback.bind(this);
    this.getRespondedFeedback = this.getRespondedFeedback.bind(this);
  }

  async createFeedback(req, res) {
    try {
      const { first_name, last_name, address, city, email, number_phone, message } = req.body;
      const feedback = await FeedbackService.createFeedback({
        last_name,
        first_name,
        address,
        city,
        email,
        number_phone,
        message,
      });
      res.status(201).json({
        data: feedback,
        message: 'Feedback created successfully',
        error: [],
      });
    } catch (err) {
      res.status(400).json({
        data: {},
        message: err.message,
        error: [err.message],
      });
    }
  }

  async getAllFeedback(req, res) {
    try {
      const { page, limit, status } = req.query;
      const result = await FeedbackService.getAllFeedback({ page, limit, status });
      res.status(200).json({
        data: result,
        message: 'Feedback list retrieved successfully',
        error: [],
      });
    } catch (err) {
      res.status(400).json({
        data: {},
        message: err.message,
        error: [err.message],
      });
    }
  }

  async getFeedbackById(req, res) {
    try {
      const { id } = req.params;
      const feedback = await FeedbackService.getFeedbackById(id);
      res.status(200).json({
        data: feedback,
        message: 'Feedback retrieved successfully',
        error: [],
      });
    } catch (err) {
      res.status(404).json({
        data: {},
        message: err.message,
        error: [err.message],
      });
    }
  }

  async replyFeedback(req, res) {
    try {
      const { id } = req.params;
      const { response } = req.body;
      const response_by = req.user.id; // Giả định admin id từ token
      const feedback = await FeedbackService.replyFeedback(id, { response, response_by });
      res.status(200).json({
        data: feedback,
        message: 'Feedback replied successfully',
        error: [],
      });
    } catch (err) {
      res.status(400).json({
        data: {},
        message: err.message,
        error: [err.message],
      });
    }
  }

  async hideFeedback(req, res) {
    try {
      const { id } = req.params;
      const feedback = await FeedbackService.hideFeedback(id);
      res.status(200).json({
        data: feedback,
        message: 'Feedback hidden successfully',
        error: [],
      });
    } catch (err) {
      res.status(404).json({
        data: {},
        message: err.message,
        error: [err.message],
      });
    }
  }

  async getRespondedFeedback(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await FeedbackService.getRespondedFeedback({ page, limit });
      res.status(200).json({
        data: result,
        message: 'Responded feedback list retrieved successfully',
        error: [],
      });
    } catch (err) {
      res.status(400).json({
        data: {},
        message: err.message,
        error: [err.message],
      });
    }
  }
}

export default new FeedbackController();