import { useEffect, useState } from "react";
import { subscribeOrders } from "../services/orderService";

export function useOrdersData() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeOrders((nextOrders) => {
      setOrders(nextOrders);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { orders, loading };
}
