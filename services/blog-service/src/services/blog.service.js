import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export const createBlog = async (journalist_id, title, description, content, small_image, short_link) => {
  return await prisma.blogs.create({
    data: {
      title,
      description,
      content,
      small_image,
      short_link,
      status: 'published',
      journalist_id,
      created_at: new Date(),
    },
  });
};

export const saveDraftBlog = async (journalist_id, title, description, content, small_image, short_link) => {
  return await prisma.blogs.create({
    data: {
      title,
      description,
      content,
      small_image,
      short_link,
      status: 'draft',
      journalist_id,
      created_at: new Date(),
    },
  });
};

export const submitBlogForReview = async (journalist_id, title, description, content, small_image, short_link) => {
  return await prisma.blogs.create({
    data: {
      title,
      description,
      content,
      small_image,
      short_link,
      status: 'pending',
      journalist_id,
      created_at: new Date(),
    },
  });
};

export const createBlogReview = async (blog_id, user_id, comment) => {
  const blog = await prisma.blogs.findUnique({ where: { id: blog_id } });
  if (!blog) throw new Error('Blog không tồn tại');
  return await prisma.blog_reviews.create({
    data: {
      blog_id,
      user_id,
      comment,
      status: 'published',
      created_at: new Date(),
    },
  });
};

export const createBlogReact = async (blog_id, user_id) => {
  const blog = await prisma.blogs.findUnique({ where: { id: blog_id } });
  if (!blog) throw new Error('Blog không tồn tại');
  const existingReact = await prisma.blog_react.findFirst({
    where: { blog_id, user_id },
  });
  if (existingReact) throw new Error('Bạn đã like blog này rồi');
  return await prisma.blog_react.create({
    data: {
      blog_id,
      user_id,
      created_at: new Date(),
    },
  });
};

export const shareBlog = async (blog_id, user_id, email) => {
  const blog = await prisma.blogs.findUnique({ where: { id: blog_id } });
  if (!blog) throw new Error('Blog không tồn tại');
  await axios.post('http://mail-service:4003/mail/auth/shareBlog', {
    email,
    blog: { title: blog.title, short_link: blog.short_link },
    user_id,
  });
  return { message: 'Blog đã được chia sẻ qua email' };
};

export const publishBlog = async (blog_id) => {
  const blog = await prisma.blogs.findUnique({ where: { id: blog_id } });
  if (!blog) throw new Error('Blog không tồn tại');
  return await prisma.blogs.update({
    where: { id: blog_id },
    data: { status: 'published', updated_at: new Date() },
  });
};

export const approveBlog = async (blog_id) => {
  const blog = await prisma.blogs.findUnique({ where: { id: blog_id } });
  if (!blog || blog.status !== 'pending') throw new Error('Blog không hợp lệ để duyệt');
  return await prisma.blogs.update({
    where: { id: blog_id },
    data: { status: 'published', updated_at: new Date() },
  });
};

export const rejectBlog = async (blog_id) => {
  const blog = await prisma.blogs.findUnique({ where: { id: blog_id } });
  if (!blog || blog.status !== 'pending') throw new Error('Blog không hợp lệ để từ chối');
  return await prisma.blogs.update({
    where: { id: blog_id },
    data: { status: 'rejected', updated_at: new Date() },
  });
};