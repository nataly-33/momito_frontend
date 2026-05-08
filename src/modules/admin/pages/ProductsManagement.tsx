import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon, X, Search } from "lucide-react";
import { Button } from "@shared/components/ui/Button";
import { ImageCard } from "@shared/components/ui/ImageCard";
import {
  productsService,
  categoriesService,
  brandsService,
} from "../services/admin.service";
import type { Product, Category, Brand } from "../types";
import { Pagination } from "@shared/components/ui/Pagination";

interface FormData {
  nombre: string;
  descripcion: string;
  precio: string;
  price_wholesale: string;
  price_retail: string;
  stock: string;
  stock_min: string;
  code: string;
  unit: string;
  min_order_qty: string;
  marca: string;
  categorias: string[];
  color: string;
  material: string;
  activa: boolean;
  destacada: boolean;
  es_novedad: boolean;
  imagen: File | null;
}

export const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filterCategoria, setFilterCategoria] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const emptyForm: FormData = {
    nombre: "", descripcion: "", precio: "", price_wholesale: "", price_retail: "",
    stock: "0", stock_min: "0", code: "", unit: "unidad", min_order_qty: "1",
    marca: "", categorias: [], color: "Variado", material: "",
    activa: true, destacada: false, es_novedad: false, imagen: null,
  };
  const [formData, setFormData] = useState<FormData>(emptyForm);

  useEffect(() => {
    loadProducts();
    loadCategoriesAndBrands();
  }, []);

  const loadProducts = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setPage(pageNum);
      const response = await productsService.getAll({
        search: searchTerm,
        categorias: filterCategoria || undefined,
        page: pageNum,
      });

      if (response && typeof response === "object" && "results" in response) {
        setProducts(Array.isArray(response.results) ? response.results : []);
        setTotalCount(response.count || 0);
      } else if (Array.isArray(response)) {
        setProducts(response);
        setTotalCount(response.length);
      } else {
        setProducts([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesAndBrands = async () => {
    try {
      const [categoriesResp, brandsResp] = await Promise.all([
        categoriesService.getAll(),
        brandsService.getAll(),
      ]);
      const categoriesData = Array.isArray(categoriesResp)
        ? categoriesResp
        : (categoriesResp as any).results || categoriesResp;
      const brandsData = Array.isArray(brandsResp)
        ? brandsResp
        : (brandsResp as any).results || brandsResp;
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error("Error loading categories/brands:", error);
    }
  };

  const openModal = async (product?: Product) => {
    if (product) {
      try {
        // Cargar producto completo para obtener todos los datos incluyendo stocks
        const fullProduct = await productsService.getById(product.id);

        setEditingProduct(fullProduct);

        // Pre-cargar stocks desde la respuesta detallada
        const stocks = (fullProduct.stocks || []).map((stock: any) => ({
          talla: stock.talla,
          cantidad: stock.cantidad,
          stock_minimo: stock.stock_minimo || 5,
        }));

        // Obtener IDs correctamente de las estructuras anidadas
        const marcaId =
          typeof fullProduct.marca === "string"
            ? fullProduct.marca
            : fullProduct.marca?.id || "";

        const categoriasIds = (
          fullProduct.categorias ||
          fullProduct.categorias_detalle ||
          []
        ).map((c: any) => (typeof c === "string" ? c : c.id));

        setFormData({
          nombre: fullProduct.nombre,
          descripcion: fullProduct.descripcion || "",
          precio: String(fullProduct.precio || "0"),
          price_wholesale: String(fullProduct.price_wholesale || "0"),
          price_retail: String(fullProduct.price_retail || ""),
          stock: String(fullProduct.stock ?? fullProduct.stock_total ?? "0"),
          stock_min: String(fullProduct.stock_min || "0"),
          code: fullProduct.code || "",
          unit: fullProduct.unit || "unidad",
          min_order_qty: String(fullProduct.min_order_qty || "1"),
          marca: marcaId,
          categorias: categoriasIds,
          color: fullProduct.color || "",
          material: fullProduct.material || "",
          activa: fullProduct.activa,
          destacada: fullProduct.destacada || false,
          es_novedad: fullProduct.es_novedad || false,
        });
      } catch (error) {
        console.error("Error loading product details:", error);
        alert("Error al cargar detalles del producto");
      }
    } else {
      setEditingProduct(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData({
      ...formData,
      categorias: formData.categorias.includes(categoryId)
        ? formData.categorias.filter((c) => c !== categoryId)
        : [...formData.categorias, categoryId],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new globalThis.FormData();
      fd.append("nombre", formData.nombre);
      fd.append("descripcion", formData.descripcion || "");
      fd.append("precio", String(parseFloat(formData.precio) || 0));
      fd.append("price_wholesale", String(parseFloat(formData.price_wholesale) || 0));
      if (formData.price_retail) fd.append("price_retail", String(parseFloat(formData.price_retail)));
      fd.append("stock", String(parseInt(formData.stock) || 0));
      fd.append("stock_min", String(parseInt(formData.stock_min) || 0));
      if (formData.code) fd.append("code", formData.code);
      fd.append("unit", formData.unit || "unidad");
      fd.append("min_order_qty", String(parseInt(formData.min_order_qty) || 1));
      fd.append("marca", formData.marca);
      formData.categorias.forEach((id) => fd.append("categorias", id));
      fd.append("color", formData.color || "Variado");
      fd.append("material", formData.material || "");
      fd.append("activa", String(formData.activa));
      fd.append("destacada", String(formData.destacada));
      fd.append("es_novedad", String(formData.es_novedad));
      if (formData.imagen) fd.append("imagen", formData.imagen);

      if (editingProduct) {
        await productsService.update(editingProduct.id, fd as any);
      } else {
        await productsService.create(fd as any);
      }

      loadProducts();
      closeModal();
    } catch (error: any) {
      console.error("Error saving product:", error);
      const errorData = error.response?.data;
      const errorMessage =
        typeof errorData === "object"
          ? Object.entries(errorData)
              .map(
                ([key, value]: [string, any]) =>
                  `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
              )
              .join("\n")
          : "Error al guardar producto";
      alert(`Error al guardar producto:\n${errorMessage}`);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${product.nombre}"?`))
      return;

    try {
      await productsService.delete(product.id);
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error al eliminar producto");
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await productsService.update(product.id, {
        activa: !product.activa,
      });
      loadProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error al actualizar producto");
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadProducts(1); }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, filterCategoria]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-64 bg-white rounded-lg shadow-sm p-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-400"
                placeholder="Buscar por nombre, código, marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button variant="primary" size="md" onClick={() => openModal()}>
          <Plus size={18} className="mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-neutral-600">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative bg-neutral-100 flex items-center justify-center p-3">
                <ImageCard
                  isAdmin={true}
                  src={product.imagen_principal}
                  alt={product.nombre}
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.destacada && (
                    <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-medium rounded">
                      Destacado
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      product.activa
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {product.activa ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <button
                    onClick={() => openModal(product)}
                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-neutral-50"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-sm text-neutral-900 mb-1 line-clamp-2">
                  {product.nombre}
                </h3>
                <p className="text-xs text-neutral-600 mb-2">
                  {product.marca?.nombre || product.marca_nombre} •{" "}
                  {product.color}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary-600">
                    Bs {(product as any).price_wholesale || product.precio}
                  </span>
                  <span className={`text-xs font-medium ${
                    ((product as any).is_low_stock) ? "text-red-600" : "text-gray-500"
                  }`}>
                    Stock: {(product as any).stock ?? product.stock_total}
                    {(product as any).is_low_stock && " ⚠"}
                  </span>
                </div>

                {/* Toggle Active */}
                <button
                  onClick={() => handleToggleActive(product)}
                  className="w-full mt-2 px-3 py-1.5 text-xs font-medium border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {product.activa ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalCount > pageSize && !loading && (
        <div className="flex justify-center">
          <Pagination
            total={totalCount}
            pageSize={pageSize}
            currentPage={page}
            onPageChange={(newPage) => loadProducts(newPage)}
          />
        </div>
      )}

      {/* Product Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-neutral-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Ej: Vestido Elegante"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                  required
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Describe el producto..."
                />
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Precio *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>

              {/* Marca y Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Marca *
                  </label>
                  <select
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Selecciona una marca</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Color *
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    placeholder="Ej: Rojo, Negro"
                  />
                </div>
              </div>

              {/* Material */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Material
                </label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Ej: Algodón, Poliéster"
                />
              </div>

              {/* Categorías */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Categorías
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.categorias.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="rounded border-neutral-300"
                      />
                      <span className="text-xs text-neutral-700">
                        {cat.nombre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Campos B2B mayorista */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos mayorista B2B</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Código SKU</label>
                    <input type="text" name="code" value={formData.code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500"
                      placeholder="CHK-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Unidad</label>
                    <select name="unit" value={formData.unit} onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500">
                      <option value="unidad">Unidad</option>
                      <option value="caja">Caja</option>
                      <option value="docena">Docena</option>
                      <option value="par">Par</option>
                      <option value="set">Set</option>
                      <option value="rollo">Rollo</option>
                      <option value="kg">Kg</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Precio mayorista (Bs.)</label>
                    <input type="number" step="0.01" name="price_wholesale" value={formData.price_wholesale}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500"
                      placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Precio retail sugerido</label>
                    <input type="number" step="0.01" name="price_retail" value={formData.price_retail}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500"
                      placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Stock actual</label>
                    <input type="number" min="0" name="stock" value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500"
                      placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Stock mínimo (alerta)</label>
                    <input type="number" min="0" name="stock_min" value={formData.stock_min}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500"
                      placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Cant. mínima de pedido</label>
                    <input type="number" min="1" name="min_order_qty" value={formData.min_order_qty}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500"
                      placeholder="1" />
                  </div>
                </div>
              </div>

              {/* Imagen */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Imagen del producto
                </label>
                {editingProduct?.imagen_principal && !formData.imagen && (
                  <div className="mb-2">
                    <img
                      src={editingProduct.imagen_principal}
                      alt="Imagen actual"
                      className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-400 mt-1">Imagen actual — sube una nueva para reemplazarla</p>
                  </div>
                )}
                {formData.imagen && (
                  <div className="mb-2">
                    <img
                      src={URL.createObjectURL(formData.imagen)}
                      alt="Nueva imagen"
                      className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-400 mt-1">{formData.imagen.name}</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, imagen: e.target.files?.[0] ?? null })}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={formData.activa}
                    onChange={handleInputChange}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-xs text-neutral-700">
                    Producto Activo
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="destacada"
                    checked={formData.destacada}
                    onChange={handleInputChange}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-xs text-neutral-700">Destacado</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="es_novedad"
                    checked={formData.es_novedad}
                    onChange={handleInputChange}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-xs text-neutral-700">Es Novedad</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-sm border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-primary-light to-primary-light text-black font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
                >
                  {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
