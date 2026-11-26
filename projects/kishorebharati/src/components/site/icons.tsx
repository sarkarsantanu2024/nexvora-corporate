/** The small pictures an editor can pick for a point (see ICON_OPTIONS in the section registry). */
import {
  BookOpen,
  CalendarDays,
  Drama,
  FlaskConical,
  Flag,
  Globe2,
  Library,
  Monitor,
  Mountain,
  PenLine,
  School,
  Trophy,
  UtensilsCrossed,
  Zap,
  Clock,
  Droplets,
  GraduationCap,
  HandHeart,
  Heart,
  Home,
  IndianRupee,
  KeyRound,
  MapPin,
  MessageCircle,
  Music,
  Palette,
  Puzzle,
  Ruler,
  ShieldCheck,
  Shapes,
  Smile,
  Star,
  Sun,
  ToyBrick,
  Users,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  star: Star,
  smile: Smile,
  users: Users,
  teacher: GraduationCap,
  blocks: ToyBrick,
  book: BookOpen,
  palette: Palette,
  music: Music,
  puzzle: Puzzle,
  shield: ShieldCheck,
  home: Home,
  sun: Sun,
  play: Shapes,
  water: Droplets,
  hand: HandHeart,
  chat: MessageCircle,
  map: MapPin,
  rupee: IndianRupee,
  ruler: Ruler,
  key: KeyRound,
  clock: Clock,
  library: Library,
  computer: Monitor,
  meal: UtensilsCrossed,
  flask: FlaskConical,
  trophy: Trophy,
  flag: Flag,
  calendar: CalendarDays,
  school: School,
  pen: PenLine,
  globe: Globe2,
  mountain: Mountain,
  drama: Drama,
  bolt: Zap,
};

export function PointIcon({ name, size = 24, className }: { name?: string; size?: number; className?: string }) {
  const Icon = (name && ICONS[name]) || Star;
  return <Icon size={size} strokeWidth={2.2} className={className} aria-hidden />;
}

/** The WhatsApp mark; lucide has no brand icons. */
export function WhatsAppIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24ZM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.67 4.24 3.74.59.26 1.050.41 1.410.52.590.19 1.130.16 1.560.1.480-.07 1.470-.6 1.670-1.180.210-.580.210-1.070.150-1.180-.070-.1-.230-.160-.480-.290-.250-.120-1.470-.720-1.690-.810-.230-.080-.390-.120-.560.130-.160.240-.640.800-.780.970-.150.160-.290.180-.530.060-.250-.130-1.050-.390-2-1.230-.740-.660-1.240-1.470-1.380-1.720-.150-.250-.020-.380.110-.510.110-.110.250-.290.370-.430.130-.150.170-.250.250-.420.080-.160.040-.310-.020-.430-.060-.130-.560-1.340-.760-1.840-.200-.480-.410-.420-.560-.430-.140 0-.300-.010-.470-.010Z" />
    </svg>
  );
}

export function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 21v-7.500h2.500l.400-3h-2.900V8.600c0-.900.300-1.500 1.600-1.500h1.500V4.400c-.300 0-1.200-.100-2.200-.100-2.200 0-3.700 1.300-3.700 3.800v2.400H8.200v3h2.500V21h2.800Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.500" cy="6.500" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.600 7.200a2.500 2.500 0 0 0-1.800-1.800C18.200 5 12 5 12 5s-6.200 0-7.800.400A2.500 2.500 0 0 0 2.400 7.200C2 8.800 2 12 2 12s0 3.200.400 4.800a2.500 2.500 0 0 0 1.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.400a2.500 2.500 0 0 0 1.800-1.800c.400-1.600.400-4.800.400-4.800s0-3.200-.400-4.800ZM10 15V9l5.200 3L10 15Z" />
    </svg>
  );
}
