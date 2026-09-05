import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Star, 
  Check, 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  Layers,
  Minus,
  Plus
} from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  cartQuantity?: number;
  similarCount?: number;
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateCartQuantity?: (productId: string, delta: number) => void;
  onOpenDetails: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDuplicateProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
  isInCart?: boolean;
  isAdmin?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cartQuantity = 0,
  similarCount = 0,
  onAddToCart,
  onUpdateCartQuantity,
  onOpenDetails,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  isInCart = false,
  isAdmin = false
}) => {
  const discountPercent = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  const currentInCartCount = cartQuantity > 0 ? cartQuantity : (isInCart ? 1 : 0);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <div 
      id={`product-card-${product.id}`}
      className={`group relative bg-white rounded-2xl sm:rounded-3xl border transition-all duration-300 flex flex-col overflow-hidden ${
        currentInCartCount > 0 
          ? 'border-amber-400 shadow-md ring-1 ring-amber-400/30' 
          : 'border-slate-200/80 hover:border-amber-300 shadow-xs hover:shadow-xl'
      }`}
    >
      {/* Image Container with Badges */}
      <div 
        className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 cursor-pointer"
        onClick={() => onOpenDetails(product)}
      >
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80';
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold tracking-wide uppercase bg-amber-500 text-slate-950 shadow-md">
              {product.badge}
            </span>
          )}
          {discountPercent && (
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-rose-600 text-white shadow-md w-fit">
              -{discountPercent}%
            </span>
          )}
          {currentInCartCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-md flex items-center gap-1 w-fit animate-in fade-in zoom-in-95">
              <Check className="w-3 h-3" />
              <span>У кошику: {currentInCartCount} шт</span>
            </span>
          )}
        </div>

        {/* Quick Stock Indicator */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {product.stock > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-300 backdrop-blur-xs border border-emerald-500/30">
              В наявності ({product.stock})
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 backdrop-blur-xs border border-rose-500/30">
              Під замовлення
            </span>
          )}
        </div>

        {/* Hover Quick Actions */}
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
            className="px-3.5 py-2 bg-white/95 hover:bg-white text-slate-800 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Детальніше</span>
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & SKU & Similar count badge */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 flex-wrap gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                {product.category}
              </span>
              {similarCount > 0 && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails(product);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900 bg-amber-100/90 hover:bg-amber-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs" 
                  title={`Поруч є ще ${similarCount} схожих варіантів/моделей`}
                >
                  <Layers className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                  <span>+{similarCount} схожі</span>
                </span>
              )}
            </div>
            <span className="font-mono text-slate-400">
              {product.sku || product.id}
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onOpenDetails(product)}
            className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-amber-600 transition-colors cursor-pointer"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Brief Description */}
          {product.description && (
            <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-700">
              {product.rating || 5.0}
            </span>
            <span className="text-[11px] text-slate-400">
              ({product.reviewsCount || 12} відгуків)
            </span>
          </div>
        </div>

        {/* Price and Action Section */}
        <div className="pt-4 mt-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-serif">
                  {product.price.toLocaleString('uk-UA')} грн
                </span>
                {product.oldPrice && product.oldPrice > product.price && (
                  <span className="text-xs text-slate-400 line-through">
                    {product.oldPrice.toLocaleString('uk-UA')} грн
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {currentInCartCount > 0 
                  ? `Разом: ${(product.price * currentInCartCount).toLocaleString('uk-UA')} грн`
                  : '100% сумісно з Brio / IKEA'
                }
              </span>
            </div>

            {/* Customer Add to Cart / Quantity Counter */}
            {currentInCartCount > 0 ? (
              <div 
                id={`cart-counter-${product.id}`}
                className="flex items-center bg-amber-50 border border-amber-300 rounded-xl p-1 shadow-xs animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUpdateCartQuantity) {
                      onUpdateCartQuantity(product.id, -1);
                    }
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-90 border border-slate-200/60"
                  title={currentInCartCount === 1 ? "Прибрати з кошика" : "Зменшити кількість"}
                  aria-label="Зменшити кількість"
                >
                  {currentInCartCount === 1 ? (
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                </button>
                
                <div 
                  className="px-2 text-center min-w-[28px] sm:min-w-[34px]"
                  title={`Кількість у кошику: ${currentInCartCount}`}
                >
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 block leading-tight select-none">
                    {currentInCartCount}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-amber-800/80 font-bold block leading-none select-none">
                    шт
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentInCartCount < product.stock) {
                      if (onUpdateCartQuantity) {
                        onUpdateCartQuantity(product.id, 1);
                      } else {
                        onAddToCart(product, 1);
                      }
                    }
                  }}
                  disabled={currentInCartCount >= product.stock}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 flex items-center justify-center font-bold transition-all shadow-2xs cursor-pointer active:scale-90 disabled:cursor-not-allowed border border-amber-600/30"
                  title={currentInCartCount >= product.stock ? "Більше немає в наявності" : "Додати ще 1 шт."}
                  aria-label="Збільшити кількість"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id={`add-to-cart-btn-${product.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product, 1);
                }}
                disabled={product.stock <= 0}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer ${
                  product.stock > 0
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Купити</span>
              </button>
            )}
          </div>

          {/* Admin Direct Card Toolbar (Edit / Duplicate / Delete) */}
          {isAdmin && (
            <div className="mt-3 pt-2.5 border-t border-amber-100 bg-amber-50/60 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 flex items-center justify-between gap-1 text-xs">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                Керування:
              </span>
              <div className="flex items-center gap-1.5">
                {onEditProduct && (
                  <button
                    type="button"
                    onClick={() => onEditProduct(product)}
                    className="px-2.5 py-1 rounded-lg bg-white text-slate-800 hover:bg-amber-500 hover:text-slate-950 font-semibold border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Редагувати цю картку"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Редагувати</span>
                  </button>
                )}
                {onDuplicateProduct && (
                  <button
                    type="button"
                    onClick={() => onDuplicateProduct(product)}
                    className="p-1 rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title="Дублювати товар"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDeleteProduct && (
                  isConfirmingDelete ? (
                    <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200 animate-in fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProduct(product.id);
                          setIsConfirmingDelete(false);
                        }}
                        className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
                        title="Підтвердити видалення"
                      >
                        Видалити?
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-1.5 py-0.5 rounded-md text-slate-500 hover:bg-slate-200 font-bold text-[10px] cursor-pointer"
                        title="Скасувати"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="p-1 rounded-lg bg-white text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                      title="Видалити товар"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
