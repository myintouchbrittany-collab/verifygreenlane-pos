import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../../context/OrdersContext";
import { menuSections, specials } from "../../services/menuData";
import {
  buildPickupAvailability,
  findPickupSlot,
} from "../../services/pickupSlots";
import { formatCurrency } from "../../services/orderUtils";
import { saveCustomerOrderSnapshot } from "../../services/customerOrderSession";

export default function CustomerOrder() {
  const navigate = useNavigate();
  const { addOrder, orders } = useOrders();
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPickupDate, setSelectedPickupDate] = useState("");
  const [selectedPickupSlotKey, setSelectedPickupSlotKey] = useState("");
  const [notes, setNotes] = useState("");
  const [frontIdFile, setFrontIdFile] = useState(null);
  const [backIdFile, setBackIdFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const resetForm = () => {
    setCart({});
    setCustomerName("");
    setPhoneNumber("");
    setSelectedPickupDate("");
    setSelectedPickupSlotKey("");
    setNotes("");
    setFrontIdFile(null);
    setBackIdFile(null);
  };

  const menuItems = useMemo(
    () => menuSections.flatMap((section) => section.items),
    []
  );

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => {
        const item = menuItems.find((entry) => entry.id === itemId);
        return { ...item, quantity };
      });
  }, [cart, menuItems]);

  const pricing = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    const appliedSpecials = new Set();

    cartItems.forEach((item) => {
      subtotal += item.price * item.quantity;

      if (item.specialPrice) {
        discount += (item.price - item.specialPrice) * item.quantity;
        appliedSpecials.add("Happy Hour Edibles");
      }
    });

    const infusedPreRoll = cartItems.find(
      (item) => item.id === "moonberry-infused" && item.quantity > 1
    );
    if (infusedPreRoll) {
      discount += infusedPreRoll.price * 0.5;
      appliedSpecials.add("BOGO Pre-Rolls");
    }

    const vapeCount = cartItems
      .filter((item) => item.bundleEligible)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (vapeCount >= 2) {
      discount += 32 * 2 - 58;
      appliedSpecials.add("Vape Bundle");
    }

    return {
      subtotal,
      discount,
      total: Math.max(subtotal - discount, 0),
      appliedSpecials: Array.from(appliedSpecials),
    };
  }, [cartItems]);

  const pickupAvailability = useMemo(
    () => buildPickupAvailability(orders),
    [orders]
  );

  const selectedPickupDay = useMemo(
    () =>
      pickupAvailability.find((day) => day.dateKey === selectedPickupDate) ||
      null,
    [pickupAvailability, selectedPickupDate]
  );

  const selectedPickupSlot = useMemo(
    () =>
      (selectedPickupDay?.slots || []).find(
        (slot) => slot.slotKey === selectedPickupSlotKey
      ) || null,
    [selectedPickupDay, selectedPickupSlotKey]
  );

  useEffect(() => {
    if (!pickupAvailability.length) {
      setSelectedPickupDate("");
      setSelectedPickupSlotKey("");
      return;
    }

    const hasCurrentDate = pickupAvailability.some(
      (day) => day.dateKey === selectedPickupDate
    );

    if (!hasCurrentDate) {
      setSelectedPickupDate(pickupAvailability[0].dateKey);
      setSelectedPickupSlotKey("");
    }
  }, [pickupAvailability, selectedPickupDate]);

  useEffect(() => {
    if (!selectedPickupDate) {
      setSelectedPickupSlotKey("");
      return;
    }

    const slotStillAvailable = findPickupSlot(
      pickupAvailability,
      selectedPickupSlotKey
    );

    if (selectedPickupSlotKey && !slotStillAvailable) {
      setSelectedPickupSlotKey("");
    }
  }, [pickupAvailability, selectedPickupDate, selectedPickupSlotKey]);

  const updateCart = (itemId, delta) => {
    setCart((currentCart) => {
      const nextQuantity = Math.max((currentCart[itemId] || 0) + delta, 0);

      if (!nextQuantity) {
        const nextCart = { ...currentCart };
        delete nextCart[itemId];
        return nextCart;
      }

      return {
        ...currentCart,
        [itemId]: nextQuantity,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      if (!customerName.trim()) {
        throw new Error("Customer name is required.");
      }

      if (!phoneNumber.trim()) {
        throw new Error("Phone number is required.");
      }

      if (!selectedPickupDate || !selectedPickupSlotKey) {
        throw new Error("Pickup date and time are required.");
      }

      if (!cartItems.length) {
        throw new Error("Add at least one product before submitting.");
      }

      const latestAvailability = buildPickupAvailability(orders);
      const slotSelection = findPickupSlot(latestAvailability, selectedPickupSlotKey);

      if (!slotSelection) {
        throw new Error(
          "That pickup slot is no longer available. Choose another time and submit again."
        );
      }

      const items = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.specialPrice || item.price,
      }));
      const savedOrder = await addOrder({
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        items,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        total: pricing.total,
        pickupDate: slotSelection.dateKey,
        pickupTime: slotSelection.timeValue,
        pickupSlotKey: slotSelection.slotKey,
        pickupSlotLabel: slotSelection.label,
        pickupWindow: slotSelection.pickupWindow,
        idUploadComplete: Boolean(frontIdFile && backIdFile),
        frontIdFileName: frontIdFile?.name || "",
        backIdFileName: backIdFile?.name || "",
        notes: notes.trim(),
        source: "Customer Preorder",
      });

      saveCustomerOrderSnapshot(savedOrder);
      resetForm();
      navigate(`/customer-status?orderId=${savedOrder.orderId || savedOrder.id}`, {
        replace: true,
        state: {
          successMessage: `Preorder ${savedOrder.orderNumber || savedOrder.orderId} submitted successfully.`,
        },
      });
    } catch (error) {
      console.error("Preorder submission failed:", error);
      setSubmitError(error.message || "Unable to submit preorder.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>Customer Express Pickup</div>
          <h1 style={headingStyle}>Order ahead, upload ID, skip the lobby wait.</h1>
          <p style={heroCopyStyle}>
            Build a preorder, attach your ID, and receive your pickup barcode
            as soon as staff approves the order.
          </p>
        </div>

        <div style={heroCardStyle}>
          <div style={heroStatStyle}>
            <span style={heroStatLabelStyle}>Cart total</span>
            <strong style={heroStatValueStyle}>
              {formatCurrency(pricing.total)}
            </strong>
          </div>
          <div style={heroStatStyle}>
            <span style={heroStatLabelStyle}>Specials applied</span>
            <strong style={heroStatValueStyle}>
              {pricing.appliedSpecials.length || 0}
            </strong>
          </div>
          <div style={heroStatStyle}>
            <span style={heroStatLabelStyle}>ID upload</span>
            <strong style={heroStatValueStyle}>
              {frontIdFile && backIdFile ? "Ready" : "Required"}
            </strong>
          </div>
        </div>
      </div>

      <section style={contentGridStyle}>
        <div style={menuColumnStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Menu</h2>
            <p style={sectionCopyStyle}>
              Pickup-ready best sellers with specials already reflected in your
              cart summary.
            </p>
          </div>

          <div style={specialsGridStyle}>
            {specials.map((special) => (
              <div key={special.id} style={specialCardStyle}>
                <div style={specialTagStyle}>{special.tag}</div>
                <h3 style={specialTitleStyle}>{special.title}</h3>
                <p style={specialCopyStyle}>{special.details}</p>
              </div>
            ))}
          </div>

          {menuSections.map((section) => (
            <section key={section.id} style={menuSectionStyle}>
              <div style={menuSectionHeaderStyle}>
                <h3 style={menuSectionTitleStyle}>{section.title}</h3>
                <p style={menuSectionCopyStyle}>{section.description}</p>
              </div>

              <div style={menuGridStyle}>
                {section.items.map((item) => {
                  const quantity = cart[item.id] || 0;

                  return (
                    <article key={item.id} style={menuCardStyle}>
                      <div style={menuCardTopStyle}>
                        <div>
                          <h4 style={productTitleStyle}>{item.name}</h4>
                          <div style={metaTextStyle}>
                            {item.strain} | {item.size} | THC {item.thc}
                          </div>
                        </div>
                        <div style={priceStackStyle}>
                          <strong style={priceStyle}>
                            {formatCurrency(item.specialPrice || item.price)}
                          </strong>
                          {item.specialPrice ? (
                            <span style={strikePriceStyle}>
                              {formatCurrency(item.price)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {item.specialLabel ? (
                        <div style={productTagStyle}>{item.specialLabel}</div>
                      ) : null}

                      <div style={counterRowStyle}>
                        <button
                          type="button"
                          onClick={() => updateCart(item.id, -1)}
                          style={counterButtonStyle}
                        >
                          -
                        </button>
                        <span style={quantityStyle}>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCart(item.id, 1)}
                          style={addButtonStyle}
                        >
                          Add
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside style={sidebarStyle}>
          <div style={stickyCardStyle}>
            <h2 style={sectionTitleStyle}>Cart and Pickup Details</h2>
            <p style={sectionCopyStyle}>
              Submit your preorder with ID files to receive your express pickup
              pass after approval.
            </p>

            <div style={cartListStyle}>
              {cartItems.length ? (
                cartItems.map((item) => (
                  <div key={item.id} style={cartRowStyle}>
                    <div>
                      <div style={cartItemNameStyle}>{item.name}</div>
                      <div style={cartItemMetaStyle}>
                        {item.quantity} x{" "}
                        {formatCurrency(item.specialPrice || item.price)}
                      </div>
                    </div>
                    <strong style={cartItemTotalStyle}>
                      {formatCurrency(
                        (item.specialPrice || item.price) * item.quantity
                      )}
                    </strong>
                  </div>
                ))
              ) : (
                <div style={emptyStateStyle}>Your cart is empty.</div>
              )}
            </div>

            <div style={totalsCardStyle}>
              <div style={totalRowStyle}>
                <span>Subtotal</span>
                <strong>{formatCurrency(pricing.subtotal)}</strong>
              </div>
              <div style={totalRowStyle}>
                <span>Specials</span>
                <strong style={discountStyle}>
                  -{formatCurrency(pricing.discount)}
                </strong>
              </div>
              <div style={totalDividerStyle} />
              <div style={totalRowStyle}>
                <span>Total</span>
                <strong>{formatCurrency(pricing.total)}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {submitError ? (
                <div style={errorBannerStyle}>{submitError}</div>
              ) : null}

              <label style={labelStyle}>Full Name</label>
              <input
                style={inputStyle}
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Jordan Parker"
              />

              <label style={labelStyle}>Mobile Number</label>
              <input
                style={inputStyle}
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="(555) 010-2299"
              />

              <label style={labelStyle}>Pickup Window</label>
              <select
                style={inputStyle}
                value={selectedPickupDate}
                onChange={(event) => {
                  setSelectedPickupDate(event.target.value);
                  setSelectedPickupSlotKey("");
                }}
              >
                {pickupAvailability.length ? (
                  pickupAvailability.map((day) => (
                    <option key={day.dateKey} value={day.dateKey}>
                      {day.label}
                    </option>
                  ))
                ) : (
                  <option value="">No pickup dates available</option>
                )}
              </select>

              <label style={labelStyle}>Pickup Time Slot</label>
              <select
                style={inputStyle}
                value={selectedPickupSlotKey}
                onChange={(event) => setSelectedPickupSlotKey(event.target.value)}
                disabled={!selectedPickupDay}
              >
                <option value="">Select a pickup time</option>
                {(selectedPickupDay?.slots || []).map((slot) => (
                  <option key={slot.slotKey} value={slot.slotKey}>
                    {slot.label} ({slot.remainingCapacity} left)
                  </option>
                ))}
              </select>

              {selectedPickupSlot ? (
                <div style={helperTextStyle}>
                  Scheduled pickup: {selectedPickupSlot.pickupWindow}
                </div>
              ) : (
                <div style={helperTextStyle}>
                  Only open store hours with remaining capacity are shown.
                </div>
              )}

              <label style={labelStyle}>Order Notes</label>
              <textarea
                style={textAreaStyle}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes for staff"
              />

              <label style={labelStyle}>Front of ID</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => setFrontIdFile(event.target.files?.[0] || null)}
                style={fileInputStyle}
              />

              <label style={labelStyle}>Back of ID</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => setBackIdFile(event.target.files?.[0] || null)}
                style={fileInputStyle}
              />

              <button type="submit" style={submitButtonStyle} disabled={submitting}>
                {submitting ? "Submitting preorder..." : "Place Preorder"}
              </button>
            </form>
          </div>
        </aside>
      </section>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "32px",
};

const heroStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "20px",
  alignItems: "stretch",
  marginBottom: "28px",
};

const eyebrowStyle = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  backgroundColor: "#dff3e8",
  color: "#17633c",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const headingStyle = {
  color: "#163126",
  fontSize: "42px",
  margin: "14px 0 12px",
  lineHeight: 1.1,
  maxWidth: "700px",
};

const heroCopyStyle = {
  color: "#4f6056",
  fontSize: "16px",
  margin: 0,
  maxWidth: "720px",
};

const heroCardStyle = {
  background:
    "linear-gradient(145deg, #163126 0%, #214838 60%, #2d5b47 100%)",
  borderRadius: "20px",
  padding: "22px",
  color: "#ffffff",
  display: "grid",
  gap: "14px",
  boxShadow: "0 16px 30px rgba(22, 49, 38, 0.18)",
};

const heroStatStyle = {
  padding: "14px",
  borderRadius: "16px",
  backgroundColor: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
};

const heroStatLabelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#bfe3cf",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "6px",
};

const heroStatValueStyle = {
  fontSize: "24px",
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.7fr 0.95fr",
  gap: "24px",
  alignItems: "start",
};

const menuColumnStyle = {
  display: "grid",
  gap: "22px",
};

const sectionHeaderStyle = {
  marginBottom: "4px",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#163126",
  fontSize: "30px",
};

const sectionCopyStyle = {
  color: "#5c6b63",
  marginTop: "8px",
  marginBottom: 0,
};

const specialsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
};

const specialCardStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  borderRadius: "18px",
  padding: "18px",
};

const specialTagStyle = {
  display: "inline-block",
  backgroundColor: "#dff3e8",
  color: "#17633c",
  borderRadius: "999px",
  padding: "4px 10px",
  fontSize: "11px",
  fontWeight: "700",
  marginBottom: "10px",
};

const specialTitleStyle = {
  margin: "0 0 8px",
};

const specialCopyStyle = {
  margin: 0,
  color: "#d3e8dc",
  fontSize: "14px",
};

const menuSectionStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "22px",
  padding: "22px",
  border: "1px solid #e6ece8",
  boxShadow: "0 8px 18px rgba(22, 49, 38, 0.05)",
};

const menuSectionHeaderStyle = {
  marginBottom: "18px",
};

const menuSectionTitleStyle = {
  margin: 0,
  fontSize: "24px",
  color: "#163126",
};

const menuSectionCopyStyle = {
  margin: "8px 0 0",
  color: "#5c6b63",
};

const menuGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
};

const menuCardStyle = {
  borderRadius: "18px",
  border: "1px solid #e6ece8",
  backgroundColor: "#fbfcfb",
  padding: "18px",
};

const menuCardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
};

const productTitleStyle = {
  margin: "0 0 8px",
  color: "#163126",
  fontSize: "18px",
};

const metaTextStyle = {
  color: "#5c6b63",
  fontSize: "13px",
};

const priceStackStyle = {
  textAlign: "right",
};

const priceStyle = {
  color: "#163126",
  fontSize: "18px",
};

const strikePriceStyle = {
  display: "block",
  color: "#83958a",
  textDecoration: "line-through",
  fontSize: "13px",
  marginTop: "2px",
};

const productTagStyle = {
  display: "inline-block",
  marginTop: "12px",
  borderRadius: "999px",
  backgroundColor: "#fff4d6",
  color: "#8a6500",
  padding: "5px 10px",
  fontSize: "12px",
  fontWeight: "700",
};

const counterRowStyle = {
  marginTop: "18px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const counterButtonStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  border: "1px solid #cdd8d1",
  backgroundColor: "#ffffff",
  cursor: "pointer",
  fontSize: "18px",
};

const addButtonStyle = {
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#163126",
  color: "#ffffff",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "700",
};

const quantityStyle = {
  minWidth: "18px",
  textAlign: "center",
  fontWeight: "700",
  color: "#163126",
};

const sidebarStyle = {
  position: "relative",
};

const stickyCardStyle = {
  position: "sticky",
  top: "20px",
  backgroundColor: "#ffffff",
  borderRadius: "22px",
  padding: "22px",
  border: "1px solid #e6ece8",
  boxShadow: "0 10px 24px rgba(22, 49, 38, 0.06)",
};

const cartListStyle = {
  display: "grid",
  gap: "10px",
  margin: "18px 0",
};

const cartRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
  borderRadius: "14px",
  padding: "12px 14px",
  backgroundColor: "#f8faf8",
  border: "1px solid #e6ece8",
};

const cartItemNameStyle = {
  color: "#163126",
  fontWeight: "700",
};

const cartItemMetaStyle = {
  color: "#5c6b63",
  fontSize: "13px",
  marginTop: "4px",
};

const cartItemTotalStyle = {
  color: "#163126",
};

const emptyStateStyle = {
  borderRadius: "14px",
  padding: "18px",
  border: "1px dashed #cdd8d1",
  color: "#5c6b63",
  backgroundColor: "#fbfcfb",
};

const totalsCardStyle = {
  borderRadius: "18px",
  backgroundColor: "#163126",
  color: "#ffffff",
  padding: "18px",
  marginBottom: "18px",
};

const totalRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const totalDividerStyle = {
  height: "1px",
  backgroundColor: "rgba(255,255,255,0.18)",
  margin: "12px 0",
};

const discountStyle = {
  color: "#bde6cb",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  marginTop: "16px",
  color: "#163126",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cfd8d3",
  fontSize: "14px",
  boxSizing: "border-box",
};

const textAreaStyle = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "92px",
};

const fileInputStyle = {
  display: "block",
  width: "100%",
  fontSize: "14px",
};

const helperTextStyle = {
  color: "#5c6b63",
  fontSize: "13px",
  marginTop: "10px",
};

const submitButtonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  padding: "14px 18px",
  cursor: "pointer",
  fontWeight: "700",
  marginTop: "20px",
  width: "100%",
};

const errorBannerStyle = {
  borderRadius: "12px",
  backgroundColor: "#fde2e2",
  color: "#a12626",
  padding: "12px 14px",
  marginBottom: "12px",
  fontWeight: "700",
};
