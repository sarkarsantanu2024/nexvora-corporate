/**
 * The school day, kept as the settings group 'timetable' (see SETTING_DEFAULTS
 * in ../admin/shared.ts). No imports here, so the settings file can use it.
 *
 * From the school's page on the government portal: classes start at 10.50 am;
 * Class V ends at 3.20 pm, Class VI at 4.00 pm, Classes VII to XII at
 * 4.30 pm; on Saturday all end at 1.30 pm. How the day is cut into periods
 * is not published, so the periods below are a starting split (40 minutes,
 * a 20 minute break after the fourth) that the head of school changes on the
 * Timetable screen.
 */
export type PeriodTime = { start: string; end: string };

export type TimetableSettings = {
  /** Periods Monday to Friday, in order. */
  weekday: PeriodTime[];
  /** Periods on Saturday, in order. */
  saturday: PeriodTime[];
  /** When the day ends for a class, Monday to Friday ('5' → '15:20'). A class not listed uses the last period. */
  classEnds: Record<string, string>;
  /** When Saturday ends for every class. */
  saturdayEnds: string;
};

export const TIMETABLE_DEFAULTS: TimetableSettings = {
  weekday: [
    { start: '10:50', end: '11:30' },
    { start: '11:30', end: '12:10' },
    { start: '12:10', end: '12:50' },
    { start: '12:50', end: '13:30' },
    { start: '13:50', end: '14:30' },
    { start: '14:30', end: '15:10' },
    { start: '15:10', end: '15:50' },
    { start: '15:50', end: '16:30' },
  ],
  saturday: [
    { start: '10:50', end: '11:30' },
    { start: '11:30', end: '12:10' },
    { start: '12:10', end: '12:50' },
    { start: '12:50', end: '13:30' },
  ],
  classEnds: { '5': '15:20', '6': '16:00', '7': '16:30', '8': '16:30', '9': '16:30', '10': '16:30', '11': '16:30', '12': '16:30' },
  saturdayEnds: '13:30',
};

/** 1 Monday … 6 Saturday, as stored in timetable_slots.day. */
export const SCHOOL_DAYS = [1, 2, 3, 4, 5, 6] as const;

/**
 * The periods a class has on a day (1 Monday … 6 Saturday): those that end by
 * the time the class goes home. Period numbers are the position + 1.
 */
export function periodsFor(settings: TimetableSettings, grade: number, day: number): PeriodTime[] {
  const list = day === 6 ? settings.saturday : settings.weekday;
  const ends = day === 6 ? settings.saturdayEnds : settings.classEnds[String(grade)];
  return ends ? list.filter((period) => period.end <= ends) : list;
}

/** '13:50' → '1:50 pm' */
export function clock(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
