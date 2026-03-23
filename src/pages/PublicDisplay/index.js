import React, { useEffect, useMemo, useState } from "react";
import "./publicDisplay.css";
import { useOrders } from "../../context/OrdersContext";
import { menuSections, specials } from "../../services/menuData";
import {
  buildPublicQueueView,
  formatWaitTime,
  getPublicQueueIdentifier,
  getQueueStatus,
  getQueueStatusLabel,
} from "../../services/liveQueue";
import { isActiveOrder } from "../../services/orderService";
import { formatCurrency } from "../../services/orderUtils";

const ROTATION_INTERVAL_MS = 9000;
const CLOCK_INTERVAL_MS = 15000;

function buildPromoSlides() {
  const featuredProducts = menuSections
    .flatMap((section) =>
      section.items.slice(0, 2).map((item) => ({
        ...item,
        sectionTitle: section.title,
      }))
    )
    .slice(0, 4);

  return [
    {
      id: "featured-products",
      eyebrow: "Featured Products",
      title: "Fast favorites for express pickup",
      accent: "product",
      items: featuredProducts.map((item) => ({
        id: item.id,
        heading: item.name,
        body: `${item.sectionTitle} • ${item.size} • ${item.thc}`,
        meta: item.specialPrice
          ? `${formatCurrency(item.specialPrice)} special`
          : `${formatCurrency(item.price)}`,
      })),
    },
    {
      id: "store-specials",
      eyebrow: "Store Specials",
      title: "Today at the counter",
      accent: "special",
      items: specials.map((special) => ({
        id: special.id,
        heading: special.title,
        body: special.details,
        meta: special.tag,
      })),
    },
    {
      id: "loyalty",
      eyebrow: "Loyalty Perks",
      title: "Earn more every pickup",
      accent: "loyalty",
      items: [
        {
          id: "loyalty-points",
          heading: "Stack points on every preorder",
          body: "Check in, complete your pickup, and build toward exclusive reward drops.",
          meta: "Members earn faster",
        },
        {
          id: "text-alerts",
          heading: "Opt in for same-day text specials",
          body: "Members get first look at featured strains, flash bundles, and express-only promos.",
          meta: "Ask staff to enroll",
        },
        {
          id: "vip-window",
          heading: "Use express pickup for your fastest visit",
          body: "Submit online, upload ID, and head to the dedicated pickup line when notified.",
          meta: "Greenlane Verified",
        },
      ],
    },
    {
      id: "pickup-instructions",
      eyebrow: "Pickup Flow",
      title: "How to keep the line moving",
      accent: "instructions",
      items: [
        {
          id: "step-1",
          heading: "1. Submit your preorder",
          body: "Place your order online and upload your ID before you arrive.",
          meta: "Preorder first",
        },
        {
          id: "step-2",
          heading: "2. Watch for approval",
          body: "Your pickup code activates once the team reviews and approves your order.",
          meta: "Approval required",
        },
        {
          id: "step-3",
          heading: "3. Check in when on site",
          body: "Use your pickup code, QR code, or order number to join the express queue.",
          meta: "Stay nearby",
        },
      ],
    },
  ];
}

function getSlotDescription(order) {
  const queueStatus = getQueueStatus(order);

  if (queueStatus === "ready") {
    return "Please head to the pickup counter with your ID and payment ready.";
  }

  if (queueStatus === "preparing") {
    return "Your order is being packaged now. Please stay nearby.";
  }

  if (queueStatus === "arrived") {
    return "You are checked in and waiting in line for prep.";
  }

  return "Staff is moving the queue in real time.";
}

function getSlotTheme(order) {
  const queueStatus = getQueueStatus(order);

  if (queueStatus === "ready") {
    return "is-ready";
  }

  if (queueStatus === "preparing") {
    return "is-preparing";
  }

  return "is-arrived";
}

