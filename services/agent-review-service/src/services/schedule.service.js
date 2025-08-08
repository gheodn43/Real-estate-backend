import { PrismaClient } from '@prisma/client';
import ScheduleStatus from '../enum/scheduleStatus.enum.js';
import { verifyAgent, getAssignedProperties } from '../helpers/propertyClient.js';



import axios from 'axios';


const prisma = new PrismaClient();

class AppointmentScheduleService {
  async createAppointment({ property_id, date, time, name, email, number_phone, message, type }) {
    try {
      console.log('createAppointment input:', { property_id, date, time, name, email, number_phone, message, type });

      if (!property_id || !date || !time || !name || !email || !number_phone || !type) {
        throw new Error('Thiếu các trường bắt buộc');
      }
      if (!['directly', 'video_chat'].includes(type)) {
        throw new Error('Loại cuộc hẹn không hợp lệ. Phải là "directly" hoặc "video_chat"');
      }

      const startTime = new Date(`${date}T${time}:00`);
      console.log('startTime:', startTime);
      if (isNaN(startTime.getTime())) {
        throw new Error('Định dạng ngày hoặc giờ không hợp lệ');
      }

      console.log('Creating appointment in Prisma...');
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
      console.log('Appointment created:', appointment);

      if (appointment.type === 'directly') {
        console.log('Processing email for direct appointment...');
        const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const ADMIN_EMAILS = ['kietnguyen23012002@gmail.com'];
        console.log('ADMIN_EMAILS:', ADMIN_EMAILS);

        const recipients = [];
        ADMIN_EMAILS.forEach((adminEmail) => {
          if (isValidEmail(adminEmail)) {
            recipients.push({ email: adminEmail, name: 'Admin' });
          }
        });

        let agent = null;
        try {
          console.log('Calling verifyAgent for property_id:', property_id);
          const { isValid, agent: verifiedAgent } = await verifyAgent(property_id);
          console.log('verifyAgent result:', { isValid, agent: verifiedAgent });
          if (isValid && verifiedAgent && verifiedAgent.email && isValidEmail(verifiedAgent.email)) {
            agent = verifiedAgent;
            console.log('Agent found via API:', agent);
          } else {
            console.log('No valid agent found via API, falling back to Prisma...');
            try {
              const property = await prisma.property.findUnique({
                where: { id: Number(property_id) },
                include: { agent: true },
              });
              console.log('Prisma property query result:', property);
              if (property?.agent) {
                agent = {
                  id: property.agent.id,
                  email: property.agent.email,
                  name: property.agent.name,
                };
                console.log('Agent from Prisma:', agent);
              } else {
                console.log('No agent found in Prisma for property_id:', property_id);
              }
            } catch (prismaErr) {
              console.log('Prisma error:', prismaErr.message);
            }
          }

          if (!agent) {
            console.log('Falling back to static mapping...');
            const propertyToAgentMap = {
              2: 123,
            };
            const agentInfoMap = {
              123: { id: 123, email: 'agent@example.com', name: 'Agent Name' },
            };
            if (propertyToAgentMap[property_id]) {
              const agent_id = propertyToAgentMap[property_id];
              agent = agentInfoMap[agent_id];
              console.log('Agent from static mapping:', agent);
            }
          }

          if (agent && agent.email && isValidEmail(agent.email)) {
            recipients.push({
              email: agent.email,
              name: agent.name || 'Agent',
            });
          }
        } catch (agentErr) {
          console.log('Error finding agent:', agentErr.message);
        }

        console.log('Recipients:', recipients);
        if (recipients.length === 0) {
          console.log('No valid recipients, skipping email');
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
          console.log('Preparing to send email to:', recipient.email);

          try {
            await new Promise((resolve, reject) => {
              axios.post(
                'http://mail-service:4003/mail/auth/notifyNewAppointment',
                emailPayload,
                { timeout: 30000 }
              )
                .then(() => {
                  console.log('Email sent to:', recipient.email);
                  resolve();
                })
                .catch((err) => {
                  console.log('Error sending email to:', recipient.email, err.message);
                  resolve();
                });
            });
          } catch (sendErr) {
            console.log('Error in email sending loop:', sendErr.message);
          }
        }
      }

      return appointment;
    } catch (err) {
      console.log('Error creating appointment:', err.message);
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
