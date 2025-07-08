import blogService from '../services/blog.service';

exports.createBlog = async (req, res) => {
  try {
    const { title, description, content, small_image, short_link } = req.body;
    const journalist_id = req.user.id; // Lấy từ token
    if (!title || !description || !content || !small_image || !short_link) {
      return res.status(400).json({ message: 'Thiếu thông tin blog' });
    }
    const blog = await blogService.createBlog(journalist_id, title, description, content, small_image, short_link);
    res.status(201).json({ data: blog, message: 'Blog đã được đăng' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', errors: [err.message] });
  }
};

exports.saveDraftBlog = async (req, res) => {
  try {
    const { title, description, content, small_image, short_link } = req.body;
    const journalist_id = req.user.id;
    if (!title || !description || !content || !small_image || !short_link) {
      return res.status(400).json({ message: 'Thiếu thông tin blog' });
    }
    const blog = await blogService.saveDraftBlog(journalist_id, title, description, content, small_image, short_link);
    res.status(201).json({ data: blog, message: 'Blog đã được lưu nháp' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', errors: [err.message] });
  }
};

exports.submitBlogForReview = async (req, res) => {
  try {
    const { title, description, content, small_image, short_link } = req.body;
    const journalist_id = req.user.id;
    if (!title || !description || !content || !small_image || !short_link) {
      return res.status(400).json({ message: 'Thiếu thông tin blog' });
    }
    const blog = await blogService.submitBlogForReview(journalist_id, title, description, content, small_image, short_link);
    res.status(201).json({ data: blog, message: 'Blog đã được gửi duyệt' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', errors: [err.message] });
  }
};

exports.createBlogReview = async (req, res) => {
  try {
    const { blog_id, comment } = req.body;
    const user_id = req.user.id;
    if (!blog_id || !comment) {
      return res.status(400).json({ message: 'Thiếu thông tin bình luận' });
    }
    const review = await blogService.createBlogReview(blog_id, user_id, comment);
    res.status(201).json({ data: review, message: 'Bình luận đã được thêm' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', errors: [err.message] });
  }
};

exports.createBlogReact = async (req, res) => {
  try {
    const { blog_id } = req.body;
    const user_id = req.user.id;
    if (!blog_id) {
      return res.status(400).json({ message: 'Thiếu blog_id' });
    }
    const react = await blogService.createBlogReact(blog_id, user_id);
    res.status(201).json({ data: react, message: 'Đã like blog' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', errors: [err.message] });
  }
};

exports.shareBlog = async (req, res) => {
  try {
    const { blog_id, email } = req.body;
    const user_id = req.user.id;
    if (!blog_id || !email) {
      return res.status(400).json({ message: 'Thiếu blog_id hoặc email' });
    }
    const result = await blogService.shareBlog(blog_id, user_id, email);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', errors: [err.message] });
  }
};

exports.publishBlog = async (req, res) => {
  try {
    const { blog_id } = req.body;
    if (!blog_id) {
      return res.status(400).json({ message: 'Thiếu blog_id' });
    }
    const blog = await blogService.publishBlog(blog_id);
    res.status(200).json({ data: blog, message: 'Blog đã được đăng' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', errors: [err.message] });
  }
};

exports.approveBlog = async (req, res) => {
  try {
    const { blog_id } = req.body;
    if (!blog_id) {
      return res.status(400).json({ message: 'Thiếu blog_id' });
    }
    const blog = await blogService.approveBlog(blog_id);
    res.status(200).json({ data: blog, message: 'Blog đã được duyệt' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', errors: [err.message] });
  }
};

exports.rejectBlog = async (req, res) => {
  try {
    const { blog_id } = req.body;
    if (!blog_id) {
      return res.status(400).json({ message: 'Thiếu blog_id' });
    }
    const blog = await blogService.rejectBlog(blog_id);
    res.status(200).json({ data: blog, message: 'Blog đã bị từ chối' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', errors: [err.message] });
  }
};