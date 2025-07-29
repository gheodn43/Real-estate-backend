import { PrismaClient } from '@prisma/client';
import ScheduleStatus from '../enum/scheduleStatus.enum.js';
import { getAssignedProperties } from '../helpers/propertyClient.js';
import axios from 'axios';


const prisma = new PrismaClient();

class AppointmentScheduleService {
  async createAppointment({ property_id, date, time, name, email, number_phone, message, type }) {
  try {
    if (!property_id || !date || !time || !name || !email || !number_phone || !type) {
      throw new Error('Missing required fields');
    }
    if (!['directly', 'video_chat'].includes(type)) {
      throw new Error('Invalid type. Must be "directly" or "video_chat"');
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
      try {
        // Lấy thông tin Agent từ property-service
        console.log('Fetching agent from property-service...');
        const agentResponse = await axios.get(
          `http://property-service:4002/prop/post/${appointment.property_id}/verify-agent`,
         
        );
        const agent = agentResponse.data;
        console.log('Agent fetched:', agent);

        // Chuẩn bị payload cho notifyNewAppointment
        const emailPayload = {
          appointment: {
            user: {
              email: agent.email,
              name: agent.name || 'Agent',
            },
            property: {
              name: `Property ${appointment.property_id}`, // Giả định tên bất động sản
            },
          },
        };
        console.log('Sending email to agent with payload:', emailPayload);

        // Gọi HTTP tới mail-service
        await axios.post(
          'http://mail-service:4003/mail/auth/notifyNewAppointment',
          emailPayload,
        );
        console.log('Notification email sent to agent:', agent.email);
      } catch (emailErr) {
        console.error('Failed to send email notification:', emailErr.message, emailErr.stack);
      }
    }

    return appointment;
  } catch (err) {
    console.error('Create appointment error:', err.message, err.stack);
    throw new Error('Failed to create appointment: ' + err.message);
  }
}

  convertStringToDate(stringDate) {
    const date = new Date(stringDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  }

  async getAppointments({ page , limit , status }) {
    try {
      const where = {};
      if (status && !['not_responded', 'responded', 'hidden'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded", "responded", or "hidden"');
      }
      if (status) {
        where.status = status;
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

  async getAgentAppointments({ agent_id, token, page , limit , status }) {
    try {
      if (!prisma) {
        throw new Error('Prisma client is not initialized');
      }
      if (!agent_id || isNaN(Number(agent_id))) {
        throw new Error('Invalid agent_id');
      }
      const propertyIds = await getAssignedProperties(agent_id, token);


      const where = {
        property_id: { in: [2] },
      };
      if (status && !['not_responded', 'responded', 'hidden'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded", "responded", or "hidden"');
      }
      if (status) {
        where.status = status;
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
      console.log(total);
      return {appointments, total};
    } catch (err) {
      throw new Error('Failed to get agent appointments: ' + err.message);
    }
  }

  async getPropertyAppointments({ property_id, agent_id, page, limit, status }) {
    try {

      if (!property_id || isNaN(Number(property_id)) || !agent_id || isNaN(Number(agent_id))) {
        throw new Error('Invalid property_id or agent_id');
      }
      const where = {
        property_id: Number(property_id),
      };
      if (status && !['not_responded', 'responded', 'hidden'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded", "responded", or "hidden"');
      }
      if (status) {
        where.status = status;
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
      throw new Error('Failed to get property appointments: ' + err.message);
    }
  }

  async getAgentAllAppointments({ agent_id, token, page , limit , status }) {
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
      if (status && !['not_responded', 'responded', 'hidden'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded", "responded", or "hidden"');
      }
      if (status) {
        where.status = status;
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
