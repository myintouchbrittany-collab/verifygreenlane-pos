import React from "react";
import { Link } from "react-router-dom";

const HOW_IT_WORKS_STEPS = [
  {
    title: "Preorder Submitted",
    copy: "Customers place their order ahead of time and upload ID once, before they arrive.",
  },
  {
    title: "Verification Completed",
    copy: "Staff reviews eligibility and activates a pickup code for a fast, compliant handoff.",
  },
  {
    title: "Arrival Check-In",
    copy: "Customers check in from the parking lot so the team sees them instantly in the queue.",
  },
  {
    title: "Pickup Closed Out",
    copy: "Orders move cleanly from prep to ready to completed with live operational visibility.",
  },
];

const POS_LOGOS = ["Dutchie", "Treez", "Flowhub", "LeafLogix"];

export default function Landing() {
  return (
    <div style={pageStyle}>
      <section style={heroSectionStyle}>
        <div style={heroContentStyle}>
          <div style={eyebrowStyle}>Greenlane Verified</div>
          <h1 style={heroTitleStyle}>
            Faster dispensary pickup, without the compliance bottleneck.
          </h1>
          <p style={heroCopyStyle}>
            Greenlane Verified gives dispensaries a clean workflow for preorder
            verification, parking lot check-in, live pickup queue management,
            and compliant handoff.
          </p>
          <div style={heroActionsStyle}>
            <Link to="/order" style={primaryButtonStyle}>
              Start a Preorder
            </Link>
            <Link to="/staff-login" style={secondaryButtonStyle}>
              Staff Login
            </Link>
          </div>
        </div>

        <div style={heroCardStyle}>
          <div style={heroCardEyebrowStyle}>Live Pickup Operations</div>
          <div style={heroStatGridStyle}>
            <div style={heroStatCardStyle}>
              <div style={heroStatValueStyle}>4 min</div>
              <div style={heroStatLabelStyle}>Average handoff</div>
            </div>
            <div style={heroStatCardStyle}>
              <div style={heroStatValueStyle}>1 queue</div>
              <div style={heroStatLabelStyle}>Shared for staff</div>
            </div>
            <div style={heroStatCardStyle}>
              <div style={heroStatValueStyle}>Real-time</div>
              <div style={heroStatLabelStyle}>Customer check-in</div>
            </div>
            <div style={heroStatCardStyle}>
              <div style={heroStatValueStyle}>Compliant</div>
              <div style={heroStatLabelStyle}>ID-aware workflow</div>
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>Problem</div>
        <div style={sectionHeaderRowStyle}>
          <h2 style={sectionTitleStyle}>Pickup lines get stuck between preorder and possession.</h2>
          <p style={sectionCopyStyle}>
            Dispensaries often juggle manual ID checks, scattered queue tracking,
            and parking lot arrivals that never reach the staff at the right time.
          </p>
        </div>
        <div style={featureGridStyle}>
          <article style={featureCardStyle}>
            <h3 style={featureTitleStyle}>Disconnected steps</h3>
            <p style={featureCopyStyle}>
              Verification, arrival, prep, and checkout live in different places or not at all.
            </p>
          </article>
          <article style={featureCardStyle}>
            <h3 style={featureTitleStyle}>Slow handoff</h3>
            <p style={featureCopyStyle}>
              Staff wastes time re-searching for orders instead of acting on the next customer.
            </p>
          </article>
          <article style={featureCardStyle}>
            <h3 style={featureTitleStyle}>No live visibility</h3>
            <p style={featureCopyStyle}>
              Parking lot arrivals and pickup readiness are hard to see at a glance.
            </p>
          </article>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>Solution</div>
        <div style={sectionHeaderRowStyle}>
          <h2 style={sectionTitleStyle}>A single verified pickup workflow for customers and staff.</h2>
          <p style={sectionCopyStyle}>
            Greenlane Verified keeps everyone on the same source of truth, from
            preorder intake through completed pickup.
          </p>
        </div>
        <div style={solutionPanelStyle}>
          <div style={solutionListStyle}>
            <div style={solutionItemStyle}>Preorder intake with ID-aware review</div>
            <div style={solutionItemStyle}>Customer-facing status and parking lot check-in</div>
            <div style={solutionItemStyle}>Live pickup queue with next best actions</div>
            <div style={solutionItemStyle}>Clear completion tracking for staff and customers</div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>How It Works</div>
        <div style={sectionHeaderRowStyle}>
          <h2 style={sectionTitleStyle}>A simple four-step pickup flow.</h2>
          <p style={sectionCopyStyle}>
            Designed to feel lightweight for customers and operationally useful for dispensary teams.
          </p>
        </div>
        <div style={stepsGridStyle}>
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <article key={step.title} style={stepCardStyle}>
              <div style={stepNumberStyle}>0{index + 1}</div>
              <h3 style={featureTitleStyle}>{step.title}</h3>
              <p style={featureCopyStyle}>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>POS Compatibility</div>
        <div style={sectionHeaderRowStyle}>
          <h2 style={sectionTitleStyle}>Built to fit the dispensary stack you already use.</h2>
          <p style={sectionCopyStyle}>
            Greenlane Verified is designed as an operational layer that can align
            with modern cannabis POS and ecommerce workflows.
          </p>
        </div>
        <div style={compatibilityCardStyle}>
          <div style={compatibilityGridStyle}>
            {POS_LOGOS.map((name) => (
              <div key={name} style={compatibilityPillStyle}>
                {name}
              </div>
            ))}
          </div>
          <p style={compatibilityCopyStyle}>
            Use Greenlane Verified alongside existing preorder, pickup, and fulfillment systems.
          </p>
        </div>
      </section>

      <section style={ctaSectionStyle}>
        <div style={sectionLabelStyle}>Get Started</div>
        <h2 style={ctaTitleStyle}>Make pickup feel fast, visible, and production-ready.</h2>
        <p style={ctaCopyStyle}>
          Launch a cleaner dispensary pickup workflow for staff and customers with one shared queue.
        </p>
        <div style={heroActionsStyle}>
          <Link to="/order" style={primaryButtonStyle}>
            Try Customer Flow
          </Link>
          <Link to="/staff-login" style={secondaryButtonStyle}>
            Open Staff Tools
          </Link>
        </div>
      </section>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "40px 20px 64px",
  maxWidth: "1160px",
  margin: "0 auto",
  boxSizing: "border-box",
};

const heroSectionStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.9fr",
  gap: "24px",
  alignItems: "stretch",
  marginBottom: "72px",
};

const heroContentStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "28px",
  padding: "36px",
  border: "1px solid #e4ebe6",
  boxShadow: "0 18px 38px rgba(12, 34, 24, 0.08)",
};

const heroCardStyle = {
  background: "linear-gradient(180deg, #163126 0%, #214838 100%)",
  borderRadius: "28px",
  padding: "32px",
  color: "#ffffff",
  boxShadow: "0 20px 42px rgba(12, 34, 24, 0.14)",
};

const eyebrowStyle = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  backgroundColor: "#eef5f1",
  color: "#17633c",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const heroTitleStyle = {
  margin: "18px 0 14px",
  color: "#163126",
  fontSize: "48px",
  lineHeight: 1.05,
};

const heroCopyStyle = {
  color: "#55665e",
  fontSize: "18px",
  lineHeight: 1.65,
  margin: 0,
};

const heroActionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "14px",
  marginTop: "28px",
};

const primaryButtonStyle = {
  display: "inline-block",
  textDecoration: "none",
  backgroundColor: "#163126",
  color: "#ffffff",
  borderRadius: "16px",
  padding: "14px 20px",
  fontWeight: "700",
  boxShadow: "0 10px 18px rgba(10, 36, 24, 0.09)",
};

const secondaryButtonStyle = {
  display: "inline-block",
  textDecoration: "none",
  backgroundColor: "#eef4f0",
  color: "#163126",
  border: "1px solid #d8e3dc",
  borderRadius: "16px",
  padding: "14px 20px",
  fontWeight: "700",
};

