import appointmentScheduleService from '../services/schedule.service.js';
import { RoleName } from '../middleware/roleGuard.js';
import { verifyAgent } from '../helpers/propertyClient.js';


class AppointmentScheduleController {
  constructor() {
    this.createAppointment = this.createAppointment.bind(this);
    this.getAppointments = this.getAppointments.bind(this);
    this.getAgentAppointments = this.getAgentAppointments.bind(this);
    this.getPropertyAppointments = this.getPropertyAppointments.bind(this);
    this.getAgentAllAppointments = this.getAgentAllAppointments.bind(this);
    this.respondAppointment = this.respondAppointment.bind(this);
    this.deleteAppointment = this.deleteAppointment.bind(this);
  }

  async createAppointment(req, res) {
    try {
      const { property_id, date, time, name, email, number_phone, message, type } = req.body;
      if (!property_id || !date || !time || !name || !email || !number_phone || !type) {
        return res.status(400).json({
          data: null,
          message: 'Missing required fields',
          errors: ['property_id, date, time, name, email, number_phone, and type are required'],
        });
      }
      const appointment = await appointmentScheduleService.createAppointment({
        property_id,
        date,
        time,
        name,
        email,
        number_phone,
        message,
        type,
      });
      res.status(201).json({
        data: { appointment },
        message: 'Create appointment successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(400).json({
        data: null,
        message: 'Create appointment failed',
        errors: [err.message],
      });
    }
  }

  async getAppointments(req, res) {
    try {
      const { page, limit, status } = req.query;
      const appointments = await appointmentScheduleService.getAppointments({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status,
      });
      res.status(200).json({
        data: { appointments },
        message: 'Get appointments successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(400).json({
        data: { appointments: null },
        message: 'Get appointments failed',
        errors: [err.message],
      });
    }
  }

  async getAgentAppointments(req, res) {
    try {
      const { page, limit, status} = req.query;
      const agent_id = Number(req.user.userId);
      const token = req.token; // Lấy token từ req.token

      const {appointments, total} = await appointmentScheduleService.getAgentAppointments({
        agent_id,
        token,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status,
      });
      return res.status(200).json({
        data: { 
          appointments: appointments,
          pagination:{
            total: total,
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            totalPages: Math.ceil(total / (Number(limit))),
          }
        },
        message: 'Get agent appointments successfully',
        error: [],
      });
    } catch (err) {
      return res.status(400).json({
        data: { appointments: null },
        message: 'Failed to get agent appointments',
        error: [err.message],
      });
    }
  }

  async getPropertyAppointments(req, res) {
    try {
      const { property_id } = req.params;
      const { page, limit, status } = req.query;
      const agent_id = Number(req.user.userId);
      const token = req.token;
      // nếu userRole = admin thì cho phép truy cập
      if (req.user.userRole === RoleName.Agent) {
        const isAgentAuthorized = await verifyAgent(property_id, token);
        if (!isAgentAuthorized) {
          return res.status(403).json({
            data: { appointments: null },
            message: 'Permission denied',
            error: ['Agent is not authorized to access this property'],
          });
        }
      }
      const {appointments, total} = await appointmentScheduleService.getPropertyAppointments({
        property_id,
        agent_id,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status,
      });
      return res.status(200).json({
        data: { 
          appointments: appointments,
          pagination:{
            total: total,
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            totalPages: Math.ceil(total / (Number(limit))),
          }
        },
        message: 'Get property appointments successfully',
        error: [],
      });
    } catch (err) {
      return res.status(400).json({
        data: { appointments: null },
        message: 'Failed to get property appointments',
        error: [err.message],
      });
    }
  }

  async getAgentAllAppointments(req, res) {
    try {
      const { agent_id, page, limit, status } = req.query;
      const agentIdNum = Number(agent_id);
      const token = req.token; // Lấy token từ req.token
      if (!agent_id || isNaN(agentIdNum)) {
        return res.status(400).json({
          data: { appointments: null },
          message: 'Invalid or missing agent_id',
          error: ['agent_id must be a valid number'],
        });
      }
      if (!token) {
        return res.status(401).json({
          data: { appointments: null },
          message: 'Token is required',
          error: ['Authentication token is missing'],
        });
      }
      const {appointments, total} = await appointmentScheduleService.getAgentAllAppointments({
        agent_id: agentIdNum,
        token,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status,
      });
      return res.status(200).json({
        data: { 
          appointments: appointments,
          pagination:{
            total: total,
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            totalPages: Math.ceil(total / (Number(limit))),
          }
        },
        message: 'Get all agent appointments successfully',
        error: [],
      });
    } catch (err) {
      return res.status(400).json({
        data: { appointments: null },
        message: 'Failed to get all agent appointments',
        error: [err.message],
      });
    }
  }

  async respondAppointment(req, res) {
    try {
      const { appointment_id } = req.params;
      const { response } = req.body;
      if (!appointment_id || !response) {
        return res.status(400).json({
          data: { appointment: null },
          message: 'Invalid or missing appointment_id or response',
          errors: ['appointment_id and response are required'],
        });
      }
      const appointment = await appointmentScheduleService.respondAppointment({
        appointment_id,
        response,
      });
      res.status(200).json({
        data: { appointment },
        message: 'Respond to appointment successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(400).json({
        data: { appointment: null },
        message: 'Respond to appointment failed',
        errors: [err.message],
      });
    }
  }

  async deleteAppointment(req, res) {
    try {
      const { appointment_id } = req.params;
      const user_id = Number(req.user.userId);
      const user_role = Number(req.user.userRole);
      if (!appointment_id || !user_id) {
        return res.status(400).json({
          data: { appointment: null },
          message: 'Invalid or missing appointment_id or user_id',
          errors: ['appointment_id and user_id are required'],
        });
      }
      const appointment = await appointmentScheduleService.deleteAppointment({
        appointment_id,
        user_id,
        user_role,
      });
      res.status(200).json({
        data: { appointment },
        message: 'Delete appointment successfully',
        errors: [],
      });
    } catch (err) {
      return res.status(400).json({
        data: { appointment: null },
        message: 'Delete appointment failed',
        errors: [err.message],
      });
    }
  }
}

export default new AppointmentScheduleController();
