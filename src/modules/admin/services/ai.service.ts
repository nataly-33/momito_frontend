/**
 * 🤖 Servicio de IA para predicciones de ventas
 * 
 * Este servicio consume los endpoints de Machine Learning del backend
 * para obtener predicciones y datos históricos de ventas.
 */

import api from '@/core/config/api.config';

// ============= TIPOS =============

export interface HistoricalData {
  periodo: string;
  cantidad_vendida: number;
  total_ventas: number;
}

export interface Prediction {
  periodo: string;
  ventas_predichas: number;
  categoria: string;
  mes: number;
  año: number;
}

export interface PredictionByCategory {
  periodo: string;
  ventas_predichas: number;
  categoria: string;
  prediccion_id: string;
  confianza: 'Alta' | 'Media' | 'Baja';
}

export interface TopProduct {
  prenda__id: string;
  prenda__nombre: string;
  total_vendido: number;
  ingresos_totales: number;
}

export interface CategorySales {
  categoria: string;
  total_ventas: number;
  cantidad_vendida: number;
  num_productos: number;
}

export interface ModelInfo {
  version: string;
  trained_at: string;
  r2_score: number;
  mae: number;
  features_used: string[];
}

export interface DashboardResponse {
  historical: HistoricalData[];
  predictions: Prediction[];
  predictions_by_category: PredictionByCategory[];
  top_products: TopProduct[];
  category_sales: CategorySales[];
  model_info: ModelInfo;
}

export interface GeneratePredictionsRequest {
  months_forward?: number;
}

export interface GeneratePredictionsResponse {
  message: string;
  model_version: string;
  predictions_count: number;
  predictions: PredictionByCategory[];
}

// ============= SERVICIO =============

class AIService {
  /**
   * Obtiene el dashboard completo de IA
   * Incluye histórico, predicciones, productos top y métricas
   * 
   * @param months_back - Meses de histórico a mostrar (default: 6)
   * @param months_forward - Meses de predicciones a mostrar (default: 3)
   */
  async getDashboard(
    months_back: number = 24,
    months_forward: number = 6,
    force_refresh = false,
  ): Promise<DashboardResponse> {
    const response = await api.get<DashboardResponse>('/ai/dashboard/', {
      params: {
        months_back,
        months_forward,
        ...(force_refresh ? { force_refresh: 'true' } : {}),
      },
    });
    return response.data;
  }

  /**
   * Fuerza la regeneración de predicciones re-ejecutando el modelo.
   * Sobreescribe las predicciones en caché.
   */
  async generatePredictions(
    months_back: number,
    months_forward: number = 6,
  ): Promise<DashboardResponse> {
    const response = await api.get<DashboardResponse>('/ai/dashboard/', {
      params: { months_back, months_forward, force_refresh: 'true' },
    });
    return response.data;
  }

  /**
   * Obtiene solo datos históricos de ventas
   * Útil para gráficas comparativas
   * 
   * @param months_back - Meses hacia atrás (default: 12)
   */
  async getHistoricalData(months_back: number = 12): Promise<HistoricalData[]> {
    const dashboard = await this.getDashboard(months_back, 0);
    return dashboard.historical;
  }

  /**
   * Obtiene información del modelo activo
   */
  async getModelInfo(): Promise<ModelInfo> {
    const dashboard = await this.getDashboard(1, 0);
    return dashboard.model_info;
  }

  /**
   * Obtiene predicciones por categoría para un período específico
   * 
   * @param months_forward - Meses a predecir (default: 3)
   */
  async getPredictionsByCategory(
    months_forward: number = 3
  ): Promise<PredictionByCategory[]> {
    const dashboard = await this.getDashboard(0, months_forward);
    return dashboard.predictions_by_category;
  }

  /**
   * Obtiene productos más vendidos
   * 
   * @param months_back - Período a analizar (default: 12)
   */
  async getTopProducts(months_back: number = 12): Promise<TopProduct[]> {
    const dashboard = await this.getDashboard(months_back, 0);
    return dashboard.top_products;
  }

  /**
   * Obtiene ventas por categoría
   * 
   * @param months_back - Período a analizar (default: 12)
   */
  async getCategorySales(months_back: number = 12): Promise<CategorySales[]> {
    const dashboard = await this.getDashboard(months_back, 0);
    return dashboard.category_sales;
  }

  /**
   * Formatea un período YYYY-MM a formato legible
   * 
   * @param periodo - Período en formato "2025-11"
   * @returns "Nov 2025"
   */
  formatPeriodo(periodo: string): string {
    const [year, month] = periodo.split('-');
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  }

  /**
   * Obtiene el color para el badge de confianza
   */
  getConfidenceColor(confianza: 'Alta' | 'Media' | 'Baja'): string {
    switch (confianza) {
      case 'Alta':
        return 'bg-green-100 text-green-800';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800';
      case 'Baja':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Formatea un número como moneda boliviana
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Formatea un número con separadores de miles
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-BO').format(Math.round(num));
  }

  /**
   * Calcula el porcentaje de cambio entre dos valores
   */
  calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Obtiene el color para mostrar crecimiento positivo o negativo
   */
  getGrowthColor(growth: number): string {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  /**
   * Obtiene el ícono para mostrar tendencia
   */
  getGrowthIcon(growth: number): string {
    if (growth > 0) return '📈';
    if (growth < 0) return '📉';
    return '➡️';
  }
}

// Exportar instancia única del servicio
const aiService = new AIService();
export default aiService;
