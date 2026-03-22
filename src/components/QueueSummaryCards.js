import React from "react";

function formatAverageWait(minutes) {
  if (!minutes) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

const CARD_CONFIG = [
  {
    key: "waitingNow",
    label: "Waiting Now",
    accent: "#8b5e00",
    background: "linear-gradient(135deg, #fff9e3 0%, #fff2bf 100%)",
  },
  {
    key: "avgWaitTimeMinutes",
    label: "Avg Wait Time",
    accent: "#24503f",
    background: "linear-gradient(135deg, #edf7f2 0%, #dff0e7 100%)",
    formatter: formatAverageWait,
  },
  {
    key: "readyForPickup",
    label: "Ready for Pickup",
    accent: "#0f6c45",
    background: "linear-gradient(135deg, #ecfbf2 0%, #cfeeda 100%)",
  },
  {
    key: "verificationIssues",
    label: "Verification Issues",
    accent: "#9c2f2f",
    background: "linear-gradient(135deg, #fff1f1 0%, #ffdada 100%)",
  },
];

export default function QueueSummaryCards({ summary }) {
  return (
    <div style={gridStyle}>
      {CARD_CONFIG.map((card) => {
        const rawValue = summary?.[card.key] ?? 0;
        const value = card.formatter ? card.formatter(rawValue) : rawValue;

        return (
          <article
            key={card.key}
            style={{
              ...cardStyle,
              background: card.background,
              borderColor: `${card.accent}22`,
            }}
          >
            <div style={{ ...eyebrowStyle, color: card.accent }}>{card.label}</div>
            <div style={{ ...valueStyle, color: card.accent }}>{value}</div>
          </article>
        );
      })}
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "20px",
};

const cardStyle = {
  borderRadius: "22px",
  padding: "24px",
  border: "1px solid",
  boxShadow: "0 16px 34px rgba(22, 49, 38, 0.07)",
};

const eyebrowStyle = {
  fontSize: "13px",
  fontWeight: "800",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "14px",
};

const valueStyle = {
  fontSize: "32px",
  fontWeight: "800",
  lineHeight: 1,
};
