import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@shared/components/ui/Button";
import { categoriesService } from "../services/admin.service";
import type { Category } from "../types";
import { StatusBadge } from "../components";

export const CategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    activa: true,
    imagen: null as File | null,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesService.getAll();
      setCategories(
        Array.isArray(response) ? response : response.results || []
      );
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar la categoría "${category.nombre}"?`
      )
    )
      return;

    try {
      await categoriesService.delete(category.id);
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error al eliminar categoría");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      nombre: category.nombre,
      descripcion: category.descripcion,
      activa: category.activa,
      imagen: null,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      nombre: "",
      descripcion: "",
      activa: true,
      imagen: null,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        activa: formData.activa,
        ...(formData.imagen && { imagen: formData.imagen }),
      };

      if (editingCategory) {
        await categoriesService.update(editingCategory.id, submitData);
      } else {
        await categoriesService.create(submitData);
      }
      setShowModal(false);
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Error al guardar categoría");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleCreate}>
          <Plus size={18} className="mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-neutral-600 mb-4">No hay categorías creadas</p>
          <Button variant="primary" onClick={handleCreate}>
            Crear Primera Categoría
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Imagen de categoría */}
              <div className="relative h-36 bg-neutral-100 flex items-center justify-center">
                {category.imagen_url ? (
                  <img
                    src={category.imagen_url}
                    alt={category.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-neutral-300">🖼</span>
                )}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={category.activa} />
                </div>
              </div>

              <div className="p-3">
                <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">
                  {category.nombre}
                </h3>
                <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
                  {category.descripcion || "Sin descripción"}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <span className="text-xs text-neutral-500">
                    {category.total_prendas} productos
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1.5 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-1.5 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
            <h2 className="text-base font-bold mb-3">
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Imagen
                </label>
                {/* Preview imagen actual (al editar) */}
                {editingCategory?.imagen_url && !formData.imagen && (
                  <div className="mb-2">
                    <img
                      src={editingCategory.imagen_url}
                      alt="Imagen actual"
                      className="h-20 w-full object-cover rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-400 mt-1">Imagen actual — sube una nueva para reemplazarla</p>
                  </div>
                )}
                {/* Preview imagen nueva seleccionada */}
                {formData.imagen && (
                  <div className="mb-2">
                    <img
                      src={URL.createObjectURL(formData.imagen)}
                      alt="Nueva imagen"
                      className="h-20 w-full object-cover rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-400 mt-1">{formData.imagen.name}</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({ ...formData, imagen: e.target.files?.[0] ?? null })
                  }
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activa"
                  checked={formData.activa}
                  onChange={(e) =>
                    setFormData({ ...formData, activa: e.target.checked })
                  }
                  className="rounded"
                />
                <label
                  htmlFor="activa"
                  className="ml-2 text-xs text-neutral-700"
                >
                  Categoría activa
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
