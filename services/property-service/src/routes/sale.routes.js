import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';
import saleService from '../services/sale.service.js';
import { getPublicAgentInfor } from '../helpers/authClient.js';
import { sendMailToAgents } from '../helpers/mailClient.js';

/**
 * @openapi
 * /prop/sale/list-agent-in-month:
 *   get:
 *     tags:
 *       - Sale
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy danh sách BĐS đã hoàn tất giao dịch trong tháng của một agent [ADMIN, AGENT]
 *     description:
 *       API dành cho Admin, trả về danh sách BĐS đã hoàn tất giao dịch trong khoảng thời gian (theo tháng lương hiện tại) của một agent.
 *       Sử dụng hàm `getStartDateAndEndDateInThisMonth()` để xác định khoảng thời gian.
 *     parameters:
 *       - in: query
 *         name: mooc_date
 *         required: false
 *         schema:
 *           type: string
 *           example: "07/07/2025"
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Tìm kiếm thông tin user email, name, sđt
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (pagination).
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang.
 *     responses:
 *       200:
 *         description: Thành công - Trả về danh sách BĐS đã hoàn tất giao dịch trong tháng.
 *       400:
 *         description: Thiếu agent_id hoặc dữ liệu không hợp lệ.
 *       401:
 *         description: Unauthorized - Chưa đăng nhập hoặc không có quyền Admin.
 *       500:
 *         description: Server error.
 */
router
  .route('/list-agent-in-month')
  .get(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    const { mooc_date, search, page = 1, limit = 10 } = req.query;
    const bonusMonth = await getCustomCurrentMonth(mooc_date);
    const { start_date, end_date } =
      getStartDateAndEndDateByMonthString(bonusMonth);

    try {
      const pagination = {
        page: Number(page),
        limit: Number(limit),
      };
      const filters = {
        bonusMonth,
        start_date,
        end_date,
        search,
      };
      const { total, results, sentMailForAll } =
        await saleService.getListAgentAndOverviewTransactionInMonth(
          filters,
          pagination
        );
      if (results.length === 0) {
        return res.status(404).json({
          data: null,
          message: 'Not found',
          error: [],
        });
      }
      return res.status(200).json({
        data: {
          bonus_time: {
            month: bonusMonth,
            from: start_date,
            to: end_date,
          },
          agents: results,
          sent_mail_for_all: sentMailForAll,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
        message: 'Success',
        error: [],
      });
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: 'Server error',
        error: [err.message],
      });
    }
  });

/**
 * @openapi
 * /prop/sale/send-to-all-agent:
 *   post:
 *     tags:
 *       - Sale
 *     security:
 *       - bearerAuth: []
 *     summary: Gửi mail hàng loạt [ADMIN]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 example: "07/2025"
 *     responses:
 *       200:
 *         description: Thành công.
 *       400:
 *         description: Thiếu agent_id hoặc dữ liệu không hợp lệ.
 *       401:
 *         description: Unauthorized - Chưa đăng nhập hoặc không có quyền Admin.
 *       500:
 *         description: Server error.
 */
router
  .route('/send-to-all-agent')
  .post(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    const { month } = req.body;
    const { start_date, end_date } = getStartDateAndEndDateByMonthString(month);
    const { total, agentCommissions } =
      await saleService.getAgentAndThemTransactionInfoNeededSendMail(
        month,
        start_date,
        end_date
      );
    if (agentCommissions.length > 0) {
      sendMailToAgents(agentCommissions);
      return res.status(200).json({
        data: { total, agentCommissions },
        message: '',
        error: ['Oke! thành công'],
      });
    }
    return res.status(400).json({
      data: null,
      message: '',
      error: ['Đã gửi tất cả mail trước đó'],
    });
  });