export default function PublicDisplay() {
  const { loading, orders } = useOrders();
  const [now, setNow] = useState(() => new Date());
  const [slideIndex, setSlideIndex] = useState(0);
  const promoSlides = useMemo(() => buildPromoSlides(), []);

  useEffect(() => {
    const clockId = window.setInterval(() => {
      setNow(new Date());
    }, CLOCK_INTERVAL_MS);

    return () => window.clearInterval(clockId);
  }, []);

  useEffect(() => {
    const rotationId = window.setInterval(() => {
      setSlideIndex((currentIndex) => (currentIndex + 1) % promoSlides.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(rotationId);
  }, [promoSlides.length]);

  const activeOrders = useMemo(
    () => orders.filter((order) => isActiveOrder(order)),
    [orders]
  );
  const queueSlots = useMemo(
    () => buildPublicQueueView(activeOrders, now),
    [activeOrders, now]
  );
  const currentSlide = promoSlides[slideIndex];
  const onSiteCount = useMemo(
    () =>
      activeOrders.filter((order) => {
        const queueStatus = getQueueStatus(order);
        return queueStatus === "arrived" || queueStatus === "preparing" || queueStatus === "ready";
      }).length,
    [activeOrders]
  );

  return (
    <div className="public-display">
      <div className="display-backdrop display-backdrop-a" />
      <div className="display-backdrop display-backdrop-b" />

      <header className="display-header">
        <div>
          <div className="display-eyebrow">Greenlane Verified</div>
          <h1>Express Pickup Queue</h1>
          <p>Live counter display for approved and checked-in pickups.</p>
        </div>

        <div className="display-header-meta">
          <div className="display-status-pill">
            <span className="status-dot" />
            Live updates active
          </div>
          <div className="display-clock">
            {now.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        </div>
      </header>

      <main className="display-grid">
        <section className="queue-panel">
          <div className="panel-heading-row">
            <div>
              <div className="panel-eyebrow">Customer Queue</div>
              <h2>Watch for your pickup code</h2>
            </div>
            <div className="panel-stat">
              <strong>{onSiteCount}</strong>
              <span>Guests on site</span>
            </div>
          </div>

          {loading ? (
            <div className="queue-empty-card">
              <h3>Loading live queue...</h3>
              <p>The display will update automatically as orders change.</p>
            </div>
          ) : (
            <div className="queue-slot-list">
              {queueSlots.map((slot) => (
                <article
                  key={slot.id}
                  className={`queue-slot-card ${slot.order ? getSlotTheme(slot.order) : "is-empty"}`}
                >
                  <div className="queue-slot-header">
                    <span className="queue-slot-label">{slot.title}</span>
                    {slot.order ? (
                      <span className="queue-slot-status">
                        {getQueueStatusLabel(slot.order)}
                      </span>
                    ) : null}
                  </div>

                  {slot.order ? (
                    <>
                      <div className="queue-slot-code">
                        {getPublicQueueIdentifier(slot.order)}
                      </div>
                      <div className="queue-slot-helper">
                        {getSlotDescription(slot.order)}
                      </div>
                      <div className="queue-slot-meta">
                        <span>Wait {formatWaitTime(slot.order, now)}</span>
                        <span>{slot.order.pickupWindow || "Express pickup"}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="queue-slot-code">Open Slot</div>
                      <div className="queue-slot-helper">
                        No checked-in pickup is in this position right now.
                      </div>
                      <div className="queue-slot-meta">
                        <span>Queue updates live</span>
                        <span>Please listen for staff instructions</span>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={`promo-panel promo-${currentSlide.accent}`}>
          <div className="panel-heading-row">
            <div>
              <div className="panel-eyebrow">{currentSlide.eyebrow}</div>
              <h2>{currentSlide.title}</h2>
            </div>
            <div className="slide-indicator">
              {slideIndex + 1} / {promoSlides.length}
            </div>
          </div>

          <div className="promo-list">
            {currentSlide.items.map((item) => (
              <article key={item.id} className="promo-card">
                <div className="promo-card-meta">{item.meta}</div>
                <h3>{item.heading}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <footer className="promo-footer">
            <div>Submit preorder. Get approved. Check in. Pick up faster.</div>
            <div>Public display uses masked queue identifiers only.</div>
          </footer>
        </section>
      </main>
    </div>
  );
}
