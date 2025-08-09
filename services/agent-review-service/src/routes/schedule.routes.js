import { Router } from 'express';
import AppointmentScheduleController from '../controllers/schedule.controller.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import roleGuard, { RoleName } from '../middleware/roleGuard.js';


const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         property_id:
 *           type: integer
 *         date:
 *           type: string
 *           format: date-time
 *         time:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         number_phone:
 *           type: string
 *         message:
 *           type: string
 *           nullable: true
 *         response:
 *           type: string
 *           nullable: true
 *         type:
 *           type: string
 *           enum: [directly, video_chat]
 *         status:
 *           type: string
 *           enum: [not_responded, responded, hidden]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     AppointmentSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         number_phone:
 *           type: string
 *         status:
 *           type: string
 *           enum: [not_responded, responded, hidden]
 *         property_id:
 *           type: integer
 *         message:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /review/schedule:
 *   post:
 *     summary: Create a new appointment [All Role]
 *     tags: [Appointments]
 *     description: Allows users to create a new appointment without authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - property_id
 *               - date
 *               - time
 *               - name
 *               - email
 *               - number_phone
 *               - type
 *             properties:
 *               property_id:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               number_phone:
 *                 type: string
 *               message:
 *                 type: string
 *                 nullable: true
 *               type:
 *                 type: string
 *                 enum: [directly, video_chat]
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Failed to create appointment
 */
router.post('/', AppointmentScheduleController.createAppointment);

/**
 * @swagger
 * /review/schedule:
 *   get:
 *     summary: Get list of appointments [Admin]
 *     tags: [Appointments]
 *     description: Allows admins to retrieve a paginated list of appointments, optionally filtered by status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_responded, responded, hidden]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [directly, video_chat]
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *       400:
 *         description: Failed to retrieve appointments
 */
router.get('/', authenticateToken, roleGuard([RoleName.Admin]), AppointmentScheduleController.getAppointments);

/**
 * @swagger
 * /review/schedule/my-appointments:
 *   get:
 *     summary: Get agent's own appointments [Agent]
 *     tags: [Appointments]
 *     description: Allows agents to retrieve a paginated list of their own appointments, optionally filtered by status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_responded, responded, hidden]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [directly, video_chat]
 *     responses:
 *       200:
 *         description: Agent appointments retrieved successfully
 *       400:
 *         description: Failed to retrieve agent appointments
 */
router.get('/my-appointments', authenticateToken, roleGuard([RoleName.Agent]), AppointmentScheduleController.getAgentAppointments);

/**
 * @swagger
 * /review/schedule/property/{property_id}:
 *   get:
 *     summary: Get appointments for a specific property [Agent, Admin]
 *     tags: [Appointments]
 *     description: Allows agents and admins to retrieve a paginated list of appointments for a specific property they manage, optionally filtered by status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: property_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_responded, responded]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [directly, video_chat]
 *     responses:
 *       200:
 *         description: Property appointments retrieved successfully
 *       400:
 *         description: Failed to retrieve property appointments
 */
router.get('/property/:property_id', authenticateToken, roleGuard([RoleName.Agent, RoleName.Admin]), AppointmentScheduleController.getPropertyAppointments);

/**
 * @swagger
 * /review/schedule/agent:
 *   get:
 *     summary: Get all appointments for a specific agent [Admin]
 *     tags: [Appointments]
 *     description: Allows admins to retrieve a paginated list of all appointments for a specific agent, optionally filtered by status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_responded, responded]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [directly, video_chat]
 *     responses:
 *       200:
 *         description: Agent appointments retrieved successfully
 *       400:
 *         description: Failed to retrieve agent appointments
 */
router.get('/agent', authenticateToken, roleGuard([RoleName.Admin]), AppointmentScheduleController.getAgentAllAppointments);

/**
 * @swagger
 * /review/schedule/{appointment_id}/respond:
 *   put:
 *     summary: Respond to an appointment [Agent, Admin]
 *     tags: [Appointments]
 *     description: Allows agents or admins to respond to an appointment and update its status to 'responded'.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment responded successfully
 *       400:
 *         description: Failed to respond to appointment
 */
router.put('/:appointment_id/respond', authenticateToken, roleGuard([RoleName.Admin, RoleName.Agent]), AppointmentScheduleController.respondAppointment);

/**
 * @swagger
 * /review/schedule/{appointment_id}:
 *   delete:
 *     summary: Delete an appointment [Agent, Admin]
 *     tags: [Appointments]
 *     description: Allows agents or admins to mark an appointment as 'hidden'.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *       400:
 *         description: Failed to delete appointment
 */
router.delete('/:appointment_id', authenticateToken, roleGuard([RoleName.Admin, RoleName.Agent]), AppointmentScheduleController.deleteAppointment);

export default router;