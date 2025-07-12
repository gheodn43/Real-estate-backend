import blogService from '../services/blog.service.js';

class BlogController {
  constructor() {
    this.createBlog = this.createBlog.bind(this);
    this.saveDraftBlog = this.saveDraftBlog.bind(this);
    this.submitBlogForReview = this.submitBlogForReview.bind(this);
    this.createBlogReview = this.createBlogReview.bind(this);
    this.createBlogReact = this.createBlogReact.bind(this);
    this.shareBlog = this.shareBlog.bind(this);
    this.publishBlog = this.publishBlog.bind(this);
    this.approveBlog = this.approveBlog.bind(this);
    this.rejectBlog = this.rejectBlog.bind(this);
  }

  async createBlog(req, res) {
    try {
      const { title, description, content, small_image, short_link } = req.body;

      const journalist_id = Number(req.user.userId);
      const token = req.token;
      if (!title || !description || !content || !small_image || !short_link) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu thông tin blog',
          errors: [],
        });
      }
      const blog = await blogService.createBlog(
        journalist_id,
        title,
        description,
        content,
        small_image,
        short_link,
        token
      );
      res.status(201).json({
        data: { blog },
        message: 'Blog đã được đăng',
        errors: [],
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async saveDraftBlog(req, res) {
    try {
      const { title, description, content, small_image, short_link } = req.body;
      const journalist_id = Number(req.user.userId);
      const token = req.token;
      if (!title || !description || !content || !small_image || !short_link) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu thông tin blog',
          errors: [],
        });
      }
      const blog = await blogService.saveDraftBlog(
        journalist_id,
        title,
        description,
        content,
        small_image,
        short_link,
        token
      );
      res.status(201).json({
        data: { blog },
        message: 'Blog đã được lưu nháp',
        errors: [],
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async submitBlogForReview(req, res) {
    try {
      const { title, description, content, small_image } = req.body;
      const journalist_id = Number(req.user.userId);
      const token = req.token;
      if (!title || !description || !content) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu thông tin blog',
          errors: [],
        });
      }
      const blog = await blogService.submitBlogForReview(
        journalist_id,
        title,
        description,
        content,
        small_image,
        token
      );
      res.status(201).json({
        data: { blog },
        message: 'Blog đã được gửi duyệt',
        errors: [],
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async createBlogReview(req, res) {
    try {
      const { blog_id, comment } = req.body;
      const user_id = Number(req.user.userId);
      const token = req.token;
      if (!blog_id || !comment) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu thông tin bình luận',
          errors: [],
        });
      }
      const review = await blogService.createBlogReview(
        blog_id,
        user_id,
        comment,
        token
      );
      res.status(201).json({
        data: { review },
        message: 'Bình luận đã được thêm',
        errors: [],
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async createBlogReact(req, res) {
    try {
      const { blog_id } = req.body;
      const user_id = Number(req.user.userId);
      const token = req.token;
      if (!blog_id) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu blog_id',
          errors: [],
        });
      }
      const react = await blogService.createBlogReact(blog_id, user_id, token);
      res.status(201).json({
        data: { react },
        message: 'Đã like blog',
        errors: [],
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async shareBlog(req, res) {
    try {
      const { blog_id, email } = req.body;
      const user_id = Number(req.user.userId);
      const token = req.token;
      if (!blog_id || !email) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu blog_id hoặc email',
          errors: [],
        });
      }
      const result = await blogService.shareBlog(
        blog_id,
        user_id,
        email,
        token
      );
      res.status(200).json({
        data: result,
        message: 'Blog đã được chia sẻ qua email',
        errors: [],
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async publishBlog(req, res) {
    try {
      const { blog_id } = req.body;
      if (!blog_id) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu blog_id',
          errors: [],
        });
      }
      const blog = await blogService.publishBlog(blog_id);
      res.status(200).json({
        data: { blog },
        message: 'Blog đã được đăng',
        errors: [],
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async approveBlog(req, res) {
    try {
      const { blog_id } = req.body;
      const token = req.token;
      if (!blog_id) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu blog_id',
          errors: [],
        });
      }
      const blog = await blogService.approveBlog(blog_id, token);
      res.status(200).json({
        data: { blog },
        message: 'Blog đã được duyệt',
        errors: [],
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async rejectBlog(req, res) {
    try {
      const { blog_id } = req.body;
      const token = req.token;
      if (!blog_id) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu blog_id',
          errors: [],
        });
      }
      const blog = await blogService.rejectBlog(blog_id, token);
      res.status(200).json({
        data: { blog },
        message: 'Blog đã bị từ chối',
        errors: [],
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }
}

export default new BlogController();
