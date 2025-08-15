import { BookOpen, Briefcase, Heart, Users, CheckCircle, PlusCircle, LucideIcon, Folder, Home, Plus, MoreVertical } from 'lucide-react';

export const iconMap: { [key: string]: LucideIcon } = {
  BookOpen,
  Briefcase,
  Heart,
  Users,
  CheckCircle,
  PlusCircle,
  Folder,
  Home,
  Plus,
  MoreVertical,
  Default: Heart,
};

export const getIcon = (name: string): LucideIcon => {
  return iconMap[name] || iconMap.Default;
};
