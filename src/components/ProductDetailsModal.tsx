import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Minus, 
  Plus, 
  Edit3, 
  Check, 
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { Product } from '../types';
import { extractTrailingParenthesizedNumber } from '../utils/productOrdering';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onSetCartQuantity?: (productId: string, quantity: number) => void;
  cartQuantity?: number;
  isInCart: boolean;
  isAdmin?: boolean;
  onEditProduct?: (product: Product) => void;
  siblingVariants?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onSetCartQuantity,
  cartQuantity = 0,
  isInCart,
  isAdmin = false,
  onEditProduct,
  siblingVariants = [],
  onSelectProduct
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (product) {
      setQuantity(cartQuantity > 0 ? cartQuantity : 1);
      setActiveImageIndex(0);
    }
  }, [product, cartQuantity]);

  if (!product) return null;

  const imagesList = (product.images && product.images.length > 0)
    ? product.images
    : (product.imageUrl ? [product.imageUrl] : ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80']);

  const currentImageUrl = imagesList[activeImageIndex] || imagesList[0] || product.imageUrl;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(i => (i > 0 ? i - 1 : imagesList.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(i => (i < imagesList.length - 1 ? i + 1 : 0));
  };

  const discountPercent = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  const handleIncrease = () => {
    if (quantity < product.stock) {
      setQuantity(q => q + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Image Gallery Column */}
            <div className="space-y-3">
              {/* Main Active Image with Prev/Next Controls */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-inner group">
                <img
                  key={currentImageUrl}
                  src={currentImageUrl}
                  alt={`${product.title} - фото ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover object-center transition-opacity duration-200"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80';
                  }}
                />

                {/* Left/Right Navigation Arrows if multiple photos */}
                {imagesList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 backdrop-blur-xs shadow-md"
                      title="Попереднє фото"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 backdrop-blur-xs shadow-md"
                      title="Наступне фото"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Counter Badge at bottom right */}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>{activeImageIndex + 1} / {imagesList.length}</span>
                    </div>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {product.badge && (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase bg-amber-500 text-slate-950 shadow-md">
                      {product.badge}
                    </span>
                  )}
                  {discountPercent && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-md w-fit">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails Row if multiple photos */}
              {imagesList.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5">
                  {imagesList.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        idx === activeImageIndex
                          ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                          : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400'
                      }`}
                      title={`Переглянути фото ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Мініатюра ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold mb-0.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>100% сумісність</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Підходить до рейок Brio, IKEA Lillabo, Hape
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-0.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ECO PLA пластик</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Безпечний біорозкладний матеріал без запаху
                  </p>
                </div>
              </div>
            </div>

            {/* Details Column */}
            <div className="flex flex-col justify-between space-y-6">
              
              <div>
                {/* Category & SKU */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-lg">
                    {product.category}
                  </span>
                  <span className="font-mono text-slate-400">
                    Артикул: {product.sku || product.id}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif leading-tight">
                  {product.title}
                </h1>

                {/* Rating and Reviews */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(product.rating || 5) ? 'fill-amber-400' : 'text-slate-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-800">{product.rating || 5.0}</span>
                  <span className="text-xs text-slate-400">({product.reviewsCount || 12} оцінок)</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {product.stock > 0 ? `В наявності (${product.stock} шт.)` : 'Під замовлення 1-2 дні'}
                  </span>
                </div>

                {/* Price */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
                    {product.price.toLocaleString('uk-UA')} грн
                  </span>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span className="text-base text-slate-400 line-through">
                      {product.oldPrice.toLocaleString('uk-UA')} грн
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="mt-4 text-sm text-slate-600 leading-relaxed">
                  <p>{product.description}</p>
                </div>

                {/* Specifications List */}
                {product.specs && Object.keys(product.specs).length > 0 && (
                  <div className="mt-5 space-y-2 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Характеристики
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      {Object.entries(product.specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500 font-medium">{key}:</span>
                          <span className="text-slate-900 font-semibold text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sibling Variants & Numbered Options */}
                {siblingVariants && siblingVariants.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
                        <span>Варіанти комплектації ({siblingVariants.length})</span>
                      </label>
                      <span className="text-[10px] text-slate-400">За номерами (1, 2, 3...)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {siblingVariants.map((item) => {
                        const num = extractTrailingParenthesizedNumber(item.title);
                        return (
                          <div
                            key={item.id}
                            onClick={() => onSelectProduct?.(item)}
                            className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/90 hover:border-amber-400 hover:bg-amber-50/40 transition-all cursor-pointer group bg-slate-50/60"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-11 h-11 rounded-lg object-cover object-center bg-slate-100 shrink-0 border border-slate-200/60"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80';
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-amber-700">
                                  {item.title}
                                </h4>
                                {num !== null && (
                                  <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-900 px-1 rounded-sm shrink-0 border border-amber-300/60">
                                    №{num}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-slate-800">
                                  {item.price.toLocaleString('uk-UA')} грн
                                </span>
                                {item.oldPrice && item.oldPrice > item.price && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    {item.oldPrice}
                                  </span>
                                )}
                                <span className={`text-[10px] ml-auto font-medium ${item.stock > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {item.stock > 0 ? 'В наявності' : 'Під замовлення'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Add to Cart Actions */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                
                <div className="flex items-center gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrease}
                      disabled={quantity >= product.stock}
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => {
                      if (isInCart && onSetCartQuantity) {
                        onSetCartQuantity(product.id, quantity);
                      } else {
                        onAddToCart(product, quantity);
                      }
                      onClose();
                    }}
                    disabled={product.stock <= 0}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer ${
                      isInCart
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                        : product.stock > 0
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-500/25'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isInCart ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Зберегти в кошику ({quantity} шт.) • {(product.price * quantity).toLocaleString('uk-UA')} грн</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Додати в кошик ({quantity} шт.) • {(product.price * quantity).toLocaleString('uk-UA')} грн</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Edit for Admin */}
                {isAdmin && onEditProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditProduct(product);
                    }}
                    className="w-full py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 font-bold text-xs hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Редагувати цю картку товару</span>
                  </button>
                )}

              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
