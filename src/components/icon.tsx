import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  X,
  Info,
  Clock3,
  CircleAlert,
  LibraryBig,
  FolderOpen,
  Award,
} from "lucide-react";
const icons = {
  arrow: ArrowRight,
  back: ArrowLeft,
  external: ArrowUpRight,
  download: ArrowDownToLine,
  book: BookOpen,
  institution: Building2,
  calendar: CalendarDays,
  check: Check,
  checks: CheckCheck,
  down: ChevronDown,
  next: ChevronRight,
  assessment: ClipboardCheck,
  assignment: ClipboardList,
  file: FileText,
  graduation: GraduationCap,
  dashboard: LayoutDashboard,
  logout: LogOut,
  menu: Menu,
  close: X,
  panel: PanelLeftClose,
  search: Search,
  settings: Settings2,
  shield: ShieldCheck,
  users: Users,
  info: Info,
  clock: Clock3,
  alert: CircleAlert,
  catalog: LibraryBig,
  folder: FolderOpen,
  grade: Award,
};
export type IconName = keyof typeof icons;
export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const Svg = icons[name];
  return (
    <Svg
      width={size}
      height={size}
      strokeWidth={1.7}
      aria-hidden="true"
      focusable="false"
      className={`icon ${className}`}
    />
  );
}