/**
 * @openapi
 * /prop/sale/of-agent-in-month:
 *   get:
 *     tags:
 *       - Sale
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy danh sách BĐS đã hoàn tất giao dịch trong tháng của một agent [ADMIN, AGENT]
 *     description:
 *       API dành cho Admin, trả về danh sách BĐS đã hoàn tất giao dịch trong khoảng thời gian (theo tháng lương hiện tại) của một agent.
 *       Sử dụng hàm `getStartDateAndEndDateInThisMonth()` để xác định khoảng thời gian.
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 12
 *         description: ID của agent cần lấy dữ liệu.
 *       - in: query
 *         name: mooc_date
 *         required: false
 *         schema:
 *           type: string
 *           example: "07/07/2025"
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tiêu đề BĐS (title).
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (pagination).
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang.
 *     responses:
 *       200:
 *         description: Thành công - Trả về danh sách BĐS đã hoàn tất giao dịch trong tháng.
 *       400:
 *         description: Thiếu agent_id hoặc dữ liệu không hợp lệ.
 *       401:
 *         description: Unauthorized - Chưa đăng nhập hoặc không có quyền Admin.
 *       500:
 *         description: Server error.
 */
router
  .route('/of-agent-in-month')
  .get(
    authMiddleware,
    roleGuard([RoleName.Admin, RoleName.Agent]),
    async (req, res) => {
      const userRole = req.user.userRole;
      const { agent_id, mooc_date, search, page, limit } = req.query;
      const bonusMonth = await getCustomCurrentMonth(mooc_date);
      const { start_date, end_date } =
        getStartDateAndEndDateByMonthString(bonusMonth);
      let agentId = agent_id;
      if (userRole == RoleName.Agent && agent_id) {
        return res.status(400).json({
          data: null,
          message: '',
          error: ['Ditme mi không thể xem lịch sử của agent khác'],
        });
      }
      if (userRole == RoleName.Agent) {
        agentId = req.user.userId;
      }
      try {
        await getCompleteTransactionOfAgentInMonth(
          start_date,
          end_date,
          bonusMonth,
          agentId,
          search,
          page,
          limit,
          res
        );
      } catch (err) {
        return res.status(500).json({
          data: null,
          message: 'Server error',
          error: [err.message],
        });
      }
    }
  );

/**
 * @openapi
 * /prop/sale/bonus:
 *   post:
 *     tags:
 *       - Sale
 *     security:
 *       - bearerAuth: []
 *     summary: Tạo thông tin thưởng/phạt cho Agent [ADMIN]
 *     description: |
 *       API cho phép Admin TẠO MỚI thông tin thưởng, phạt và review cho một Agent trong kỳ thanh toán.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agent_id
 *               - buying_quantity
 *               - rental_quantity
 *               - total_buying_commission
 *               - total_rental_commission
 *               - bonus
 *               - penalty
 *               - review
 *               - bonus_of_month
 *             properties:
 *               agent_id:
 *                 type: integer
 *                 example: 11
 *                 description: id của agent
 *               buying_quantity:
 *                 type: integer
 *                 example: 3
 *                 description: Số lượng giao dịch mua trong tháng.
 *               rental_quantity:
 *                 type: integer
 *                 example: 2
 *                 description: Số lượng giao dịch thuê trong tháng.
 *               total_buying_commission:
 *                 type: number
 *                 format: float
 *                 example: 15000000
 *                 description: Tổng tiền hoa hồng từ giao dịch mua.
 *               total_rental_commission:
 *                 type: number
 *                 format: float
 *                 example: 5000000
 *                 description: Tổng tiền hoa hồng từ giao dịch thuê.
 *               bonus:
 *                 type: number
 *                 format: float
 *                 example: 2000000
 *                 description: Khoản tiền thưởng cho agent.
 *               penalty:
 *                 type: number
 *                 format: float
 *                 example: 500000
 *                 description: Khoản tiền phạt cho agent.
 *               review:
 *                 type: string
 *                 example: "Agent đã làm việc hiệu quả trong tháng 7."
 *                 description: Nhận xét/đánh giá về agent.
 *               bonus_of_month:
 *                 type: string
 *                 example: "07/2025"
 *     responses:
 *       200:
 *         description: Thành công - Đã ghi nhận thông tin thưởng/phạt.
 *       400:
 *         description: Thiếu hoặc sai dữ liệu trong request.
 *       401:
 *         description: Unauthorized - Chưa đăng nhập hoặc không có quyền Admin.
 *       500:
 *         description: Server error.
 */
