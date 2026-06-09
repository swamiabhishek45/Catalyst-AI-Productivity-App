import React from "react";
import * as LucideIcons from "lucide-react";

export const NOTE_ICONS = {
  FileText: LucideIcons.FileText,
  Sparkles: LucideIcons.Sparkles,
  Lightbulb: LucideIcons.Lightbulb,
  Calendar: LucideIcons.Calendar,
  Rocket: LucideIcons.Rocket,
  Palette: LucideIcons.Palette,
  Folder: LucideIcons.Folder,
  Brain: LucideIcons.Brain,
  Star: LucideIcons.Star,
  Pin: LucideIcons.Pin,
  MessageSquare: LucideIcons.MessageSquare,
  Wrench: LucideIcons.Wrench,
  Target: LucideIcons.Target,
  BarChart: LucideIcons.BarChart,
  Laptop: LucideIcons.Laptop,
  Home: LucideIcons.Home,
  Flame: LucideIcons.Flame,
  Heart: LucideIcons.Heart,
  BookOpen: LucideIcons.BookOpen,
  ClipboardList: LucideIcons.ClipboardList,
  Clock: LucideIcons.Clock,
  CheckCircle: LucideIcons.CheckCircle,
  Pencil: LucideIcons.Pencil,
};

export type NoteIconName = keyof typeof NOTE_ICONS;

interface NoteIconProps {
  name: string | null;
  className?: string;
}

export function NoteIcon({ name, className }: NoteIconProps) {
  if (!name) {
    return <LucideIcons.FileText className={className} />;
  }

  const IconComponent = (NOTE_ICONS as any)[name];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Fallback to emoji if the name is an emoji (typically 1-2 characters)
  if (name.length <= 4) {
    return <span className={className}>{name}</span>;
  }

  // Final fallback
  return <LucideIcons.FileText className={className} />;
}
