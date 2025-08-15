import { BookOpen, Briefcase, Heart, Users, CheckCircle, PlusCircle, LucideIcon, Folder, Home, Plus, MoreVertical, Sun, FolderPlus, LogOut, Sparkles, Notebook, Settings, Library, User, Mic, Square } from 'lucide-react';

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
  Sun,
  FolderPlus,
  LogOut,
  Sparkles,
  Notebook,
  Settings,
  Library,
  User,
  Mic,
  Square,
  Default: Heart,
};

export const getIcon = (name: string): LucideIcon => {
  return iconMap[name] || iconMap.Default;
};
