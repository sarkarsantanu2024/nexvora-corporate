import { admissionSchema, createAdmissionEnquiry } from '@/server/site/enquiries';
import { publicForm } from '@/server/site/public-form';

export const POST = publicForm('admission', admissionSchema, createAdmissionEnquiry);
