import React, { useMemo, useState } from "react";
import { calculateCartTotals, validateCustomerForSale } from "./compliance.js";

function Orders({
  selectedState,
  customers = [],
  inventory = [],
  orders = [],
  onAddOrder,
  onUpdateStatus,
  onPickup
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const availableProducts = inventory.filter((item) => item.stock > 0);

  const selectedCustomer = customers.find(
    (customer) => customer.customerId === selectedCustomerId
  );

  const selectedProduct = inventory.find(
    (product) => product.id === Number(selectedProductId)
  );

  const previewCart = useMemo(() => {
    if (!selectedProduct || !quantity) return [];
    return [
      {
        flowerGrams: selectedProduct.flowerGrams,
        concentrateGrams: selectedProduct.concentrateGrams,
        infusedMg: selectedProduct.infusedMg,
        totalGrams: selectedProduct.totalGrams,
        quantity: Number(quantity)
      }
    ];
  }, [selectedProduct, quantity]);

  const complianceResult = selectedCustomer
    ? validateCustomerForSale(selectedState, selectedCustomer, previewCart)
    : null;

  const totals = previewCart.length ? calculateCartTotals(previewCart) : null;

  const handleAddOrder = () => {
    if (!selectedCustomer || !selectedProduct || !quantity) return;

    const result = validateCustomerForSale(selectedState, selectedCustomer, previewCart);

    if (!result.valid) {
      alert(result.reason);
      return;
    }

    onAddOrder({
      customerId: selectedCustomer.customerId,
      productId: selectedProduct.id,
      quantity: Number(quantity)
    });

    setSelectedProductId("");
    setQuantity(1);
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Purchase Queue</h2>
      <p>Create and manage customer pickup purchases.</p>

      <div style={panelStyle}>
        <h3 style={{ marginTop: 0 }}>Add Purchase</h3>

        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select checked-in customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.customerId}>
              {customer.customerId}
            </option>
          ))}
        </select>

        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select product</option>
          {availableProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.stock} in stock)
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          style={inputStyle}
          placeholder="Quantity"
        />

        {selectedProduct && totals && (
          <div style={{ marginBottom: "12px", color: "#475569" }}>
            <div>Flower grams: {totals.flowerGrams}</div>
            <div>Concentrate grams: {totals.concentrateGrams}</div>
            <div>Infused THC mg: {totals.infusedMg}</div>
            <div>Total grams: {totals.totalGrams}</div>
          </div>
        )}

        {selectedCustomer && complianceResult && (
          <div
            style={{
              marginBottom: "12px",
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: complianceResult.valid ? "#dcfce7" : "#fee2e2",
              color: complianceResult.valid ? "#166534" : "#991b1b"
            }}
          >
            {complianceResult.valid
              ? "Compliance check passed."
              : complianceResult.reason}
          </div>
        )}

        <button onClick={handleAddOrder} style={primaryButton}>
          Add Purchase
        </button>
      </div>

      {orders.length === 0 ? (
        <p>No purchase requests yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={cardStyle}>
            <h3 style={{ margin: "0 0 8px 0" }}>{order.item}</h3>
            <p style={{ margin: "0 0 8px 0" }}>
              Customer: <strong>{order.customerId}</strong>
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              Quantity: <strong>{order.quantity}</strong>
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              Status: <strong>{order.status}</strong>
            </p>
            <p style={{ margin: "0 0 12px 0", color: "#64748b", fontSize: "14px" }}>
              Created: {order.createdAt}
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={() => onUpdateStatus(order.id, "pending")} style={btnStyle("#3b82f6")}>
                Pending
              </button>
              <button onClick={() => onUpdateStatus(order.id, "fulfilling")} style={btnStyle("#f59e0b")}>
                Fulfilling
              </button>
              <button onClick={() => onUpdateStatus(order.id, "ready")} style={btnStyle("#22c55e")}>
                Ready
              </button>
              <button onClick={() => onPickup(order.id)} style={btnStyle("#7c3aed")}>
                Picked Up
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const panelStyle = {
  marginTop: "20px",
  marginBottom: "30px",
  padding: "16px",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  backgroundColor: "#f8fafc"
};

const inputStyle = {
  width: "100%",
  maxWidth: "420px",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  display: "block"
};

const primaryButton = {
  backgroundColor: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "600"
};

const btnStyle = (backgroundColor) => ({
  backgroundColor,
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "600"
});

const cardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "12px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
};

export default Orders;