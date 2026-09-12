import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Check, 
  Sparkles, 
  Layers, 
  DollarSign, 
  Package, 
  Tag, 
  Info,
  Link as LinkIcon,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Star,
  ImagePlus
} from 'lucide-react';
import { Product } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  onDelete?: (id: string) => void;
  initialProduct?: Product | null;
  existingCategories: string[];
}

const PRESET_BADGES = [
  'Хіт продажів',
  'Новинка',
  'Топ набір',
  'Must Have',
  'Знижка -15%',
  'Популярне',
  'Ексклюзив'
];

const PRESET_CATEGORIES = [
  'Стрілки та розв\'язки',
  'Депо та тунелі',
  'Мости та опори',
  'Адаптери та з\'єднувачі',
  'Аксесуари та станції'
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialProduct,
  existingCategories
}) => {
  const isEditing = !!initialProduct;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState<number | ''>(195);
  const [oldPrice, setOldPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(10);
  const [badge, setBadge] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [description, setDescription] = useState('');
  
  const [specsList, setSpecsList] = useState<{ key: string; value: string }[]>([
    { key: 'Сумісність', value: 'Brio, IKEA Lillabo, Hape, Viga' },
    { key: 'Матеріал', value: 'Безпечний ECO PLA-пластик' }
  ]);

  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const allCategories = Array.from(new Set([...PRESET_CATEGORIES, ...existingCategories]));

  useEffect(() => {
    if (initialProduct) {
      setTitle(initialProduct.title || '');
      setSku(initialProduct.sku || '');
      setCategory(initialProduct.category || PRESET_CATEGORIES[0]);
      setPrice(initialProduct.price ?? '');
      setOldPrice(initialProduct.oldPrice ?? '');
      setStock(initialProduct.stock ?? 10);
      setBadge(initialProduct.badge || '');
      
      const initImgs = initialProduct.images && initialProduct.images.length > 0
        ? initialProduct.images
        : (initialProduct.imageUrl ? [initialProduct.imageUrl] : []);
      setImages(initImgs);
      setUrlInput('');
      setDescription(initialProduct.description || '');

      if (initialProduct.specs && Object.keys(initialProduct.specs).length > 0) {
        setSpecsList(
          Object.entries(initialProduct.specs).map(([key, value]) => ({ key, value }))
        );
      } else {
        setSpecsList([
          { key: 'Сумісність', value: 'Brio, IKEA Lillabo, Hape, Viga' },
          { key: 'Матеріал', value: 'Безпечний ECO PLA-пластик' }
        ]);
      }
    } else {
      setTitle('');
      setSku(`TRK-${Math.floor(100 + Math.random() * 900)}`);
      setCategory(allCategories[0] || 'Стрілки та розв\'язки');
      setCustomCategory('');
      setPrice(190);
      setOldPrice('');
      setStock(15);
      setBadge('Новинка');
      setImages(['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80']);
      setUrlInput('');
      setDescription('Кастомна 3D-деталь для дитячої дерев\'яної залізниці. Ідеально стикується з рейками Brio та IKEA.');
      setSpecsList([
        { key: 'Сумісність', value: 'Brio, IKEA Lillabo, Hape, Viga' },
        { key: 'Матеріал', value: 'Безпечний ECO PLA-пластик' },
        { key: 'Тип з\'єднання', value: 'Стандартний паз Brio' }
      ]);
    }
    setErrors({});
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleImageFilesChange = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validImageFiles = fileArray.filter(f => f.type.startsWith('image/'));

    if (validImageFiles.length === 0) {
      setErrors(prev => ({ ...prev, image: 'Будь ласка, оберіть файли зображень (JPG, PNG, WEBP)' }));
      return;
    }

    setIsCompressing(true);
    try {
      const newCompressedImages: string[] = [];
      for (const file of validImageFiles) {
        try {
          const compressedDataUrl = await compressImage(file, 1200, 1200, 0.82);
          if (compressedDataUrl) {
            newCompressedImages.push(compressedDataUrl);
          }
        } catch (err) {
          console.error('Error compressing image:', err);
        }
      }

      if (newCompressedImages.length > 0) {
        setImages(prev => [...prev, ...newCompressedImages]);
        setErrors(prev => {
          const next = { ...prev };
          delete next.image;
          return next;
        });
      } else {
        setErrors(prev => ({ ...prev, image: 'Не вдалося прочитати зображення. Спробуйте інший файл.' }));
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFilesChange(e.dataTransfer.files);
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const splitUrls = urlInput
      .split(/[\n,;\s]+/)
      .map(u => u.trim())
      .filter(u => u.length > 0);

    const validUrls = splitUrls.filter(u => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:image/'));

    if (validUrls.length === 0) {
      setErrors(prev => ({ ...prev, image: 'Вкажіть коректне посилання на зображення (починається з http:// або https://)' }));
      return;
    }

    setImages(prev => [...prev, ...validUrls]);
    setUrlInput('');
    setErrors(prev => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleMakePrimary = (indexToPrimary: number) => {
    setImages(prev => {
      const target = prev[indexToPrimary];
      const rest = prev.filter((_, i) => i !== indexToPrimary);
      return [target, ...rest];
    });
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    setImages(prev => {
      const next = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleAddPreset = (url: string) => {
    setImages(prev => (prev.includes(url) ? prev : [...prev, url]));
    setErrors(prev => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
  };

  const handleAddSpecRow = () => {
    setSpecsList([...specsList, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecsList(specsList.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specsList];
    updated[index][field] = val;
    setSpecsList(updated);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Введіть назву товару';
    }

    const finalCategory = category === '__custom__' ? customCategory.trim() : category;
    if (!finalCategory) {
      newErrors.category = 'Оберіть або вкажіть категорію';
    }

    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Ціна повинна бути більшою за 0';
    }

    if (stock === '' || isNaN(Number(stock)) || Number(stock) < 0) {
      newErrors.stock = 'Вкажіть кількість в наявності';
    }

    if (images.length === 0) {
      newErrors.image = 'Додайте хоча б одне фото товару';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategory = category === '__custom__' ? customCategory.trim() : category;
    const finalPrice = Number(price);
    const finalOldPrice = oldPrice ? Number(oldPrice) : undefined;
    const finalStock = Number(stock);

    const specsRecord: Record<string, string> = {};
    specsList.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        specsRecord[item.key.trim()] = item.value.trim();
      }
    });

    const finalImages = images.map(img => img.trim()).filter(Boolean);
    const primaryImageUrl = finalImages[0] || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80';

    const productData: Product = {
      id: initialProduct?.id || `TRK-${Date.now().toString().slice(-4)}`,
      sku: sku.trim() || `TRK-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      category: finalCategory,
      price: finalPrice,
      oldPrice: finalOldPrice,
      stock: finalStock,
      inStock: finalStock > 0,
      imageUrl: primaryImageUrl,
      images: finalImages,
      description: description.trim(),
      badge: badge.trim() || undefined,
      rating: initialProduct?.rating || 5.0,
      reviewsCount: initialProduct?.reviewsCount ?? 1,
      specs: Object.keys(specsRecord).length > 0 ? specsRecord : undefined
    };

    onSave(productData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                {isEditing ? 'Редагувати картку товару' : 'Створити нову 3D-деталь'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? `Артикул: ${initialProduct?.sku || initialProduct?.id}` : 'Заповніть інформацію та завантажте фото товару'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          
          {/* Main Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900/70 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-600" />
              Основні дані товару
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Назва 3D-деталі / товару <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="напр. Віялове поворотне депо на 5 колій Brio"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-hidden transition-all ${
                  errors.title ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                }`}
              />
              {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* SKU & Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Категорія <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium outline-hidden"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom__">+ Своя нова категорія...</option>
                </select>

                {category === '__custom__' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Введіть назву категорії"
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-amber-300 bg-white text-sm outline-hidden focus:ring-2 focus:ring-amber-500/20"
                    autoFocus
                  />
                )}
                {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category}</p>}
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Артикул / Код деталі
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="напр. TRK-DEPOT-05"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-mono outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900/70 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-600" />
              Ціна та склад
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ціна (грн) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="195"
                    className={`w-full pl-3.5 pr-12 py-2.5 rounded-xl border text-sm font-bold text-emerald-800 outline-hidden ${
                      errors.price ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">грн</span>
                </div>
                {errors.price && <p className="text-rose-500 text-xs mt-1">{errors.price}</p>}
              </div>

              {/* Old Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Стара ціна (грн, зі знижкою)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="напр. 240"
                    className="w-full pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm line-through text-slate-400 outline-hidden"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">грн</span>
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Залишок на складі (шт.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-semibold outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Photo Management Section (Support multiple photos) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900/70 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  Фотографії товару
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  {images.length} {images.length === 1 ? 'фото' : images.length >= 2 && images.length <= 4 ? 'фотографії' : 'фото'}
                </span>
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    imageTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Завантажити файли
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    imageTab === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  URL посилання
                </button>
              </div>
            </div>

            {/* Upload or URL Adder Box */}
            <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200">
              {imageTab === 'upload' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleImageFilesChange(e.target.files);
                      }
                      e.target.value = '';
                    }}
                  />
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !isCompressing && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                      isCompressing
                        ? 'border-amber-400 bg-amber-50/70 cursor-wait'
                        : isDragOver 
                        ? 'border-amber-500 bg-amber-50/50 cursor-pointer' 
                        : 'border-slate-300 hover:border-amber-400 bg-white hover:bg-amber-50/30 cursor-pointer'
                    }`}
                  >
                    {isCompressing ? (
                      <div className="py-2">
                        <Loader2 className="w-7 h-7 text-amber-600 animate-spin mx-auto mb-2" />
                        <p className="text-sm font-bold text-amber-900">
                          Оптимізуємо та стискаємо фото...
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Зменшуємо розмір файлів для швидкого завантаження
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 mx-auto mb-2 flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">
                          Натисніть або перетягніть одне чи кілька фото сюди
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          PNG, JPG, WEBP — можна вибрати відразу кілька файлів (автоматично стискаються)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Додати посилання на фото (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                      placeholder="https://images.unsplash.com/... (можна декілька через кому)"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs font-mono outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim()}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Додати
                    </button>
                  </div>
                </div>
              )}

              {/* Preset Fast Selection for 3D Rail models */}
              <div className="mt-3 pt-3 border-t border-slate-200/70">
                <p className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Швидкі зразкові фото для 3D деталей:</span>
                  <span className="text-[10px] text-slate-400 font-normal">клікніть щоб додати</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Стрілка 3D', url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80' },
                    { label: 'Депо 5 колій', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80' },
                    { label: 'Міст червоний', url: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop&q=80' },
                    { label: 'Поворотний круг', url: 'https://images.unsplash.com/photo-1596464716127-f2a829822301?w=800&auto=format&fit=crop&q=80' },
                    { label: 'Тунель 3D', url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&auto=format&fit=crop&q=80' }
                  ].map((preset, idx) => {
                    const isAlreadyAdded = images.includes(preset.url);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPreset(preset.url)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                          isAlreadyAdded
                            ? 'bg-amber-100/70 text-amber-900 border-amber-300 font-medium'
                            : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-200'
                        }`}
                      >
                        {isAlreadyAdded ? <Check className="w-3 h-3 text-amber-700" /> : <Plus className="w-3 h-3 text-slate-400" />}
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Photos List / Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  Список фото (перше фото є головною обкладинкою товару):
                </span>
                {images.length > 1 && (
                  <span className="text-[11px] text-slate-400">
                    Використовуйте стрілки або кнопку «Зробити головним» для зміни порядку
                  </span>
                )}
              </div>

              {images.length === 0 ? (
                <div className="border border-dashed border-rose-200 bg-rose-50/50 rounded-xl p-6 text-center text-rose-700">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 text-rose-400" />
                  <p className="text-xs font-bold">Фотографії ще не додано</p>
                  <p className="text-[11px] text-rose-600 mt-0.5">Додайте хоча б одну фотографію вище</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((imgUrl, index) => {
                    const isPrimary = index === 0;
                    return (
                      <div
                        key={`${index}-${imgUrl.slice(0, 30)}`}
                        className={`relative group rounded-xl overflow-hidden border-2 bg-slate-900 transition-all shadow-xs ${
                          isPrimary 
                            ? 'border-amber-500 ring-2 ring-amber-500/30' 
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {/* Image */}
                        <div className="w-full aspect-square bg-slate-100">
                          <img
                            src={imgUrl}
                            alt={`Фото ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails, mark visually
                              (e.target as HTMLElement).classList.add('opacity-40');
                            }}
                          />
                        </div>

                        {/* Top Overlay Badge / Make Primary */}
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                          {isPrimary ? (
                            <span className="pointer-events-auto bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                              <Star className="w-3 h-3 fill-slate-950" />
                              Головне
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMakePrimary(index)}
                              className="pointer-events-auto opacity-90 group-hover:opacity-100 bg-slate-900/80 hover:bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors shadow-sm backdrop-blur-xs"
                              title="Зробити це фото головною обкладинкою"
                            >
                              Зробити головним
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="pointer-events-auto p-1 rounded-md bg-slate-900/80 hover:bg-rose-600 text-white transition-colors shadow-sm"
                            title="Видалити це фото"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bottom Bar: Reorder buttons and index */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/85 via-slate-950/60 to-transparent p-1.5 pt-4 flex items-center justify-between text-white">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, 'left')}
                              disabled={index === 0}
                              className="p-1 rounded-md bg-white/20 hover:bg-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              title="Перемістити ліворуч"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, 'right')}
                              disabled={index === images.length - 1}
                              className="p-1 rounded-md bg-white/20 hover:bg-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              title="Перемістити праворуч"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] font-mono text-slate-300 pr-1">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add More Tile */}
                  <button
                    type="button"
                    onClick={() => {
                      setImageTab('upload');
                      fileInputRef.current?.click();
                    }}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/30 flex flex-col items-center justify-center p-3 text-slate-600 hover:text-amber-800 transition-colors group"
                  >
                    <ImagePlus className="w-6 h-6 mb-1 text-slate-400 group-hover:text-amber-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">+ Додати фото</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">ще один файл</span>
                  </button>
                </div>
              )}

              {errors.image && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.image}</p>}
            </div>
          </div>

          {/* Badge Selection */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900/70 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-600" />
              Маркетинговий бейдж (позначка на картці)
            </h3>
            
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Свій текст бейджа..."
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-medium outline-hidden focus:border-amber-500"
              />
              {PRESET_BADGES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBadge(badge === b ? '' : b)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-all border ${
                    badge === b 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
              {badge && (
                <button
                  type="button"
                  onClick={() => setBadge('')}
                  className="text-xs px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  Очистити
                </button>
              )}
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900/70 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-600" />
              Опис товару
            </h3>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишіть особливості 3D деталі, сумісність з рейками, комплектацію..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm outline-hidden resize-y"
            />
          </div>

          {/* Product Specifications (Характеристики) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900/70 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Технічні характеристики
              </h3>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-100/70 hover:bg-amber-200/70 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Додати характеристику</span>
              </button>
            </div>

            <div className="space-y-2">
              {specsList.map((spec, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                    placeholder="Параметр (напр. Матеріал)"
                    className="w-1/3 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50/50 focus:bg-white focus:border-amber-500 outline-hidden"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                    placeholder="Значення (напр. ECO PLA)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:border-amber-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecRow(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Видалити рядок"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Ви дійсно бажаєте видалити "${title}" з каталогу?`)) {
                  onDelete(initialProduct!.id);
                  onClose();
                }
              }}
              className="px-4 py-2 text-rose-600 hover:bg-rose-100/70 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Видалити товар</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200/60 font-semibold text-xs sm:text-sm transition-colors"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Зберегти зміни' : 'Опублікувати товар'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
