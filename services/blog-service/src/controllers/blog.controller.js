import blogService from '../services/blog.service.js';
import { RoleName } from '../middleware/roleGuard.js';


class BlogController {
  constructor() {
    this.createBlog = this.createBlog.bind(this);
    this.saveDraftBlog = this.saveDraftBlog.bind(this);
    this.submitBlogForReview = this.submitBlogForReview.bind(this);
    this.createBlogReview = this.createBlogReview.bind(this);
    this.createBlogReact = this.createBlogReact.bind(this);
    this.shareBlog = this.shareBlog.bind(this);
    this.publishedBlog = this.publishedBlog.bind(this);
    this.moderateBlog = this.moderateBlog.bind(this);
    this.updateBlogContent = this.updateBlogContent.bind(this);
    this.getBlogs = this.getBlogs.bind(this);
    this.getBlogByShortLink = this.getBlogByShortLink.bind(this);
    this.resubmitBlog = this.resubmitBlog.bind(this);
  }

  async createBlog(req, res) {
  try {
    const { title, description, content, small_image, short_link } = req.body;
    const journalist_id = Number(req.user.userId);
    const token = req.token;
    if (!title || !description || !content) {
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
      message: blog.status === 'published' ? 'Bài viết đã được đăng' : 'Blog đã được gửi duyệt',
      errors: [],
    });
  } catch (err) {
    console.error(`[BlogController.createBlog] Error: ${err.message}`);
    res.status(500).json({
      data: null,
      message: 'Lỗi server',
      errors: [err.message],
    });
  }
}

  async updateBlogContent(req, res) {
  try {
    const { blog_id } = req.params;
    const { title, description, content } = req.body;
    const journalist_id = Number(req.user.userId);

    console.log(`[BlogController.updateBlog] req.body: ${JSON.stringify(req.body, null, 2)}`);

    if (!blog_id) {
      return res.status(400).json({
        data: null,
        message: 'Thiếu blog_id',
        errors: [],
      });
    }

    const blog = await blogService.updateBlogContent(

      Number(blog_id),
      journalist_id,
      title,
      description,
      content,
      req.user.userRole,
    );

    res.status(200).json({
      data: blog,
      message: blog.status === 'published' ? 'Blog đã được cập nhật và giữ trạng thái published' : 'Blog đã được cập nhật',
      errors: [],
    });
  } catch (err) {
    console.error(`[BlogController.updateBlog] Error: ${err.message}`);
    if (err.message === 'Blog not found') {
      return res.status(404).json({
        data: null,
        message: 'Blog không tồn tại',
        errors: [err.message],
      });
    }
    if (err.message === 'User not authorized to update this blog' || err.message === 'Blog with this title already exists for this journalist') {
      return res.status(403).json({
        data: null,
        message: 'Không có quyền cập nhật blog',
        errors: [err.message],
      });
    }
    res.status(500).json({
      data: null,
      message: 'Lỗi server',
      errors: [err.message],
    });
  }
}

  async resubmitBlog(req, res) {
  try {
    const {title, description, content } = req.body;
    const blog_id = req.params.blog_id;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        data: null,
        message: 'Missing authorization token',
        errors: ['Missing authorization token'],
      });
    }
    if (!blog_id) {
      return res.status(400).json({
        data: null,
        message: 'Thiếu blog_id',
        errors: ['Thiếu blog_id'],
      });
    }
    if(req.user.userRole !== RoleName.Journalist ) {
      return res.status(403).json({
        data: null,
        message: 'Không có quyền gửi lại blog',
        errors: ['Không có quyền gửi lại blog'],
      });
    }
    const blog = await blogService.resubmitBlog(blog_id, title, description, content);
    res.status(200).json({
      data: { blog },
      message: 'Blog đã được gửi lại để duyệt',
      errors: [],
    });
  } catch (err) {
    console.error(`[BlogController.resubmitBlog] Error: ${err.message}`);
    res.status(err.message.includes('not found') ? 404 : 400).json({
      data: null,
      message: err.message,
      errors: [err.message],
    });
  }
}

  async deleteBlog(req, res) {
    try {
      const { blog_id } = req.params;
      const user_id = Number(req.user.userId);
      const token = req.token;
      if (!blog_id) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu blog_id',
          errors: [],
        });
      }
      const result = await blogService.deleteBlog(Number(blog_id), user_id, token);
      res.status(200).json({
        data: { result },
        message: 'Blog đã được xóa',
        errors: [],
      });
    } catch (err) {
      console.error(`[BlogController.deleteBlog] Error: ${err.message}`);
      res.status(err.message === 'Blog not found' ? 404 : 403).json({
        data: null,
        message: err.message === 'Blog not found' ? 'Blog không tồn tại' : 'Không có quyền xóa blog',
        errors: [err.message],
      });
    }
  }

  async getBlogs(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const user_id = Number(req.user.userId);
      const result = await blogService.getBlogs(user_id, Number(page), Number(limit));
      res.status(200).json({
        data: result,
        message: 'Danh sách blog đã được lấy thành công',
        errors: [],
      });
    } catch (err) {
      console.error(`[BlogController.getBlogs] Error: ${err.message}`);
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async getBlogByShortLink(req, res) {
  try {
    const { short_link } = req.params;
    const { commentPage = 1, commentLimit = 10 } = req.query;
    const user_id = Number(req.user.userId);

    // Kiểm tra đầu vào
    if (!short_link) {
      return res.status(400).json({
        data: null,
        message: 'Thiếu short_link',
        errors: ['Invalid or missing short_link'],
      });
    }
    const page = Number(commentPage);
    const limit = Number(commentLimit);
    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        data: null,
        message: 'Số trang bình luận không hợp lệ',
        errors: ['commentPage must be a positive integer'],
      });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        data: null,
        message: 'Giới hạn bình luận không hợp lệ',
        errors: ['commentLimit must be between 1 and 100'],
      });
    }
    if (!Number.isInteger(user_id)) {
      return res.status(400).json({
        data: null,
        message: 'ID người dùng không hợp lệ',
        errors: ['Invalid user_id'],
      });
    }

    const result = await blogService.getBlogByShortLink(short_link, user_id, page, limit);
    res.status(200).json({
      data: result,
      message: 'Chi tiết blog đã được lấy thành công',
      errors: [],
    });
  } catch (err) {
    console.error(`[BlogController.getBlogByShortLink] Error: ${err.message}`);
    res.status(err.message === 'Blog not found' ? 404 : 400).json({
      data: null,
      message: err.message === 'Blog not found' ? 'Blog không tồn tại' : err.message,
      errors: [err.message],
    });
  }
}

  async saveDraftBlog(req, res) {
    try {
      const { title, description, content, small_image, short_link } = req.body;
      const journalist_id = Number(req.user.userId);
      const token = req.token;
      if (!title || !description || !content) {
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
      console.error(`[BlogController.saveDraftBlog] Error: ${err.message}`);
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async submitBlogForReview(req, res) {
    try {
      const { title, description, content, small_image, short_link } = req.body;
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
        short_link,
        token
      );
      res.status(201).json({
        data: { blog },
        message: 'Blog đã được gửi duyệt',
        errors: [],
      });
    } catch (err) {
      console.error(`[BlogController.submitBlogForReview] Error: ${err.message}`);
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
      console.error(`[BlogController.createBlogReview] Error: ${err.message}`);
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
      const { result, action } = await blogService.createBlogReact(blog_id, user_id, token);
      res.status(action === 'like' ? 201 : 200).json({
        data: { result },
        message: action === 'like' ? 'Đã like blog' : 'Đã bỏ like blog',
        errors: [],
      });
    } catch (err) {
      console.error(`[BlogController.createBlogReact] Error: ${err.message}`);
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
        data: { result },
        message: 'Blog đã được chia sẻ qua email',
        errors: [],
      });
    } catch (err) {
      console.error(`[BlogController.shareBlog] Error: ${err.message}`);
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }

  async publishedBlog(req, res) {
  try {
    const {title, description, content } = req.body;
    const blog_id = req.params.blog_id;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        data: null,
        message: 'Missing authorization token',
        errors: ['Missing authorization token'],
      });
    }
    if (!blog_id) {
      return res.status(400).json({
        data: null,
        message: 'Thiếu blog_id',
        errors: ['Thiếu blog_id'],
      });
    }
    if(req.user.userRole !== RoleName.Admin ) {
      return res.status(403).json({
        data: null,
        message: 'Không có quyền gửi lại blog',
        errors: ['Không có quyền gửi lại blog'],
      });
    }
    const blog = await blogService.publishedBlog(blog_id, title, description, content);
    res.status(200).json({
      data: { blog },
      message: 'Blog đã được gửi lại để duyệt',
      errors: [],
    });
  } catch (err) {
    console.error(`[BlogController.resubmitBlog] Error: ${err.message}`);
    res.status(err.message.includes('not found') ? 404 : 400).json({
      data: null,
      message: err.message,
      errors: [err.message],
    });
  }
}
  async moderateBlog(req, res) {
    try {
      const { blog_id, action } = req.body;
      const token = req.token;
      if (!blog_id || !action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          data: null,
          message: 'Thiếu blog_id hoặc action không hợp lệ',
          errors: [],
        });
      }
      const blog = await blogService.moderateBlog(blog_id, token, action);
      res.status(200).json({
        data: { blog },
        message: action === 'approve' ? 'Blog đã được duyệt' : 'Blog đã bị từ chối',
        errors: [],
      });
    } catch (err) {
      console.error(`[BlogController.moderateBlog] Error: ${err.message}`);
      res.status(500).json({
        data: null,
        message: 'Lỗi server',
        errors: [err.message],
      });
    }
  }
}

export default new BlogController();