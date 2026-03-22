import { useEffect, useState } from "react";
import { subscribeOrderDetail } from "../services/orderService";

export function useOrderRecord(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return () => {};
    }

    setLoading(true);

    return subscribeOrderDetail(orderId, (nextOrder) => {
      setOrder(nextOrder);
      setLoading(false);
    });
  }, [orderId]);

  return { order, loading };
}
