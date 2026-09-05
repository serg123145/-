import React from 'react';
import { 
  ArrowUpDown, 
  CheckCircle2, 
  TrendingDown, 
  Layers
} from 'lucide-react';
import { SortOption } from '../types';

interface CatalogControlsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onlyInStock: boolean;
  onToggleInStock: () => void;
  onlyDiscounted: boolean;
  onToggleDiscounted: () => void;
  groupBySimilar?: boolean;
  onToggleGroupBySimilar?: () => void;
  totalCount: number;
}

export const CatalogControls: React.FC<CatalogControlsProps> = ({
  sortOption,
  onSortChange,
  onlyInStock,
  onToggleInStock,
  onlyDiscounted,
  onToggleDiscounted,
  groupBySimilar = true,
  onToggleGroupBySimilar,
  totalCount
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
      
      {/* Product count and Active state */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <span className="font-bold text-slate-900 text-sm">Каталог деталей</span>
        <span className="text-slate-300">•</span>
        <span className="bg-amber-100/70 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
          Знайдено: {totalCount}
        </span>
      </div>

      {/* Quick Filters and Sorting */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        
        {/* Only In Stock Toggle */}
        <button
          type="button"
          onClick={onToggleInStock}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
            onlyInStock
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${onlyInStock ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>Тільки в наявності</span>
        </button>

        {/* Only Discounted Toggle */}
        <button
          type="button"
          onClick={onToggleDiscounted}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
            onlyDiscounted
              ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <TrendingDown className={`w-3.5 h-3.5 ${onlyDiscounted ? 'text-amber-600' : 'text-slate-400'}`} />
          <span>Зі знижкою</span>
        </button>

        {/* Group Similar Toggle */}
        {onToggleGroupBySimilar && (
          <button
            type="button"
            onClick={onToggleGroupBySimilar}
            title="Товари зі схожими назвами відображаються поруч один біля одного"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
              groupBySimilar
                ? 'bg-amber-500/15 text-amber-900 border-amber-400/60 font-bold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${groupBySimilar ? 'text-amber-700' : 'text-slate-400'}`} />
            <span>Схожі назви поруч</span>
            {groupBySimilar && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        )}

        {/* Sort Select */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent text-xs font-semibold text-slate-800 outline-hidden cursor-pointer"
          >
            <option value="popular">За популярністю (схожі поруч)</option>
            <option value="similar">Схожі за назвою разом</option>
            <option value="rating">За рейтингом</option>
            <option value="price-asc">Від дешевих до дорогих</option>
            <option value="price-desc">Від дорогих до дешевих</option>
            <option value="name-asc">За назвою (А-Я)</option>
          </select>
        </div>

      </div>

    </div>
  );
};
