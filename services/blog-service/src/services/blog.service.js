import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import slugify from 'slugify';
import { getJournalistFromAuthService, getUserFromAuthService } from '../helpers/authClient.js';
import BlogStatus from '../enums/blogStatus.enum.js';
import BlogReviewStatus from '../enums/blogReviewStatus.enum.js';

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

    let finalShortLink = short_link || slugify(title, { lower: true, strict: true });
    
    let counter = 1;
    let tempShortLink = finalShortLink;
    while (await prisma.blogs.findFirst({ where: { short_link: tempShortLink } })) {
      tempShortLink = `${finalShortLink}-${counter}`;
      counter++;
    }
    finalShortLink = tempShortLink;

    const defaultImage = 'https://example.com/default-image.jpg';
    const finalSmallImage = small_image || defaultImage;

    const journalist = await getJournalistFromAuthService(journalist_id, token);
    const journalistData = journalist?.data?.user;
   
    const status = 'published';

    const blog = await prisma.blogs.create({
      data: {
        journalist_Id: Number(journalist_id),
        title,
        description,
        content,
        small_image: finalSmallImage,
        short_link: finalShortLink,
        status,
      },
    });

  
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
          status: blog.status,
        },
      };

      try {
        const emailResponse = await axios.post(
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

  async updateBlog(blog_id, journalist_id, title, description, content, small_image, short_link, token) {
    try {
      
      const blog = await prisma.blogs.findUnique({ where: { id: Number(blog_id) } });
      if (!blog) {
        throw new Error('Blog not found');
      }
      if (blog.journalist_Id !== Number(journalist_id)) {
        throw new Error('User not authorized to update this blog');
      }

      
      if (title && title !== blog.title) {
        const existingBlog = await prisma.blogs.findFirst({
          where: {
            title,
            journalist_Id: Number(journalist_id),
            status: { not: BlogStatus.REJECTED },
            id: { not: Number(blog_id) },
          },
        });
        if (existingBlog) {
          throw new Error('Blog with this title already exists for this journalist');
        }
      }

      
      let finalShortLink = short_link || (title ? slugify(title, { lower: true, strict: true }) : blog.short_link);
      
      let counter = 1;
      let tempShortLink = finalShortLink;
      while (
        await prisma.blogs.findFirst({
          where: { short_link: tempShortLink, id: { not: Number(blog_id) } },
        })
      ) {
        tempShortLink = `${finalShortLink}-${counter}`;
        counter++;
      }
      finalShortLink = tempShortLink;

      
      const defaultImage = 'https://example.com/default-image.jpg';
      const finalSmallImage = small_image || blog.small_image || defaultImage;

      
      const journalist = await getJournalistFromAuthService(journalist_id, token);
      const journalistData = journalist?.data?.user;
      const role = journalistData?.role?.rolename || 'Journalist';

      let status = blog.status;
      if (blog.status === BlogStatus.PUBLISHED && role !== 'Admin') {
        status = BlogStatus.PENDING; 
      } else if ([BlogStatus.DRAFT, BlogStatus.PENDING, BlogStatus.REJECTED, BlogStatus.HIDDEN].includes(blog.status)) {
        status = blog.status; 
      }

      const updatedBlog = await prisma.blogs.update({
        where: { id: Number(blog_id) },
        data: {
          title: title || blog.title,
          description: description || blog.description,
          content: content || blog.content,
          small_image: finalSmallImage,
          short_link: finalShortLink,
          status,
          updated_at: new Date(),
        },
      });

      if (journalistData?.email && journalistData?.name) {
        const emailPayload = {
          journalistEmail: journalistData.email,
          journalistName: journalistData.name,
          blog: {
            id: updatedBlog.id,
            title: updatedBlog.title,
            description: updatedBlog.description,
            content: updatedBlog.content,
            small_image: updatedBlog.small_image,
            short_link: updatedBlog.short_link,
            created_at: updatedBlog.created_at.toISOString(),
            updated_at: updatedBlog.updated_at.toISOString(),
            status: updatedBlog.status,
          },
        };
        try {
          await axios.post(
            `http://mail-service:4003/mail/auth/notifyJournalist${status === BlogStatus.PUBLISHED ? 'BlogPublished' : 'BlogUpdated'}`,
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }

      return updatedBlog;
    } catch (err) {
      throw new Error(`Failed to update blog: ${err.message}`);
    }
  }

  async resubmitBlog(blog_id, journalist_id, token) {
    try {
      const blog = await prisma.blogs.findUnique({ where: { id: Number(blog_id) } });
      if (!blog) {
        throw new Error('Blog not found');
      }
      if (blog.journalist_Id !== Number(journalist_id)) {
        const journalist = await getJournalistFromAuthService(journalist_id, token);
        const journalistData = journalist?.data?.user;
        const role = journalistData?.role?.rolename || 'Journalist';
        if (role !== 'Admin') {
          throw new Error('User not authorized to resubmit this blog');
        }
      }
      if (blog.status !== BlogStatus.REJECTED) {
        throw new Error('Blog must be in rejected status to resubmit');
      }

      const updatedBlog = await prisma.blogs.update({
        where: { id: Number(blog_id) },
        data: { status: BlogStatus.PENDING, updated_at: new Date() },
      });

      const journalist = await getJournalistFromAuthService(journalist_id, token);
      const journalistData = journalist?.data?.user;

      if (journalistData?.email && journalistData?.name) {
        const emailPayload = {
          adminEmail: 'kietnguyen23012002@gmail.com',
          adminName: 'Admin',
          blog: {
            id: updatedBlog.id,
            title: updatedBlog.title,
            description: updatedBlog.description,
            content: updatedBlog.content,
            small_image: updatedBlog.small_image,
            short_link: updatedBlog.short_link,
            created_at: updatedBlog.created_at.toISOString(),
            updated_at: updatedBlog.updated_at.toISOString(),
            status: updatedBlog.status,
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
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch (emailErr) {
        }
      }

      return updatedBlog;
    } catch (err) {
      throw new Error(`Failed to resubmit blog: ${err.message}`);
    }
  }

  async deleteBlog(blog_id, user_id, token) {
    try {
      
      const blog = await prisma.blogs.findUnique({ where: { id: Number(blog_id) } });
      if (!blog) {
        throw new Error('Blog not found');
      }      
      const user = await getJournalistFromAuthService(user_id, token);
      const userData = user?.data?.user;
      const role = userData?.role?.rolename || 'Journalist';

      
      if (role !== 'Admin' && blog.journalist_Id !== Number(user_id)) {
        throw new Error('User not authorized to delete this blog');
      }

      
      await prisma.blogs.delete({
        where: { id: Number(blog_id) },
      });

    
      const journalist = await getJournalistFromAuthService(blog.journalist_Id, token);
      const journalistData = journalist?.data?.user;

      if (journalistData?.email && journalistData?.name) {
        const emailPayload = {
          journalistEmail: journalistData.email,
          journalistName: journalistData.name,
          blog: {
            id: blog.id,
            title: blog.title,
          },
        };
        try {
          await axios.post(
            'http://mail-service:4003/mail/auth/notifyJournalistBlogDeleted',
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }

      return { message: 'Blog deleted successfully' };
    } catch (err) {
      throw new Error(`Failed to delete blog: ${err.message}`);
    }
  }

  async getBlogs(user_id, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const blogs = await prisma.blogs.findMany({
        where: { status: BlogStatus.PUBLISHED },
        select: {
          id: true,
          title: true,
          description: true,
          small_image: true,
          short_link: true,
          reacts: {
            select: {
              user_id: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      });

      const totalBlogs = await prisma.blogs.count({ where: { status: BlogStatus.PUBLISHED } });
      const totalPages = Math.ceil(totalBlogs / limit);

      const formattedBlogs = blogs.map(blog => ({
        id: blog.id,
        title: blog.title,
        description: blog.description,
        small_image: blog.small_image,
        short_link: blog.short_link,
        hasReacted: blog.reacts.some(react => react.user_id === Number(user_id)),
        reactCount: blog.reacts.length,
      }));

      return {
        blogs: formattedBlogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalBlogs,
          itemsPerPage: limit,
        },
      };
    } catch (err) {
      throw new Error(`Failed to get blogs: ${err.message}`);
    }
  }

  async getBlogByShortLink(short_link, user_id, commentPage = 1, commentLimit = 10) {
  try {
    // Kiểm tra đầu vào
    if (!short_link || typeof short_link !== 'string') {
      throw new Error('Invalid or missing short_link');
    }
    if (!Number.isInteger(Number(user_id))) {
      throw new Error('Invalid user_id');
    }
    if (!Number.isInteger(commentPage) || commentPage < 1) {
      throw new Error('Invalid commentPage, must be a positive integer');
    }
    if (!Number.isInteger(commentLimit) || commentLimit < 1 || commentLimit > 100) {
      throw new Error('Invalid commentLimit, must be between 1 and 100');
    }

    const blog = await prisma.blogs.findFirst({
      where: { short_link, status: 'published' },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        small_image: true,
        short_link: true,
        reacts: {
          select: {
            user_id: true,
          },
        },
        reviews: {
          select: {
            id: true,
            comment: true,
            user_id: true,
            created_at: true,
          },
          where: { status: 'published' },
          skip: (commentPage - 1) * commentLimit,
          take: commentLimit,
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!blog) {
      throw new Error('Blog not found');
    }

    // Lấy danh sách user_id từ reviews
    const userIds = [...new Set(blog.reviews.map(review => review.user_id))];
    let users = [];
    if (userIds.length > 0) {
      users = await prisma.users.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          name: true,
        },
      });
    }

    // Map users để lấy user_name cho mỗi review
    const userMap = new Map(users.map(user => [user.id, user.name]));
    const comments = blog.reviews.map(review => ({
      id: review.id,
      comment: review.comment,
      user_id: review.user_id,
      user_name: userMap.get(review.user_id) || 'Unknown User',
      created_at: review.created_at.toISOString(),
    }));

    const totalComments = await prisma.blog_reviews.count({
      where: { blog_id: blog.id, status: 'published' },
    });
    const totalCommentPages = Math.ceil(totalComments / commentLimit);

    return {
      blog: {
        id: blog.id,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        small_image: blog.small_image,
        short_link: blog.short_link,
        hasReacted: blog.reacts.some(react => react.user_id === Number(user_id)),
        reactCount: blog.reacts.length,
        comments,
      },
      commentPagination: {
        currentPage: commentPage,
        totalPages: totalCommentPages,
        totalItems: totalComments,
        itemsPerPage: commentLimit,
      },
    };
  } catch (err) {
    console.error(`[BlogService.getBlogByShortLink] Error: ${err.message}`);
    throw new Error(`Failed to get blog: ${err.message}`);
  }
}

  async saveDraftBlog(journalist_id, title, description, content, small_image, short_link, token) {
    try {
      
      const existingBlog = await prisma.blogs.findFirst({
        where: { title, journalist_Id: Number(journalist_id), status: { not: BlogStatus.REJECTED } },
      });
      if (existingBlog) {
        throw new Error('Blog with this title already exists for this journalist');
      }

      
      let finalShortLink = short_link || slugify(title, { lower: true, strict: true });
      
      let counter = 1;
      let tempShortLink = finalShortLink;
      while (await prisma.blogs.findFirst({ where: { short_link: tempShortLink } })) {
        tempShortLink = `${finalShortLink}-${counter}`;
        counter++;
      }
      finalShortLink = tempShortLink;

      
      const defaultImage = 'https://example.com/default-image.jpg';
      const finalSmallImage = small_image || defaultImage;

      const blog = await prisma.blogs.create({
        data: {
          journalist_Id: Number(journalist_id),
          title,
          description,
          content,
          small_image: finalSmallImage,
          short_link: finalShortLink,
          status: BlogStatus.DRAFT,
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
      
      const existingBlog = await prisma.blogs.findFirst({
        where: { title, journalist_Id: Number(journalist_id), status: { not: BlogStatus.REJECTED } },
      });
      if (existingBlog) {
        throw new Error('Blog with this title already exists for this journalist');
      }      
      let finalShortLink = short_link || slugify(title, { lower: true, strict: true });
      
      let counter = 1;
      let tempShortLink = finalShortLink;
      while (await prisma.blogs.findFirst({ where: { short_link: tempShortLink } })) {
        tempShortLink = `${finalShortLink}-${counter}`;
        counter++;
      }
      finalShortLink = tempShortLink;

      
      const defaultImage = 'https://example.com/default-image.jpg';
      const finalSmallImage = small_image || defaultImage;

      const blog = await prisma.blogs.create({
        data: {
          journalist_Id: Number(journalist_id),
          title,
          description,
          content,
          small_image: finalSmallImage,
          short_link: finalShortLink,
          status: BlogStatus.PENDING,
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
          status: BlogReviewStatus.PUBLISHED,
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

      const user = await getUserFromAuthService(user_id, token);
      const userData = user?.data?.user;
      const journalist = await getJournalistFromAuthService(blog.journalist_Id, token);
      const journalistData = journalist?.data?.user;

      let result;
      let emailEndpoint;
      let action;

      if (existingReact) {
        await prisma.blog_react.delete({
          where: { id: existingReact.id },
        });
        result = { message: 'React removed successfully' };
        emailEndpoint = 'notifyJournalistRemoveReact';
        action = 'unlike';
      } else {
        const react = await prisma.blog_react.create({
          data: {
            blog_id: Number(blog_id),
            user_id: Number(user_id),
          },
        });
        result = react;
        emailEndpoint = 'notifyJournalistNewReact';
        action = 'like';
      }

      if (journalistData?.email && journalistData?.name && userData?.name) {
        const emailPayload = {
          journalistEmail: journalistData.email,
          journalistName: journalistData.name,
          react: {
            id: existingReact ? existingReact.id : result.id,
            created_at: (existingReact || result).created_at?.toISOString() || new Date().toISOString(),
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
            `http://mail-service:4003/mail/auth/${emailEndpoint}`,
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }

      return { result, action };
    } catch (err) {
      throw new Error(`Failed to ${existingReact ? 'remove' : 'create'} blog react: ${err.message}`);
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
      if (blog.status === BlogStatus.PUBLISHED) throw new Error('Blog already published');

      const updatedBlog = await prisma.blogs.update({
        where: { id: Number(blog_id) },
        data: { status: BlogStatus.PUBLISHED, updated_at: new Date() },
      });

      return updatedBlog;
    } catch (err) {
      throw new Error(`Failed to publish blog: ${err.message}`);
    }
  }

  async moderateBlog(blog_id, token, action) {
    try {
      const blog = await prisma.blogs.findUnique({ where: { id: Number(blog_id) } });
      if (!blog || blog.status !== BlogStatus.PENDING) {
        throw new Error('Blog not found or not pending');
      }

      const status = action === 'approve' ? BlogStatus.PUBLISHED : BlogStatus.REJECTED;
      const updatedBlog = await prisma.blogs.update({
        where: { id: Number(blog_id) },
        data: { status, updated_at: new Date() },
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
            `http://mail-service:4003/mail/auth/notifyJournalistBlog${action === 'approve' ? 'Approved' : 'Rejected'}`,
            emailPayload,
            { headers: { 'Content-Type': 'application/json' }}
          );
        } catch (emailErr) {
        }
      }

      return updatedBlog;
    } catch (err) {
      throw new Error(`Failed to ${action} blog: ${err.message}`);
    }
  }
}

export default new BlogService();