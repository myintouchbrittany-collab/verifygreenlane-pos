import React, { useState } from "react";

function Inventory({ inventory = [], onAddInventoryItem, onRestockItem, onRemoveItem }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [flowerGrams, setFlowerGrams] = useState("");
  const [concentrateGrams, setConcentrateGrams] = useState("");
  const [infusedMg, setInfusedMg] = useState("");
  const [totalGrams, setTotalGrams] = useState("");
  const [sku, setSku] = useState("");
  const [metrcTag, setMetrcTag] = useState("");
  const [useType, setUseType] = useState("adult-use");

  const handleAddProduct = () => {
    onAddInventoryItem({
      name,
      category,
      stock,
      flowerGrams,
      concentrateGrams,
      infusedMg,
      totalGrams,
      sku,
      metrcTag,
      useType
    });

    setName("");
    setCategory("");
    setStock("");
    setFlowerGrams("");
    setConcentrateGrams("");
    setInfusedMg("");
    setTotalGrams("");
    setSku("");
    setMetrcTag("");
    setUseType("adult-use");
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Inventory</h2>
      <p>Manage active dispensary products and stock levels.</p>

      <div style={panelStyle}>
        <h3 style={{ marginTop: 0 }}>Add New Product</h3>

        <input type="text" placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />
        <input type="number" min="1" placeholder="Starting stock" value={stock} onChange={(e) => setStock(e.target.value)} style={inputStyle} />
        <input type="number" min="0" step="0.01" placeholder="Flower grams per unit" value={flowerGrams} onChange={(e) => setFlowerGrams(e.target.value)} style={inputStyle} />
        <input type="number" min="0" step="0.01" placeholder="Concentrate grams per unit" value={concentrateGrams} onChange={(e) => setConcentrateGrams(e.target.value)} style={inputStyle} />
        <input type="number" min="0" step="1" placeholder="Infused THC mg per unit" value={infusedMg} onChange={(e) => setInfusedMg(e.target.value)} style={inputStyle} />
        <input type="number" min="0" step="0.01" placeholder="Total grams per unit" value={totalGrams} onChange={(e) => setTotalGrams(e.target.value)} style={inputStyle} />
        <input type="text" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} style={inputStyle} />
        <input type="text" placeholder="Metrc Tag" value={metrcTag} onChange={(e) => setMetrcTag(e.target.value)} style={inputStyle} />

        <select value={useType} onChange={(e) => setUseType(e.target.value)} style={inputStyle}>
          <option value="adult-use">Adult Use</option>
          <option value="medical">Medical</option>
        </select>

        <button onClick={handleAddProduct} style={primaryButton}>
          Add Product
        </button>
      </div>

      {inventory.length === 0 ? (
        <p>No inventory found.</p>
      ) : (
        inventory.map((item) => {
          const lowStock = item.stock <= 5;

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: lowStock ? "#fef2f2" : "white",
                border: lowStock ? "1px solid #fca5a5" : "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
              }}
            >
              <h3 style={{ margin: "0 0 8px 0" }}>{item.name}</h3>
              <p style={{ margin: "0 0 6px 0" }}>Category: <strong>{item.category}</strong></p>
              <p style={{ margin: "0 0 6px 0" }}>Stock: <strong style={{ color: lowStock ? "#dc2626" : "#111827" }}>{item.stock}</strong></p>
              <p style={{ margin: "0 0 6px 0" }}>SKU: <strong>{item.sku || "-"}</strong></p>
              <p style={{ margin: "0 0 6px 0" }}>Metrc Tag: <strong>{item.metrcTag || "-"}</strong></p>
              <p style={{ margin: "0 0 6px 0" }}>Flower g/unit: <strong>{item.flowerGrams}</strong></p>
              <p style={{ margin: "0 0 6px 0" }}>Concentrate g/unit: <strong>{item.concentrateGrams}</strong></p>
              <p style={{ margin: "0 0 6px 0" }}>Infused mg/unit: <strong>{item.infusedMg}</strong></p>
              <p style={{ margin: "0 0 10px 0" }}>Total grams/unit: <strong>{item.totalGrams}</strong></p>

              {lowStock && (
                <p style={{ margin: "0 0 12px 0", color: "#dc2626", fontWeight: "600" }}>
                  Low stock alert
                </p>
              )}

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={() => onRestockItem(item.id, 5)} style={btnStyle("#2563eb")}>
                  +5 Restock
                </button>
                <button onClick={() => onRestockItem(item.id, 10)} style={btnStyle("#0f766e")}>
                  +10 Restock
                </button>
                <button onClick={() => onRemoveItem(item.id)} style={btnStyle("#991b1b")}>
                  Remove
                </button>
              </div>
            </div>
          );
        })
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

export default Inventory;