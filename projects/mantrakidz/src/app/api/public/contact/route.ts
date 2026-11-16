import { contactSchema, createContactMessage } from '@/server/site/enquiries';
import { publicForm } from '@/server/site/public-form';

export const POST = publicForm('contact', contactSchema, createContactMessage);
