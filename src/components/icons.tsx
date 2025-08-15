import { BookOpen, Briefcase, Heart, Users, CheckCircle, PlusCircle, LucideIcon, Folder, Home, Plus } from 'lucide-react';

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
  Default: Heart,
};

export const getIcon = (name: string): LucideIcon => {
  return iconMap[name] || iconMap.Default;
};