router
  .route('/bonus')
  .post(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    const {
      agent_id,
      buying_quantity,
      rental_quantity,
      total_buying_commission,
      total_rental_commission,
      bonus,
      penalty,
      review,
      bonus_of_month,
    } = req.body;
    const review_by = req.user.userId;
    try {
      await saleService.initSaleBonus({
        agent_id,
        buying_quantity,
        rental_quantity,
        total_buying_commission,
        total_rental_commission,
        bonus,
        penalty,
        review,
        review_by,
        bonus_of_month,
      });
      const agent = getPublicAgentInfor(Number(agent_id));
      console.log('gọi hàm gửi mail cho agent?', {
        agent,
      });

      return res.status(200).json({
        data: null,
        message: 'Success',
        error: [],
      });
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: 'Server error',
        error: [err.message],
      });
    }
  });

/**
 * @openapi
 * /prop/sale/mine-history:
 *   get:
 *     tags:
 *       - Sale
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy lịch sử thưởng/phat của agent [AGENT]
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "01/07/2025"
 *         description: Ngày bắt đầu lọc (dd/MM/yyyy). Nếu có start_date mà không có end_date → end_date mặc định là hôm nay.
 *       - in: query
 *         name: end_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "31/07/2025"
 *         description: Ngày kết thúc lọc (dd/MM/yyyy). Nếu có end_date mà không có start_date → start_date mặc định là 01/01/2020.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (pagination).
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi trên mỗi trang.
 *     responses:
 *       200:
 *         description: Thành công - Trả về danh sách lịch sử thưởng/phạt của agent hiện tại.
 *       401:
 *         description: Unauthorized - Agent chưa đăng nhập hoặc token không hợp lệ.
 *       500:
 *         description: Lỗi server.
 */
router
  .route('/mine-history')
  .get(authMiddleware, roleGuard([RoleName.Agent]), async (req, res) => {
    const { start_date, end_date, page, limit } = req.query;
    const agent_id = req.user.userId;
    try {
      await getSaleBonusHistoryOfAgent(
        parseClientDate(start_date),
        parseClientDate(end_date),
        agent_id,
        page,
        limit,
        res
      );
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: 'Server error',
        error: [err.message],
      });
    }
  });

/**
 * @openapi
 * /prop/sale/history-of-agent:
 *   get:
 *     tags:
 *       - Sale
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy lịch sử thưởng/phạt của một agent bất kỳ [ADMIN]
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 11
 *         description: ID của agent cần lấy dữ liệu.
 *       - in: query
 *         name: start_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "01/07/2025"
 *         description: Ngày bắt đầu lọc (dd/MM/yyyy). Nếu có start_date mà không có end_date → end_date mặc định là hôm nay.
 *       - in: query
 *         name: end_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "31/07/2025"
 *         description: Ngày kết thúc lọc (dd/MM/yyyy). Nếu có end_date mà không có start_date → start_date mặc định là 01/01/2020.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (pagination).
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi trên mỗi trang.
 *     responses:
 *       200:
 *         description: Thành công - Trả về danh sách lịch sử thưởng/phạt của agent được chỉ định.
 *       400:
 *         description: Thiếu hoặc sai dữ liệu (ví dụ thiếu agent_id).
 *       401:
 *         description: Unauthorized - Chưa đăng nhập hoặc không có quyền Admin.
 *       500:
 *         description: Lỗi server.
 */
router
  .route('/history-of-agent')
  .get(authMiddleware, roleGuard([RoleName.Admin]), async (req, res) => {
    const { start_date, end_date, agent_id, page, limit } = req.query;
    try {
      await getSaleBonusHistoryOfAgent(
        parseClientDate(start_date),
        parseClientDate(end_date),
        agent_id,
        page,
        limit,
        res
      );
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: 'Server error',
        error: [err.message],
      });
    }
  });

