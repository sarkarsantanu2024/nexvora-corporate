'use server';

/** Server actions of the Attendance screen. */
import { revalidatePath } from 'next/cache';
import type { AttendanceStatus, StaffAttendanceStatus } from '@/db/schema';
import { action } from '@/lib/api';
import { DASH_ROLES, TEAM_ROLES, requireSession } from '@/lib/auth';
import * as service from './service';
import * as staffService from './staff';

// The overview tile and the bell read the register too.
const refresh = () => revalidatePath('/admin', 'layout');

export const saveRegisterAction = action(async (input: { sectionId: string; day: string; marks: { studentId: string; status: AttendanceStatus }[] }) => {
  const session = await requireSession(DASH_ROLES);
  const counts = await service.saveRegister(session, input);
  refresh();
  return counts;
});

export const saveStaffAttendanceAction = action(async (input: { day: string; marks: { staffId: string; status: StaffAttendanceStatus }[] }) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await staffService.saveStaffAttendance(session, input);
  refresh();
  return result;
});
