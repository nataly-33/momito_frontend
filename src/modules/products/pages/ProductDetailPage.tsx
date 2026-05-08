import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart, ShoppingCart, Minus, Plus, ChevronLeft, Star,
  Wifi, WifiOff, AlertTriangle, Package,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, FreeMode } from "swiper/modules";
import { Button } from "@shared/components/ui/Button";
import { productsService } from "@modules/products/services/products.service";
import { cartService } from "@modules/cart/services/cart.service";
import { useAuthStore } from "@core/store/auth.store";
import { useProductStock } from "@core/hooks/useProductStock";
import type { Product } from "@modules/products/types";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/free-mode";

// -------- Stock badge --------
function StockBadge({ disponible, min, connected }: { disponible: number; min: number; connected: boolean }) {
  const pct = disponible / Math.max(disponible, min * 5);
  const isOut = disponible === 0;
  const isLow = !isOut && disponible <= min * 2;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Live indicator */}
      <span className={`flex items-center gap-1 text-xs ${connected ? "text-green-600" : "text-gray-400"}`}>
        {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
        {connected ? "En vivo" : "Reconectando..."}
      </span>

      {/* Stock count */}
      {isOut ? (
        <span className="flex items-center gap-1 text-sm font-semibold text-red-600">
          <AlertTriangle size={14} /> Sin stock
        </span>
      ) : (
        <span className={`text-sm font-semibold ${isLow ? "text-amber-600" : "text-green-700"}`}>
          <Package size={13} className="inline mr-1" />
          {disponible} uds. disponibles
          {isLow && <span className="ml-1 text-xs font-normal">(¡últimas unidades!)</span>}
        </span>
      )}

      {/* Stock bar */}
      {!isOut && (
        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isLow ? "bg-amber-400" : "bg-green-500"}`}
            style={{ width: `${Math.min(pct * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// -------- Main Component --------
export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // WebSocket: stock en tiempo real
  const { stock, connected } = useProductStock(slug ?? null);

  // Cuando carga el producto, ajustar cantidad mínima
  useEffect(() => {
    if (slug) loadProduct();
  }, [slug]);

  useEffect(() => {
    if (product) {
      const minQty = product.min_order_qty || 1;
      setQuantity(minQty);
      // Auto-seleccionar primera talla si existe
      if (product.tallas_disponibles_detalle?.length > 0 && !selectedSize) {
        setSelectedSize(product.tallas_disponibles_detalle[0].id);
      }
    }
  }, [product]);

  // Sincronizar con actualizaciones WebSocket: si el stock cae por debajo de la cantidad elegida
  useEffect(() => {
    if (stock && quantity > stock.disponible && stock.disponible > 0) {
      setQuantity(stock.disponible);
    }
  }, [stock]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsService.getProduct(slug!);
      setProduct(data);
    } catch {
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const minQty = product?.min_order_qty || 1;
  // Stock real: prefiere WebSocket, fallback al campo del producto
  const stockActual = stock?.disponible ?? product?.stock_total ?? 0;
  const tieneStock = stock ? stock.tiene_stock : (product?.tiene_stock ?? false);
  const hasTallas = (product?.tallas_disponibles_detalle?.length ?? 0) > 0;

  const handleDecrement = () => setQuantity((q) => Math.max(minQty, q - minQty));
  const handleIncrement = () => setQuantity((q) => Math.min(stockActual || q + minQty, q + minQty));

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=" + window.location.pathname);
      return;
    }
    if (!product) return;
    if (!tieneStock) {
      alert("Producto agotado");
      return;
    }
    if (hasTallas && !selectedSize) {
      alert("Por favor selecciona una talla");
      return;
    }
    if (quantity > stockActual) {
      alert(`Solo hay ${stockActual} unidades disponibles`);
      return;
    }

    setAddingToCart(true);
    try {
      await cartService.addItem({
        prenda_id: product.id,
        talla_id: selectedSize || undefined,
        cantidad: quantity,
      });
      alert(`✓ ${product.nombre} (${quantity} uds.) agregado al carrito`);
    } catch (err: any) {
      alert(err.response?.data?.cantidad?.[0] || err.response?.data?.error || "Error al agregar al carrito");
    } finally {
      setAddingToCart(false);
    }
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!product) return null;

  const images = product.imagenes_url || [];
  const mainImage = product.imagen_principal || "/images/placeholder.jpg";
  const allImages = images.length > 0 ? images.map((img: any) => img.imagen_url) : [mainImage];

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-neutral-600 hover:text-primary-600 mb-6"
        >
          <ChevronLeft size={20} />
          <span>Volver</span>
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* ── Imágenes ── */}
          <div>
            <div className="flex justify-center">
              <div className="w-full max-w-md p-4 bg-neutral-100 rounded-2xl">
                <Swiper
                  modules={[Navigation, Thumbs]}
                  navigation
                  thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                  className="rounded-lg w-full"
                >
                  {allImages.map((image, index) => (
                    <SwiperSlide key={index}>
                      <img
                        src={image}
                        alt={`${product.nombre} - ${index + 1}`}
                        className="w-full h-64 md:h-96 object-contain"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>

                {allImages.length > 1 && (
                  <div className="mt-4">
                    <Swiper
                      modules={[FreeMode, Thumbs]}
                      onSwiper={setThumbsSwiper}
                      spaceBetween={10}
                      slidesPerView={4}
                      freeMode
                      watchSlidesProgress
                      className="thumbs-swiper"
                    >
                      {allImages.map((image, index) => (
                        <SwiperSlide key={index}>
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Información ── */}
          <div>
            {/* Header del producto */}
            <div className="mb-5">
              <p className="text-sm text-neutral-500 uppercase tracking-wide mb-1">
                {product.marca_detalle?.nombre || product.marca_nombre}
              </p>
              <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
                {product.nombre}
              </h1>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-neutral-500">(0 reseñas)</span>
              </div>

              {/* Precio */}
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-primary-600">
                  Bs {product.price_wholesale ?? product.precio}
                </p>
                {product.price_wholesale && product.precio !== product.price_wholesale && (
                  <p className="text-sm text-neutral-400 line-through">Bs {product.precio}</p>
                )}
              </div>

              {/* Cantidad mínima */}
              {minQty > 1 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-2 inline-block">
                  Pedido mínimo mayorista: <strong>{minQty} unidades</strong>
                </p>
              )}
            </div>

            {/* Descripción */}
            {product.descripcion && (
              <div className="mb-5">
                <h3 className="font-semibold text-neutral-900 mb-1">Descripción</h3>
                <p className="text-neutral-700 text-sm leading-relaxed">{product.descripcion}</p>
              </div>
            )}

            {/* Color */}
            {product.color && (
              <div className="mb-5">
                <h3 className="font-semibold text-neutral-900 mb-2">Color</h3>
                <span className="px-4 py-2 border-2 border-primary-500 bg-primary-50 rounded-lg text-sm font-medium text-primary-700">
                  {product.color}
                </span>
              </div>
            )}

            {/* Tallas — solo para productos B2C con tallas */}
            {hasTallas && (
              <div className="mb-5">
                <h3 className="font-semibold text-neutral-900 mb-2">Talla</h3>
                <div className="flex flex-wrap gap-3">
                  {product.tallas_disponibles_detalle.map((size: any) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`w-12 h-12 rounded-lg border-2 font-medium transition-all ${
                        selectedSize === size.id
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
                      }`}
                    >
                      {size.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock en tiempo real */}
            <div className="mb-5">
              <h3 className="font-semibold text-neutral-900 mb-2">Disponibilidad</h3>
              {stock !== null ? (
                <StockBadge disponible={stock.disponible} min={minQty} connected={connected} />
              ) : (
                <span className="text-sm text-neutral-400">Cargando stock...</span>
              )}
            </div>

            {/* Selector de cantidad */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-neutral-900">Cantidad</h3>
                {minQty > 1 && (
                  <span className="text-xs text-neutral-500">Incrementos de {minQty} uds.</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-neutral-300 rounded-lg">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= minQty}
                    className="p-3 hover:bg-neutral-50 disabled:opacity-30"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="px-6 font-semibold text-lg min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={handleIncrement}
                    disabled={stockActual > 0 && quantity >= stockActual}
                    className="p-3 hover:bg-neutral-50 disabled:opacity-30"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <span className="text-xs text-neutral-400">
                  Total: <strong>Bs {((product.price_wholesale ?? product.precio) * quantity).toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-4 mb-6">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!tieneStock || addingToCart}
              >
                <ShoppingCart size={20} className="mr-2" />
                {addingToCart ? "Agregando..." : tieneStock ? "Agregar al carrito" : "Sin stock"}
              </Button>
              <button className="p-4 border-2 border-neutral-300 rounded-lg hover:border-primary-500 hover:text-primary-600 transition-colors">
                <Heart size={24} />
              </button>
            </div>

            {/* Features */}
            <div className="border-t border-neutral-200 pt-5 space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Envío para todo Bolivia
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Pago seguro — efectivo, tarjeta o transferencia
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Stock reservado al confirmar el pedido
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
