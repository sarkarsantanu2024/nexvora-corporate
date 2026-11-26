import { contactSchema, createEnquiry } from '@/server/site/enquiries';
import { publicForm } from '@/server/site/public-form';

export const POST = publicForm('contact', contactSchema, createEnquiry);
