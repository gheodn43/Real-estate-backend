import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getJournalistFromAuthService, getUserFromAuthService } from '../helpers/authClient.js';

const prisma = new PrismaClient();

class BlogService {
  async createBlog(journalist_id, title, description, content, small_image, short_link, token) {
    try {
      const existingBlog = await prisma.blogs.findFirst({
        where: { title, journalist_Id: Number(journalist_id), status: { not: 'rejected' } },
      });
      if (existingBlog) {
        throw new Error('Blog with this title already exists for this journalist');
      }

      const blog = await prisma.blogs.create({
        data: {
          journalist_Id: Number(journalist_id),
          title,
          description,
          content,
          small_image,
          short_link,
          status: 'published',
        },
      });

      const journalist = await getJournalistFromAuthService(journalist_id, token);
      const journalistData = journalist?.data?.user;

      if (journalistData?.email && journalistData?.name) {
        const emailPayload = {
          journalistEmail: journalistData.email,
          journalistName: journalistData.name,
          blog: {
            id: blog.id,
            title: blog.title,
            description: blog.description,
            content: blog.content,
            small_image: blog.small_image,
            short_link: blog.short_link,
            created_at: blog.created_at.toISOString(),
          },
        };
        try {
          await axios.post(
            'http://mail-service:4003/mail/auth/notifyJournalistNewBlog',
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }

      return blog;
    } catch (err) {
      throw new Error(`Failed to create blog: ${err.message}`);
    }
  }

  async saveDraftBlog(journalist_id, title, description, content, small_image, short_link, token) {
    try {
      const blog = await prisma.blogs.create({
        data: {
          journalist_Id: Number(journalist_id),
          title,
          description,
          content,
          small_image,
          short_link,
          status: 'draft',
        },
      });

      const journalist = await getJournalistFromAuthService(journalist_id, token);
      const journalistData = journalist?.data?.user;

      if (journalistData?.email && journalistData?.name) {
        const emailPayload = {
          journalistEmail: journalistData.email,
          journalistName: journalistData.name,
          blog: {
            id: blog.id,
            title: blog.title,
            description: blog.description,
            content: blog.content,
            small_image: blog.small_image,
            short_link: blog.short_link,
            created_at: blog.created_at.toISOString(),
          },
        };
        try {
          await axios.post(
            'http://mail-service:4003/mail/auth/notifyJournalistDraftBlog',
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }

      return blog;
    } catch (err) {
      throw new Error(`Failed to save draft blog: ${err.message}`);
    }
  }

  async submitBlogForReview(journalist_id, title, description, content, small_image, short_link, token) {
    try {
      const blog = await prisma.blogs.create({
        data: {
          journalist_Id: Number(journalist_id),
          title,
          description,
          content,
          small_image,
          short_link,
          status: 'pending',
        },
      });

      const journalist = await getJournalistFromAuthService(journalist_id, token);
      const journalistData = journalist?.data?.user;

      if (journalistData?.email && journalistData?.name) {
        const emailPayload = {
          adminEmail: 'kietnguyen23012002@gmail.com',
          adminName: 'Admin',
          blog: {
            id: blog.id,
            title: blog.title,
            description: blog.description,
            content: blog.content,
            small_image: blog.small_image,
            short_link: blog.short_link,
            created_at: blog.created_at.toISOString(),
          },
          journalist: {
            id: journalist_id,
            name: journalistData.name,
            email: journalistData.email,
          },
        };
        try {
          await axios.post(
            'http://mail-service:4003/mail/auth/notifyAdminBlogSubmitted',
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }

      return blog;
    } catch (err) {
      throw new Error(`Failed to submit blog for review: ${err.message}`);
    }
  }

  async createBlogReview(blog_id, user_id, comment, token) {
    try {
      const blog = await prisma.blogs.findUnique({ where: { id: Number(blog_id) } });
      if (!blog) throw new Error('Blog not found');

      const review = await prisma.blog_reviews.create({
        data: {
          blog_id: Number(blog_id),
          user_id: Number(user_id),
          comment,
          parent_id: 0, 
          status: 'published', 
        },
      });

      const user = await getUserFromAuthService(user_id, token);
      const userData = user?.data?.user;
      const journalist = await getJournalistFromAuthService(blog.journalist_Id, token); 
      const journalistData = journalist?.data?.user;

      if (journalistData?.email && journalistData?.name && userData?.name) {
        const emailPayload = {
          journalistEmail: journalistData.email,
          journalistName: journalistData.name,
          review: {
            id: review.id,
            comment: review.comment,
            created_at: review.created_at.toISOString(),
          },
          user: {
            id: user_id,
            name: userData.name,
            email: userData.email,
          },
          blog: {
            id: blog.id,
            title: blog.title,
          },
        };
        try {
          await axios.post(
            'http://mail-service:4003/mail/auth/notifyJournalistNewReview',
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }

      return review;
    } catch (err) {
      throw new Error(`Failed to create blog review: ${err.message}`);
    }
  }

  async createBlogReact(blog_id, user_id, token) {
    try {
      const blog = await prisma.blogs.findUnique({ where: { id: Number(blog_id) } });
      if (!blog) throw new Error('Blog not found');

      const existingReact = await prisma.blog_react.findFirst({
        where: { blog_id: Number(blog_id), user_id: Number(user_id) },
      });
      if (existingReact) throw new Error('User already reacted to this blog');

      const react = await prisma.blog_react.create({
        data: {
          blog_id: Number(blog_id),
          user_id: Number(user_id),
        },
      });

      const user = await getUserFromAuthService(user_id, token);
      const userData = user?.data?.user;
      const journalist = await getJournalistFromAuthService(blog.journalist_Id, token); 
      const journalistData = journalist?.data?.user;

      if (journalistData?.email && journalistData?.name && userData?.name) {
        const emailPayload = {
          journalistEmail: journalistData.email,
          journalistName: journalistData.name,
          react: {
            id: react.id,
            created_at: react.created_at.toISOString(),
          },
          user: {
            id: user_id,
            name: userData.name,
            email: userData.email,
          },
          blog: {
            id: blog.id,
            title: blog.title,
          },
        };
        try {
          await axios.post(
            'http://mail-service:4003/mail/auth/notifyJournalistNewReact',
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }
      return react;
    } catch (err) {
      throw new Error(`Failed to create blog react: ${err.message}`);
    }
  }

  async shareBlog(blog_id, user_id, email, token) {
    try {
      const blog = await prisma.blogs.findUnique({ where: { id: Number(blog_id) } });
      if (!blog) throw new Error('Blog not found');

      const user = await getUserFromAuthService(user_id, token);
      const userData = user?.data?.user;

      const emailPayload = {
        recipientEmail: email,
        blog: {
          id: blog.id,
          title: blog.title,
          description: blog.description,
          short_link: blog.short_link,
        },
        user: {
          id: user_id,
          name: userData?.name || 'Unknown User',
          email: userData?.email || 'unknown@example.com',
        },
      };

      try {
        await axios.post(
          'http://mail-service:4003/mail/auth/shareBlog',
          emailPayload,
          { headers: { 'Content-Type': 'application/json' }}
        );
      } catch (emailErr) {
      }

      return { message: 'Blog đã được chia sẻ qua email' };
    } catch (err) {
      throw new Error(`Failed to share blog: ${err.message}`);
    }
  }

  async publishBlog(blog_id) {
    try {
      const blog = await prisma.blogs.findUnique({ where: { id: Number(blog_id) } });
      if (!blog) throw new Error('Blog not found');
      if (blog.status === 'published') throw new Error('Blog already published');

      const updatedBlog = await prisma.blogs.update({
        where: { id: Number(blog_id) },
        data: { status: 'published', updated_at: new Date() },
      });

      return updatedBlog;
    } catch (err) {
      throw new Error(`Failed to publish blog: ${err.message}`);
    }
  }

  async approveBlog(blog_id, token) {
    try {
      const blog = await prisma.blogs.findUnique({ where: { id: Number(blog_id) } });
      if (!blog || blog.status !== 'pending') throw new Error('Blog not found or not pending');

      const updatedBlog = await prisma.blogs.update({
        where: { id: Number(blog_id) },
        data: { status: 'published', updated_at: new Date() },
      });

      const journalist = await getJournalistFromAuthService(blog.journalist_Id, token); 
      const journalistData = journalist?.data?.user;

      if (journalistData?.email && journalistData?.name) {
        const emailPayload = {
          journalistEmail: journalistData.email,
          journalistName: journalistData.name,
          blog: {
            id: updatedBlog.id,
            title: updatedBlog.title,
            status: updatedBlog.status,
            updated_at: updatedBlog.updated_at.toISOString(),
          },
        };
        try {
          await axios.post(
            'http://mail-service:4003/mail/auth/notifyJournalistBlogApproved',
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }

      return updatedBlog;
    } catch (err) {
      throw new Error(`Failed to approve blog: ${err.message}`);
    }
  }

  async rejectBlog(blog_id, token) {
    try {
      const blog = await prisma.blogs.findUnique({ where: { id: Number(blog_id) } });
      if (!blog || blog.status !== 'pending') throw new Error('Blog not found or not pending');

      const updatedBlog = await prisma.blogs.update({
        where: { id: Number(blog_id) },
        data: { status: 'rejected', updated_at: new Date() },
      });

      const journalist = await getJournalistFromAuthService(blog.journalist_Id, token); 
      const journalistData = journalist?.data?.user;

      if (journalistData?.email && journalistData?.name) {
        const emailPayload = {
          journalistEmail: journalistData.email,
          journalistName: journalistData.name,
          blog: {
            id: updatedBlog.id,
            title: updatedBlog.title,
            status: updatedBlog.status,
            updated_at: updatedBlog.updated_at.toISOString(),
          },
        };
        try {
          await axios.post(
            'http://mail-service:4003/mail/auth/notifyJournalistBlogRejected',
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }

      return updatedBlog;
    } catch (err) {
      throw new Error(`Failed to reject blog: ${err.message}`);
    }
  }
}

export default new BlogService();