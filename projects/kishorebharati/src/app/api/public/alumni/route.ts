import { alumniSchema, createAlumniEnquiry } from '@/server/site/enquiries';
import { publicForm } from '@/server/site/public-form';

export const POST = publicForm('alumni', alumniSchema, createAlumniEnquiry);
