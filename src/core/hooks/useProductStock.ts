import { useState, useEffect, useRef, useCallback } from "react";

export interface StockInfo {
  disponible: number;
  min_order_qty: number;
  tiene_stock: boolean;
}

interface UseProductStockReturn {
  stock: StockInfo | null;
  connected: boolean;
}

/**
 * Hook que abre una conexión WebSocket a ws://<host>/ws/stock/<slug>/
 * y mantiene el stock del producto actualizado en tiempo real.
 * Se reconecta automáticamente si la conexión se pierde.
 */
export function useProductStock(slug: string | null): UseProductStockReturn {
  const [stock, setStock] = useState<StockInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!slug || !mountedRef.current) return;

    // Derivar la URL WS desde la URL de la API
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const wsBase = apiBase
      .replace(/\/api\/?$/, "")
      .replace(/^http/, "ws");

    const ws = new WebSocket(`${wsBase}/ws/stock/${slug}/`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setConnected(true);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "stock_update") {
          setStock({
            disponible: data.disponible,
            min_order_qty: data.min_order_qty,
            tiene_stock: data.tiene_stock,
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      // Reconectar en 3 segundos
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [slug]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { stock, connected };
}