/**
 * @openapi
 * /prop/sale/{id}:
 *   get:
 *     tags:
 *       - Sale
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy thông tin chi tiết thưởng/phạt [Admin, Agent]
 *     description: API cho phép **Admin** lấy chi tiết một bản ghi thưởng/phạt của agent theo `id`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 15
 *         description: ID của bản ghi thưởng/phạt cần lấy.
 *     responses:
 *       200:
 *         description: Thành công - Trả về thông tin chi tiết của bản ghi Sale Bonus.
 *       404:
 *         description: Không tìm thấy dữ liệu với ID đã cho.
 *       401:
 *         description: Unauthorized - Token không hợp lệ hoặc user không có quyền Admin.
 *       500:
 *         description: Lỗi server.
 */
router
  .route('/:id')
  .get(
    authMiddleware,
    roleGuard([RoleName.Admin, RoleName.Agent]),
    async (req, res) => {
      const { id } = req.params;
      try {
        const result = await saleService.getOneBonusHistoryOfAgent(id);
        if (!result) {
          return res.status(404).json({
            data: null,
            message: 'Not found',
            error: [],
          });
        }
        const agent = await getPublicAgentInfor(result.agent_id);
        return res.status(200).json({
          data: {
            agent: agent,
            bonus: result,
          },
          message: 'Success',
          error: [],
        });
      } catch (err) {
        return res.status(500).json({
          data: null,
          message: 'Server error',
          error: [err.message],
        });
      }
    }
  );

const getCompleteTransactionOfAgentInMonth = async (
  start_date,
  end_date,
  bonusMonth,
  agent_id,
  search,
  page,
  limit,
  res
) => {
  const pagination = {
    page: Number(page),
    limit: Number(limit),
  };
  const filters = {
    agent_id: Number(agent_id),
    start_date,
    end_date,
    search,
    bonusMonth,
  };
  const { total, results, sent_mail } =
    await saleService.getCompleteTransactionOfAgentInMonth(filters, pagination);
  if (results.length === 0) {
    return res.status(404).json({
      data: null,
      message: 'Not found',
      error: [],
    });
  }
  const agent = await getPublicAgentInfor(agent_id);
  console.log(
    'gọi hàm kiểm tra trạng thái đã khởi tạo thưởng/phạt chưa?',
    bonusMonth
  );
  return res.status(200).json({
    data: {
      bonus_time: {
        month: bonusMonth,
        from: start_date,
        to: end_date,
      },
      sent_mail: sent_mail,
      agent,
      transaction: results,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
    message: 'Success',
    error: [],
  });
};
const getSaleBonusHistoryOfAgent = async (
  start_date,
  end_date,
  agent_id,
  page,
  limit,
  res
) => {
  const pagination = {
    page: Number(page),
    limit: Number(limit),
  };
  const filters = {
    agent_id: Number(agent_id),
    start_date,
    end_date,
  };
  const { total, results } = await saleService.getBonusHistoryOfAgent(
    filters,
    pagination
  );
  if (results.length === 0) {
    return res.status(404).json({
      data: null,
      message: 'Not found',
      error: [],
    });
  }
  const agent = await getPublicAgentInfor(agent_id);
  return res.status(200).json({
    data: {
      agent,
      bonus: results,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
    message: 'Success',
    error: [],
  });
};
const getStartDateAndEndDateByMonthString = (monthString) => {
  if (!monthString) return undefined;

  const [month, year] = monthString.split('/').map(Number);

  const startDate = new Date(year, month - 1, 6, 0, 0, 0); // Ngày 6 tháng đó
  const endDate = new Date(year, month, 5, 23, 59, 59); // Ngày 5 tháng sau

  return { start_date: startDate, end_date: endDate };
};

const parseClientDate = (dateString) => {
  if (!dateString) return undefined;
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0);
};

const getCustomCurrentMonth = async (dateString) => {
  let dateObj;

  if (!dateString) {
    dateObj = new Date();
  } else {
    const [day, month, year] = dateString.split('/').map(Number);
    dateObj = new Date(year, month - 1, day);
  }

  const day = dateObj.getDate();
  let month = dateObj.getMonth() + 1; // JS month 0-based
  let year = dateObj.getFullYear();

  if (day >= 4 && day <= 12) {
    // Lùi về tháng trước
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return `${String(month).padStart(2, '0')}/${year}`;
};

export default router;
