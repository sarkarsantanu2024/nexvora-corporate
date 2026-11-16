import { createFranchiseLead, franchiseSchema } from '@/server/site/enquiries';
import { publicForm } from '@/server/site/public-form';

export const POST = publicForm('franchise', franchiseSchema, createFranchiseLead);
