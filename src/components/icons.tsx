
import { BookOpen, Briefcase, Heart, Users, CheckCircle, PlusCircle, LucideIcon, Folder, Home, Plus, MoreVertical, Sun, FolderPlus, LogOut, Sparkles, Notebook, Settings, Library, User, Mic, Square, NotebookText, Shuffle, ListVideo, Activity, ArrowRight, RotateCcw, FileText, Image as ImageIcon, Music, Check, Pause, Play, ShieldAlert } from 'lucide-react';

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
  NotebookText,
  Shuffle,
  ListVideo,
  Activity,
  ArrowRight,
  RotateCcw,
  FileText,
  ImageIcon,
  Music,
  Check,
  Pause,
  Play,
  ShieldAlert,
  Default: Heart,
};

export const getIcon = (name: string): LucideIcon => {
  return iconMap[name] || iconMap.Default;
};
