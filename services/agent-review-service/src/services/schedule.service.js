import { PrismaClient } from '@prisma/client';
import ScheduleStatus from '../enum/scheduleStatus.enum.js';
import { verifyAgent, getAssignedProperties } from '../helpers/propertyClient.js';



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

        let agent = null;
        try {
          const { isValid, agent: verifiedAgent } = await verifyAgent(property_id);
          if (isValid && verifiedAgent && verifiedAgent.email && isValidEmail(verifiedAgent.email)) {
            agent = verifiedAgent;
          } else {
            try {
              const property = await prisma.property.findUnique({
                where: { id: Number(property_id) },
                include: { agent: true },
              });
              if (property?.agent) {
                agent = {
                  id: property.agent.id,
                  email: property.agent.email,
                  name: property.agent.name,
                };
              } else {
              }
            } catch (prismaErr) {
            }
          }

          if (!agent) {
            const propertyToAgentMap = {
              2: 123,
            };
            const agentInfoMap = {
              123: { id: 123, email: 'agent@example.com', name: 'Agent Name' },
            };
            if (propertyToAgentMap[property_id]) {
              const agent_id = propertyToAgentMap[property_id];
              agent = agentInfoMap[agent_id];
            }
          }

          if (agent && agent.email && isValidEmail(agent.email)) {
            recipients.push({
              email: agent.email,
              name: agent.name || 'Agent',
            });
          }
        } catch (agentErr) {
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

          try {
            await new Promise((resolve, reject) => {
              axios.post(
                'http://mail-service:4003/mail/auth/notifyNewAppointment',
                emailPayload,
                { timeout: 30000 }
              )
                .then(() => {
                  resolve();
                })
                .catch((err) => {
                  resolve();
                });
            });
          } catch (sendErr) {
          }
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

  async getAppointments({ page , limit , status }) {
    try {
      const where = {};
      if (status && !['not_responded', 'responded'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded" or "responded"');
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
      if (status && !['not_responded', 'responded'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded" or "responded"');
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
      if (status && !['not_responded', 'responded'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded" or "responded"');
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
      if (status && !['not_responded', 'responded'].includes(status)) {
        throw new Error('Invalid status. Must be "not_responded" or "responded"');
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
