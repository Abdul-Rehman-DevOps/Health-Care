import type { FastifyReply } from 'fastify';
import type { ZodError } from 'zod';

const FIELD_LABELS: Record<string, string> = {
  name: 'Full name',
  fatherName: 'Guardian name',
  age: 'Age',
  contact: 'Contact',
  emergencyContact: 'Emergency contact',
  address: 'Address',
  allergies: 'Illness / condition',
  cnic: 'CNIC',
  patientId: 'Patient',
  doctorId: 'Doctor',
  departmentId: 'Department',
  appointmentDate: 'Appointment date',
  appointmentTime: 'Time',
  code: 'Department code',
  qualification: 'Qualification',
  specialization: 'Specialization',
  genericName: 'Generic name',
  category: 'Category',
  stockQuantity: 'Stock quantity',
  salePrice: 'Sale price',
  hospitalName: 'Hospital name',
  username: 'Username',
  password: 'Password',
};

export function formatZodError(error: ZodError): {
  message: string;
  fields: Record<string, string>;
} {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== 'string') continue;
    if (!fields[key]) fields[key] = issue.message;
  }

  const message = Object.entries(fields)
    .map(([key, msg]) => {
      const label = FIELD_LABELS[key] ?? key;
      return msg.toLowerCase().includes('required') || msg.includes(label)
        ? msg
        : `${label}: ${msg}`;
    })
    .join('. ');

  return {
    message: message || 'Please fill in all required fields correctly.',
    fields,
  };
}

export function sendValidationError(reply: FastifyReply, error: ZodError) {
  const { message, fields } = formatZodError(error);
  return reply.code(400).send({ error: message, fields });
}
