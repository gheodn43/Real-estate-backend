import { PrismaClient } from '@prisma/client';
import ScheduleStatus from '../enum/scheduleStatus.enum.js';
import {getAssignedProperties, getAgentAssignedForProperty } from '../helpers/propertyClient.js';




import axios from 'axios';


const prisma = new PrismaClient();

class AppointmentScheduleService {
  async createAppointment({ property_id, date, time, name, email, number_phone, message, type }) {
    try {
      if (!property_id || !date || !time || !name || !email || !number_phone || !type) {
        throw new Error('Thiếu các trường bắt buộc');
      }
      if (!['directly', 'video_chat'].includes(type)) {
        throw new Error('Loại cuộc hẹn không hợp lệ. Phải là "directly" hoặc "video_chat"');
      }

      const startTime = new Date(`${date}T${time}:00`);
      if (isNaN(startTime.getTime())) {
        throw new Error('Định dạng ngày hoặc giờ không hợp lệ');
      }

      const appointment = await prisma.appointment_schedule.create({
        data: {
          property_id: Number(property_id),
          date: this.convertStringToDate(date),
          time,
          name,
          email,
          number_phone,
          message,
          type,
          status: ScheduleStatus.not_responded,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      if (appointment.type === 'directly') {
        const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const ADMIN_EMAILS = ['kietnguyen23012002@gmail.com'];

        const recipients = [];
        ADMIN_EMAILS.forEach((adminEmail) => {
          if (isValidEmail(adminEmail)) {
            recipients.push({ email: adminEmail, name: 'Admin' });
          }
        });


          const agentData = await getAgentAssignedForProperty(property_id);
          const agent = agentData.agent;

        if (agent && agent.email && isValidEmail(agent.email)) {
          recipients.push({
            email: agent.email,
            name: agent.name || 'Agent',
          });
        }

        if (recipients.length === 0) {
          return appointment;
        }

        for (const recipient of recipients) {
          const emailPayload = {
            appointment: {
              user: {
                email: recipient.email,
                name: recipient.name,
                number_phone: number_phone || 'N/A',
              },
              property: {
                id: property_id,
                name: `Property ${property_id}`,
              },
              date,
              time,
              message,
              type,
              start_time: startTime.toISOString(),
              customer_name: name,
              customer_email: email,
            },
            recipient_email: recipient.email,
          };

          await new Promise((resolve, reject) => {
            axios.post(
              'http://mail-service:4003/mail/auth/notifyNewAppointment',
              emailPayload,
              { timeout: 30000 }
            )
              .then(() => resolve())
              .catch(() => resolve());
          });
        }
      }

      return appointment;
    } catch (err) {
      throw new Error('Không thể tạo cuộc hẹn: ' + err.message);
    }
  }

  convertStringToDate(stringDate) {
    const date = new Date(stringDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  }

  async getAppointments({ page , limit , status, search, type }) {

    try {
      const where = {};
      if (status && !['not_responded', 'responded'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded" or "responded"');
      }
      if (status) {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { number_phone: { contains: search } },
          { email: { contains: search } },
          { message: { contains: search } },
        ];
      }
      if (type) {
        where.type = type;
      }

      const appointments = await prisma.appointment_schedule.findMany({
        where,
        select: {
          id: true,
          name: true,
          number_phone: true,
          status: true,
          property_id: true,
          message: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
      });
      return appointments;
    } catch (err) {
      throw new Error('Failed to get appointments: ' + err.message);
    }
  }

  async getAgentAppointments({ agent_id, token, page , limit , status, search, type }) {


    try {
      if (!prisma) {
        throw new Error('Prisma client is not initialized');
      }
      if (!agent_id || isNaN(Number(agent_id))) {
        throw new Error('Invalid agent_id');
      }
      const propertyIds = await getAssignedProperties(agent_id, token);
      if (propertyIds.length === 0) {
        throw new Error('Agent does not have any properties');
      }

      const where = {
        property_id: { in: propertyIds },
      };
      if (status && !['not_responded', 'responded'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded" or "responded"');
      }
      if (status) {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { number_phone: { contains: search } },
          { email: { contains: search } },
          { message: { contains: search } },
        ];
      }
      if (type) {
        where.type = type;
      }
      const appointments = await prisma.appointment_schedule.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
      });
      const total = await prisma.appointment_schedule.count({
        where,
      });
      return {appointments, total};
    } catch (err) {
      throw new Error('Failed to get agent appointments: ' + err.message);
    }
  }

  async getPropertyAppointments({ property_id, page = 1, limit = 10, status, search, type }) {
  try {
    // Validate input parameters
    
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Invalid page number: Must be a positive integer');
    }
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error('Invalid limit: Must be a positive integer');
    }
    if (status && !['not_responded', 'responded'].includes(status)) {
      throw new Error('Invalid status: Must be "not_responded" or "responded"');
    }
    if (type && !['directly', 'video_chat'].includes(type)) { // Dựa trên Swagger
      throw new Error('Invalid type: Must be "directly" or "video_chat"');
    }

    // Xây dựng điều kiện where
    const where = {
      property_id: Number(property_id),
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { number_phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    // Query appointments
    const appointments = await prisma.appointment_schedule.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: Number(limit),
    });

    // Đếm tổng số appointment
    const total = await prisma.appointment_schedule.count({
      where,
    });

    // Trả về kết quả với phân trang
    const result = {
      appointments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };

    console.log('Result of getPropertyAppointments:', result);
    return result;
  } catch (err) {
    console.error('Error in getPropertyAppointments:', err.message, err.stack);
    throw new Error(`Failed to get property appointments: ${err.message}`);
  }
}

  async getAgentAllAppointments({ agent_id, token, page , limit , status, search, type }) {
    try {
      if (!prisma) {
        throw new Error('Prisma client is not initialized');
      }
      if (!agent_id || isNaN(Number(agent_id))) {
        throw new Error('Invalid agent_id');
      }
      // Lấy danh sách property_id từ property-service
      const propertyIds = await getAssignedProperties(agent_id, token);
 
      const where = {
        property_id: { in: propertyIds },
      };
      if (status && !['not_responded', 'responded'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded" or "responded"');
      }
      if (status) {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { number_phone: { contains: search } },
          { email: { contains: search } },
          { message: { contains: search } },
        ];
      }
      if (type) {
        where.type = type;
      }


      const appointments = await prisma.appointment_schedule.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
      });
      const total = await prisma.appointment_schedule.count({
        where,
      });
      return {appointments, total};
    } catch (err) {
      throw new Error('Failed to get all agent appointments: ' + err.message);
    }
  }
 
  async respondAppointment({ appointment_id, response }) {
    try {
      if (!prisma) {
        throw new Error('Prisma client is not initialized');
      }
      if (!response) {
        throw new Error('Response is required');
      }
      const appointment = await prisma.appointment_schedule.findUnique({
        where: { id: Number(appointment_id) }
      });
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const updatedAppointment = await prisma.appointment_schedule.update({
        where: { id: Number(appointment_id) },
        data: {
          response,
          status: 'responded',
          updated_at: new Date()
        }
      });

      return updatedAppointment;
    } catch (err) {
      throw new Error('Failed to respond to appointment: ' + err.message);
    }
  }

  async deleteAppointment({ appointment_id, user_id, user_role }) {
    try {
      if (!prisma) {
        throw new Error('Prisma client is not initialized');
      }
      const appointment = await prisma.appointment_schedule.findUnique({
        where: { id: Number(appointment_id) }
      });
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      return await prisma.appointment_schedule.update({
        where: { id: Number(appointment_id) },
        data: { status: 'hidden', updated_at: new Date() }
      });
    } catch (err) {
      throw new Error('Failed to delete appointment: ' + err.message);
    }
  }
}

export default new AppointmentScheduleService();