const heroCardEyebrowStyle = {
  color: "#cfe8d9",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const heroStatGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  marginTop: "22px",
};

const heroStatCardStyle = {
  borderRadius: "20px",
  padding: "18px",
  backgroundColor: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
};

const heroStatValueStyle = {
  fontSize: "24px",
  fontWeight: "800",
};

const heroStatLabelStyle = {
  marginTop: "8px",
  color: "#d9eee2",
  fontSize: "14px",
};

const sectionStyle = {
  marginBottom: "72px",
};

const sectionLabelStyle = {
  color: "#2b6b4c",
  fontSize: "12px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "12px",
};

const sectionHeaderRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 0.9fr",
  gap: "24px",
  alignItems: "start",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#163126",
  fontSize: "34px",
  lineHeight: 1.15,
};

const sectionCopyStyle = {
  margin: 0,
  color: "#5b6c64",
  fontSize: "17px",
  lineHeight: 1.65,
};

const featureGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "18px",
  marginTop: "28px",
};

const featureCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "22px",
  padding: "24px",
  border: "1px solid #e5ebe7",
  boxShadow: "0 14px 30px rgba(12, 34, 24, 0.06)",
};

const featureTitleStyle = {
  margin: 0,
  color: "#163126",
  fontSize: "20px",
};

const featureCopyStyle = {
  margin: "12px 0 0",
  color: "#5b6c64",
  fontSize: "15px",
  lineHeight: 1.6,
};

const solutionPanelStyle = {
  marginTop: "28px",
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "28px",
  border: "1px solid #e5ebe7",
  boxShadow: "0 14px 30px rgba(12, 34, 24, 0.06)",
};

const solutionListStyle = {
  display: "grid",
  gap: "14px",
};

const solutionItemStyle = {
  borderRadius: "18px",
  padding: "16px 18px",
  backgroundColor: "#f7faf8",
  border: "1px solid #e7eeea",
  color: "#163126",
  fontWeight: "700",
  fontSize: "15px",
};

const stepsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "18px",
  marginTop: "28px",
};

const stepCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "22px",
  padding: "24px",
  border: "1px solid #e5ebe7",
  boxShadow: "0 14px 30px rgba(12, 34, 24, 0.06)",
};

const stepNumberStyle = {
  color: "#2b6b4c",
  fontSize: "14px",
  fontWeight: "800",
  letterSpacing: "0.06em",
  marginBottom: "14px",
};

const compatibilityCardStyle = {
  marginTop: "28px",
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "28px",
  border: "1px solid #e5ebe7",
  boxShadow: "0 14px 30px rgba(12, 34, 24, 0.06)",
};

const compatibilityGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "14px",
};

const compatibilityPillStyle = {
  borderRadius: "18px",
  padding: "16px",
  textAlign: "center",
  backgroundColor: "#f7faf8",
  border: "1px solid #e7eeea",
  color: "#163126",
  fontWeight: "700",
};

const compatibilityCopyStyle = {
  margin: "18px 0 0",
  color: "#5b6c64",
  fontSize: "15px",
  lineHeight: 1.6,
};

const ctaSectionStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "28px",
  padding: "34px",
  border: "1px solid #e5ebe7",
  boxShadow: "0 18px 38px rgba(12, 34, 24, 0.08)",
  textAlign: "center",
};

const ctaTitleStyle = {
  margin: "0 auto",
  color: "#163126",
  fontSize: "36px",
  lineHeight: 1.15,
  maxWidth: "720px",
};

const ctaCopyStyle = {
  margin: "16px auto 0",
  color: "#5b6c64",
  fontSize: "17px",
  lineHeight: 1.65,
  maxWidth: "720px",
};
