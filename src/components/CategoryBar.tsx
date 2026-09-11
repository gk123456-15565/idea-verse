import React from 'react';
import {
  Sparkles,
  Cpu,
  Atom,
  GraduationCap,
  Palette,
  Briefcase,
  Gamepad2,
  Leaf,
  Lightbulb,
  Zap,
  MoreHorizontal,
} from 'lucide-react';
import { IdeaCategory } from '../types';

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

interface CategoryConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CATEGORY_ITEMS: CategoryConfig[] = [
  { name: 'All', icon: Sparkles },
  { name: 'Technology', icon: Cpu },
  { name: 'Science', icon: Atom },
  { name: 'Education', icon: GraduationCap },
  { name: 'Art', icon: Palette },
  { name: 'Business', icon: Briefcase },
  { name: 'Gaming', icon: Gamepad2 },
  { name: 'Environment', icon: Leaf },
  { name: 'Creativity', icon: Lightbulb },
  { name: 'Innovation', icon: Zap },
  { name: 'Other', icon: MoreHorizontal },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="relative py-2">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5 scroll-smooth">
        {CATEGORY_ITEMS.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedCategory.toLowerCase() === item.name.toLowerCase();

          return (
            <button
              key={item.name}
              id={`category-btn-${item.name.toLowerCase()}`}
              onClick={() => onSelectCategory(item.name)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30 ring-1 ring-blue-600'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBar;
