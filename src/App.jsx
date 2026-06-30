import { useState, useCallback, useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";

// ============================================================
// PLANES JUNIO 2026
// ============================================================
const PLANS = {
  ranger_xl: {
    name: "Ranger XL 4x2", label: "Ranger XL 4x2 (80/20 - RAFI5)", code: "RAFI5", ratio: "80/20", cuotas: 120,
    vm: 50962700, ap: 339751, c1: 380000, cf: 509000, intMinPct: 0.20, intMin: 10192540,
    schedule: { c2_13: 509000, c14_16: 502000 },
    bono: { amount: 2321073, condition: "ranger" }, regalo: 1, regaloCondition: "ranger",
    cuotasPagas: 2, adjCuota: null
  },
  ranger_aac3: {
    name: "Ranger XL 4x2 AAC3", label: "Ranger XL 4x2 (AAC3 - PRXL7)", code: "PRXL7", ratio: "80/20", cuotas: 84,
    vm: 50962700, ap: 485000, c1: 540000, cf: 620000, intMinPct: 0.20, intMin: 10192540,
    schedule: { c2_3: 672000, c4_16: 620000 },
    bono: { amount: 2321073, condition: "ranger" }, regalo: 1, regaloCondition: "ranger",
    cuotasPagas: 3, adjCuota: 3, intCuotaLabel: "Integración cuota 3"
  },
  ranger_xls_v6: {
    name: "Ranger XLS V6", label: "Ranger XLS V6 (80/20 - RAFI6)", code: "RAFI6", ratio: "80/20", cuotas: 120,
    vm: 64137920, ap: 427586, c1: 470000, cf: 640000, intMinPct: 0.20, intMin: 12827584,
    schedule: { c2_13: 640000, c14_16: 632000 },
    bono: { amount: 2123844, condition: "ranger" }, regalo: 1, regaloCondition: "ranger",
    cuotasPagas: 2, adjCuota: null
  },
  maverick_xlt: {
    name: "Maverick XLT", label: "Maverick XLT (70/30 - MAFI4)", code: "MAFI4", ratio: "70/30", cuotas: 84,
    vm: 56627500, ap: 471896, c1: 510000, cf: 671000, intMinPct: 0.30, intMin: 16988250,
    schedule: { c2_13: 671000, c14_16: 604000 },
    bono: null, regalo: 0, regaloCondition: null,
    cuotasPagas: 2, adjCuota: null
  },
  territory_sel: {
    name: "Territory SEL", label: "Territory SEL (70/30 - TFI30)", code: "TFI30", ratio: "70/30", cuotas: 84,
    vm: 48861930, ap: 407183, c1: 330000, cf: 457000, intMinPct: 0.30, intMin: 14658579,
    schedule: { c2_13: 457000, c14_16: 560000 },
    bono: null, regalo: 0, regaloCondition: null,
    cuotasPagas: 2, adjCuota: null
  },
  transit_van: {
    name: "Transit Van", label: "Transit Van (70/30 AAC3 - PRFT8)", code: "PRFT8", ratio: "70/30", cuotas: 84,
    vm: 66279520, ap: 552329, c1: 620000, cf: 786000, intMinPct: 0.30, intMin: 19883856,
    schedule: { c2_13: 786000, c14_16: 707000 },
    bono: null, regalo: 2, regaloCondition: null,
    cuotasPagas: 3, adjCuota: 3, intCuotaLabel: "Integración mínima (30%)",
    // Esquema fijo de adjudicación Transit
    transitFixed: {
      cuotasCanceladas: 5,    // 3 para AAC3 + 2 post retiro
      saldoRestante: 79,      // 84 - 5
      serviceUnit: 850000,    // por service
      servicesCount: 3,       // 3 services bonificados
      alicuotasPost: 1100000  // 2 alícuotas post retiro
    }
  }
};

const RETIRO_MODELS = [
  { group: "Ranger", models: [
    { name: "Ranger XL 4x2 MT", vm: 50962700 }, { name: "Ranger XL 4x2 AT", vm: 51400000 },
    { name: "Ranger XL 4x4 MT", vm: 55685660 }, { name: "Ranger XL 4x4 AT", vm: 56200000 },
    { name: "Ranger CS XL 4x2 MT", vm: 43500000 }, { name: "Ranger CS XL 4x4 MT", vm: 52000000 },
    { name: "Ranger CH XL 4x4 MT", vm: 49500000 }, { name: "Ranger XLS 2.0 MT", vm: 54142340 },
    { name: "Ranger XLS V6", vm: 64137920 }, { name: "Ranger XLT 2.0 AT 4x2", vm: 67352460 },
    { name: "Ranger XLT 2.0 AT 4x4", vm: 72213400 }, { name: "Ranger XLT V6", vm: 73301490 },
    { name: "Ranger Black 4x4 MT", vm: 63892070 }, { name: "Ranger Black 4x2 AT", vm: 58504600 },
    { name: "Ranger LTD 2.0 4x4", vm: 78995740 }, { name: "Ranger LTD+ V6", vm: 83355090 },
    { name: "Ranger Raptor", vm: 114390000 }
  ]},
  { group: "SUV / Pickups", models: [
    { name: "Territory SEL", vm: 48861930 }, { name: "Territory Titanium", vm: 56908020 },
    { name: "Territory Trend HEV", vm: 52207920 }, { name: "Maverick XLT", vm: 56627500 },
    { name: "Maverick Tremor", vm: 70024300 }, { name: "Maverick Lariat FHEV", vm: 67849300 },
    { name: "Everest Titanium", vm: 89560510 }, { name: "Bronco Sport Big Bend", vm: 57460220 },
    { name: "Bronco Sport Badlands", vm: 68188280 }, { name: "Big Bronco", vm: 106717500 },
    { name: "Bronco Badlands", vm: 106717500 }, { name: "Kuga Platinum", vm: 84718400 },
    { name: "F-150 Híbrida Lariat", vm: 114390000 }, { name: "F-150 Raptor", vm: 146475000 },
    { name: "F-150 Tremor", vm: 114390000 }
  ]},
  { group: "Transit", models: [
    { name: "Transit Chasis", vm: 73807010 }, { name: "Transit Van Mediana TN", vm: 66279520 },
    { name: "Transit Van Mediana TE", vm: 69914010 }, { name: "Transit Van Larga TE MT", vm: 75142890 },
    { name: "Transit Van Larga TE AT", vm: 79285960 }, { name: "Transit Minibus MT", vm: 93215290 },
    { name: "Transit Minibus AT", vm: 98684720 }
  ]}
];

const MODEL_PHOTOS = {
  "Maverick XLT": { principal: "/fotos/maverick-xlt/principal.png" },
};

const allRetiroModels = RETIRO_MODELS.flatMap(g => g.models);
const isRanger = (name) => name.toLowerCase().startsWith("ranger");
const isTransit = (name) => name.toLowerCase().startsWith("transit");
const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

function imageToBase64(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = url + "?t=" + Date.now();
  });
}

function calculate(planKey, retiroName, capital, bonifPatentPct, descC1Pct, inclGastos, inclDiff, inclPatent) {
  const plan = PLANS[planKey];
  const retiro = allRetiroModels.find(m => m.name === retiroName);
  if (!plan || !retiro) return null;
  const vmPlan = plan.vm, vmRetiro = retiro.vm;
  const gastosGestion = 1500000;
  const diffModelo = vmRetiro > vmPlan ? vmRetiro - vmPlan : 0;
  const patBruto = vmRetiro * 0.07;
  const patNeto = patBruto * (1 - bonifPatentPct);
  const gastosEfectivos = (inclGastos ? gastosGestion : 0) + (inclDiff ? diffModelo : 0) + (inclPatent ? patNeto : 0);
  const ofertaReal = capital - gastosEfectivos;
  const isAAC = plan.adjCuota != null;

  // ¿Es modo Transit fijo? → plan Transit Y unidad de retiro es algún Transit
  const isTransitFixed = planKey === "transit_van" && isTransit(retiroName);

  let bono = 0, regalo = 0;
  if (plan.bono?.condition === "ranger" && isRanger(retiroName)) bono = plan.bono.amount;
  if (plan.regaloCondition === "ranger" && isRanger(retiroName)) regalo = plan.regalo;
  else if (!plan.regaloCondition && plan.regalo > 0) regalo = plan.regalo;

  let saldoAdelanto = Math.max(0, ofertaReal - plan.intMin) + bono;
  if (vmRetiro < vmPlan) saldoAdelanto += vmPlan - vmRetiro;

  let nAdelanto = Math.max(0, Math.floor(saldoAdelanto / plan.ap));
  let cuotasRestantes = plan.cuotas - nAdelanto - plan.cuotasPagas;
  const pujaPct = vmPlan > 0 ? (ofertaReal / vmPlan) * 100 : 0;

  let prob = "BAJA", probColor = "#ef4444";
  if (pujaPct >= 25) { prob = "ALTA"; probColor = "#22c55e"; }
  else if (pujaPct >= 20) { prob = "MEDIA-ALTA"; probColor = "#f59e0b"; }
  else if (pujaPct >= 15) { prob = "MEDIA"; probColor = "#f97316"; }

  const ahorroPatent = inclPatent ? patBruto * bonifPatentPct : 0;
  const descC1Monto = plan.c1 * descC1Pct;

  // Beneficios para retirar (patentamiento + desc C1)
  const beneficiosRetiro = ahorroPatent + descC1Monto;

  // Beneficios post retiro (solo Transit fijo): 3 services + 2 alícuotas bonificadas
  let beneficiosPost = 0;
  if (isTransitFixed) {
    const tf = plan.transitFixed;
    beneficiosPost = (tf.serviceUnit * tf.servicesCount) + tf.alicuotasPost;
  }

  const totalAhorro = beneficiosRetiro + beneficiosPost;

  // En modo Transit fijo: cuotas canceladas y restantes son fijos
  if (isTransitFixed) {
    nAdelanto = plan.transitFixed.cuotasCanceladas;
    regalo = 0; // ya incluido en el fijo
    cuotasRestantes = plan.transitFixed.saldoRestante;
  }

  return {
    plan, planKey, vmPlan, vmRetiro, retiroName, gastosGestion, diffModelo,
    patBruto, patNeto, bonifPatentPct, inclGastos, inclDiff, inclPatent,
    ofertaReal, bono, regalo, nAdelanto, cuotasRestantes, pujaPct, prob, probColor,
    ahorroPatent, descC1Pct, descC1Monto, c1Display: plan.c1 - descC1Monto,
    beneficiosRetiro, beneficiosPost, isTransitFixed,
    proj1Monthly: plan.cf + plan.ap, proj1Months: Math.ceil(cuotasRestantes / 2),
    proj2Monthly: plan.cf + 2 * plan.ap, proj2Months: Math.ceil(cuotasRestantes / 3),
    totalAhorro, capital, isAAC, adjCuota: plan.adjCuota
  };
}

// Íconos
const IconCar = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#001f5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l4 4v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 5v4h8"/></svg>);
const IconScale = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#001f5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 6l9-3 9 3"/><path d="M3 6l4.5 9a4.5 4.5 0 0 1-9 0L3 6z"/><path d="M21 6l-4.5 9a4.5 4.5 0 0 1-9 0L21 6z"/></svg>);
const IconCoins = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#001f5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IconStar = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#001f5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);

// ============================================================
// DOCUMENTO
// ============================================================
function DocPreview({ data, clientName, validez, logoBase64, fotoUrl }) {
  if (!data) return null;
  const d = data, p = d.plan;
  const NAVY = "#001f5b";
  const BORDER = "#e8eaf0";
  const GRAY = "#6b7280";
  const W = 794;

  const intLabel = p.intCuotaLabel || `Integración mínima (${Math.round(p.intMinPct*100)}%)`;
  const pujaAccent = d.prob === "ALTA" ? "#22c55e" : d.prob === "MEDIA-ALTA" ? "#f59e0b" : "#f97316";
  const isRangerAAC = d.planKey === "ranger_aac3";

  // Etiquetas según tipo de plan
  // Transit fijo: "Monto para retirar" muestra integración mínima
  const montoLabel = d.isTransitFixed ? "Monto para retirar" : (d.isAAC ? `Oferta de adjudicación (Cuota ${d.adjCuota})` : "Puja competitiva");
  const montoValue = d.isTransitFixed ? fmt(p.intMin) : fmt(d.ofertaReal);

  const DR = ({ label, value, lc, vc, last }) => (
    <tr>
      <td style={{ fontSize: 10.5, color: lc || GRAY, padding: "4px 0", borderBottom: last ? "none" : `0.5px solid ${BORDER}` }}>{label}</td>
      <td style={{ fontSize: 11, fontWeight: 700, color: vc || "#0f172a", textAlign: "right", padding: "4px 0", borderBottom: last ? "none" : `0.5px solid ${BORDER}` }}>{value}</td>
    </tr>
  );

  const ST = ({ icon, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <div style={{ width: 24, height: 24, background: "#eef1f8", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: NAVY }}>{children}</span>
    </div>
  );

  return (
    <div style={{ width: W, fontFamily: "'Segoe UI', Arial, sans-serif", background: "#fff", overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ background: "#ffffff", width: W, boxSizing: "border-box", borderBottom: `3px solid ${NAVY}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, left: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,31,91,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,31,91,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: "50%", width: 200, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,31,91,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody><tr style={{ verticalAlign: "middle" }}>
            <td style={{ width: 160, paddingLeft: 20, paddingTop: 14, paddingBottom: 10, verticalAlign: "middle" }}>
              {logoBase64
                ? <img src={logoBase64} alt="Ford Goldstein" style={{ height: 48, width: "auto", display: "block", border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "4px 14px" }} />
                : <span style={{ fontWeight: 800, fontSize: 15, color: NAVY }}>Ford | Goldstein</span>}
            </td>
            <td style={{ paddingTop: 14, paddingBottom: 10, paddingRight: 16, verticalAlign: "middle" }}>
              <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 2 }}>Propuesta personalizada</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: NAVY, letterSpacing: "-0.02em", lineHeight: 1 }}>{clientName.toUpperCase()}</div>
              <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 380 }}>
                {p.name} · Plan {p.ratio} · {p.cuotas} cuotas · Retiro: {d.retiroName}
              </div>
            </td>
            <td style={{ width: 120, paddingTop: 14, paddingBottom: 10, paddingRight: 20, verticalAlign: "middle", textAlign: "right" }}>
              <table style={{ borderCollapse: "collapse", marginLeft: "auto" }}>
                <tbody><tr>
                  <td style={{ background: NAVY, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Válido hasta</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.1, marginTop: 2, whiteSpace: "nowrap" }}>{validez}</div>
                    <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.5)", marginTop: 2, whiteSpace: "nowrap" }}>Junio 2026</div>
                  </td>
                </tr></tbody>
              </table>
            </td>
          </tr></tbody>
        </table>

        <div style={{ height: 1, background: BORDER, marginLeft: 20, marginRight: 20 }} />

        {/* KPIs */}
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, padding: "10px 20px 14px 20px", boxSizing: "border-box" }}>
          <tbody><tr>
            <td style={{ width: "33.33%", padding: "0 6px 0 0", verticalAlign: "top" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", borderRadius: 8, overflow: "hidden" }}>
                <tbody><tr><td style={{ borderLeft: `4px solid ${d.isTransitFixed ? NAVY : pujaAccent}`, borderRadius: "8px 0 0 8px", padding: "10px 14px", background: "#f0f4ff" }}>
                  <div style={{ fontSize: 8.5, color: NAVY, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{d.isTransitFixed ? "Monto para retirar" : (d.isAAC ? "Oferta adjudicación" : "Puja competitiva")}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: NAVY, letterSpacing: "-0.02em", lineHeight: 1 }}>{montoValue}</div>
                  <div style={{ marginTop: 5, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {d.isTransitFixed
                      ? <span style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", background: "#16a34a22", borderRadius: 20, padding: "1px 8px", border: "0.5px solid #16a34a" }}>Integración 30%</span>
                      : <>
                          <span style={{ fontSize: 9, fontWeight: 700, color: pujaAccent, background: pujaAccent + "22", borderRadius: 20, padding: "1px 8px", border: `0.5px solid ${pujaAccent}` }}>{d.prob}</span>
                          <span style={{ fontSize: 9, color: GRAY, fontWeight: 600 }}>{d.pujaPct.toFixed(1)}% del VM</span>
                        </>
                    }
                  </div>
                </td></tr></tbody>
              </table>
            </td>
            <td style={{ width: "33.33%", padding: "0 6px", verticalAlign: "top" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody><tr><td style={{ borderLeft: `4px solid ${NAVY}`, borderRadius: "8px 0 0 8px", padding: "10px 14px", background: "#f0f4ff" }}>
                  <div style={{ fontSize: 8.5, color: NAVY, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Cuotas canceladas</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: NAVY, letterSpacing: "-0.02em", lineHeight: 1 }}>{d.nAdelanto + d.regalo}</div>
                  <div style={{ marginTop: 5 }}><span style={{ fontSize: 9, color: GRAY, fontWeight: 600 }}>{d.isTransitFixed ? "3 para AAC3 + 2 post retiro" : `de ${p.cuotas} cuotas del plan`}</span></div>
                </td></tr></tbody>
              </table>
            </td>
            <td style={{ width: "33.33%", padding: "0 0 0 6px", verticalAlign: "top" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody><tr><td style={{ borderLeft: `4px solid ${NAVY}`, borderRadius: "8px 0 0 8px", padding: "10px 14px", background: "#f0f4ff" }}>
                  <div style={{ fontSize: 8.5, color: NAVY, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Saldo restante</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: NAVY, letterSpacing: "-0.02em", lineHeight: 1 }}>{d.cuotasRestantes} cuotas</div>
                  <div style={{ marginTop: 5 }}><span style={{ fontSize: 9, color: "#16a34a", fontWeight: 700 }}>Ahorro total: {fmt(d.totalAhorro)}</span></div>
                </td></tr></tbody>
              </table>
            </td>
          </tr></tbody>
        </table>
      </div>

      {/* BODY */}
      <table style={{ width: W, borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup><col style={{ width: "50%" }} /><col style={{ width: "50%" }} /></colgroup>
        <tbody>
          <tr style={{ verticalAlign: "top" }}>
            {/* Plan + foto */}
            <td style={{ padding: "14px 18px", borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, verticalAlign: "top" }}>
              <ST icon={<IconCar />}>Plan del vehículo</ST>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <DR label={`VM ${p.name}`} value={fmt(d.vmPlan)} />
                  <DR label={`VM Retiro (${d.retiroName})`} value={fmt(d.vmRetiro)} />
                  <DR label={intLabel} value={fmt(p.intMin)} />
                  <DR label={`Saldo a financiar (${Math.round((1-p.intMinPct)*100)}%)`} value={fmt(d.vmPlan*(1-p.intMinPct))} lc="#9ca3af" vc="#9ca3af" last />
                </tbody>
              </table>
              <div style={{ marginTop: 12, textAlign: "center", height: 155 }}>
                {fotoUrl
                  ? <img src={fotoUrl} alt={d.retiroName} style={{ maxWidth: "92%", maxHeight: 155, width: "auto", height: "auto", objectFit: "contain", display: "inline-block" }} />
                  : <div style={{ height: 155, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, color: "#9ca3af" }}>{d.retiroName}</span></div>}
              </div>
            </td>

            {/* Licitación / Adjudicación / Monto para retirar */}
            <td style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, verticalAlign: "top" }}>
              <ST icon={<IconScale />}>{d.isTransitFixed ? "Adjudicación cuota 3" : (d.isAAC ? "Adjudicación asegurada" : "Licitación")}</ST>

              {d.isTransitFixed ? (
                // Transit fijo: no mostramos capital ni desglose de gastos, solo integración
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <DR label="VM del plan" value={fmt(d.vmPlan)} />
                    <DR label="Integración mínima (30%)" value={fmt(p.intMin)} vc={NAVY} />
                    <DR label="Adjudicación garantizada" value={`Cuota ${d.adjCuota}`} vc="#16a34a" last />
                  </tbody>
                </table>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <DR label="Capital disponible" value={fmt(d.capital)} />
                    {d.inclGastos && <DR label="Gastos de gestión" value={fmt(d.gastosGestion)} lc="#dc2626" vc="#dc2626" />}
                    {d.inclDiff && <DR label="Diferencia de modelo" value={d.diffModelo > 0 ? fmt(d.diffModelo) : "$0"} lc="#dc2626" vc="#dc2626" />}
                    {d.inclPatent && <DR label={`Patentamiento (${Math.round(d.bonifPatentPct*100)}% bonif.)`} value={d.patNeto === 0 ? "$0" : fmt(d.patNeto)} lc={d.patNeto === 0 ? "#16a34a" : "#dc2626"} vc={d.patNeto === 0 ? "#16a34a" : "#dc2626"} last />}
                  </tbody>
                </table>
              )}

              <div style={{ background: NAVY, borderRadius: 8, padding: "12px 14px", marginTop: 10 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{montoLabel}</div>
                <div style={{ fontSize: 27, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>{montoValue}</div>
                <div style={{ fontSize: 11, color: d.isTransitFixed ? "#4ade80" : (d.prob==="ALTA"?"#4ade80":d.prob==="MEDIA-ALTA"?"#fbbf24":"#f87171"), marginTop: 4, fontWeight: 700 }}>
                  {d.isTransitFixed ? `Integración 30% · Adjudicación cuota ${d.adjCuota}` : `${d.pujaPct.toFixed(2)}% del VM · Probabilidad ${d.prob}`}
                </div>
              </div>

              {(d.isAAC || d.isTransitFixed) && (
                <div style={{ background: "#ecfdf5", border: "0.5px solid #6ee7b7", borderRadius: 7, padding: "8px 12px", marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: "#047857", fontWeight: 700 }}>✓ Adjudicación garantizada en cuota {d.adjCuota} · {p.cuotasPagas} cuotas pagas al adjudicar</span>
                </div>
              )}

              <div style={{ background: "#f8fafc", borderRadius: 7, border: `0.5px solid ${BORDER}`, padding: "8px 12px", marginTop: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ fontSize: 10.5, color: GRAY, padding: "2px 0", borderBottom: `0.5px solid ${BORDER}` }}>Reducción de plazo</td>
                      <td style={{ fontSize: 11, fontWeight: 700, textAlign: "right", padding: "2px 0", borderBottom: `0.5px solid ${BORDER}` }}>{d.nAdelanto+d.regalo} cuotas canceladas</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: 11, fontWeight: 700, color: NAVY, paddingTop: 5 }}>Saldo restante estimado</td>
                      <td style={{ fontSize: 19, fontWeight: 900, color: NAVY, textAlign: "right", paddingTop: 5 }}>{d.cuotasRestantes} cuotas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <tr style={{ verticalAlign: "top" }}>
            {/* Cuotas */}
            <td style={{ padding: "14px 18px", borderRight: `1px solid ${BORDER}`, verticalAlign: "top" }}>
              <ST icon={<IconCoins />}>Cuotas</ST>

              <div style={{ background: "#f0fdf4", border: "0.5px solid #86efac", borderRadius: 7, padding: "8px 11px", marginBottom: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody><tr>
                  <td><div style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>Cuota 1 (Suscripción)</div>
                    {d.descC1Pct > 0 && <div style={{ fontSize: 9.5, color: "#16a34a", marginTop: 1 }}>{Math.round(d.descC1Pct*100)}% de descuento con Tarjeta de Crédito</div>}
                  </td>
                  <td style={{ textAlign: "right" }}><span style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>{fmt(d.c1Display)}</span></td>
                </tr></tbody></table>
              </div>

              {isRangerAAC ? (
                <>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody><DR label="Cuota 2 a 3" value={fmt(p.schedule.c2_3)} /></tbody>
                  </table>
                  <div style={{ background: "#fff7ed", border: "0.5px solid #fdba74", borderRadius: 7, padding: "8px 11px", margin: "6px 0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody><tr>
                      <td><div style={{ fontSize: 12, fontWeight: 700, color: "#c2410c" }}>Cuota 4 a 16</div>
                        <div style={{ fontSize: 9.5, color: "#ea580c", marginTop: 1 }}>Esquema estable post-adjudicación</div>
                      </td>
                      <td style={{ textAlign: "right" }}><span style={{ fontSize: 18, fontWeight: 800, color: "#c2410c" }}>{fmt(p.schedule.c4_16)}</span></td>
                    </tr></tbody></table>
                  </div>
                </>
              ) : (
                <>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody><DR label={d.isAAC ? "Cuota 2 a 3" : "Cuota 2 (licitación)"} value={fmt(p.schedule.c2_13)} /></tbody>
                  </table>
                  <div style={{ background: "#fff7ed", border: "0.5px solid #fdba74", borderRadius: 7, padding: "8px 11px", margin: "6px 0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody><tr>
                      <td><div style={{ fontSize: 12, fontWeight: 700, color: "#c2410c" }}>Cuotas 3 a 13 - Fijas</div>
                        <div style={{ fontSize: 9.5, color: "#ea580c", marginTop: 1 }}>12 cuotas garantizadas sin variación</div>
                      </td>
                      <td style={{ textAlign: "right" }}><span style={{ fontSize: 18, fontWeight: 800, color: "#c2410c" }}>{fmt(p.schedule.c2_13)}</span></td>
                    </tr></tbody></table>
                  </div>
                </>
              )}

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <DR label="Cuota 14 a 16" value={fmt(p.schedule.c14_16)} />
                  <DR label="Cuota 17 al final" value="Decreciente" vc="#9ca3af" />
                  <DR label="ALÍCUOTA PURA" value={fmt(p.ap)} vc={NAVY} last />
                </tbody>
              </table>
            </td>

            {/* Beneficios */}
            <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
              <ST icon={<IconStar />}>Beneficios</ST>

              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 6, marginBottom: 10 }}>
                <tbody><tr>
                  <td style={{ border: `1px solid ${BORDER}`, borderRadius: 7, padding: "10px 8px", textAlign: "center", width: "50%", verticalAlign: "middle" }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>PATENTAMIENTO</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: NAVY, lineHeight: 1, marginTop: 3 }}>{Math.round(d.bonifPatentPct*100)}%</div>
                    <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>bonificado</div>
                  </td>
                  {d.descC1Pct > 0 ? (
                    <td style={{ border: `1px solid ${BORDER}`, borderRadius: 7, padding: "10px 8px", textAlign: "center", width: "50%", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>DESC. CUOTA 1</div>
                      <div style={{ fontSize: 30, fontWeight: 900, color: NAVY, lineHeight: 1, marginTop: 3 }}>{Math.round(d.descC1Pct*100)}%</div>
                      <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>con TC</div>
                    </td>
                  ) : d.bono > 0 ? (
                    <td style={{ border: `1px solid ${BORDER}`, borderRadius: 7, padding: "10px 8px", textAlign: "center", width: "50%", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>BONO FORD</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: NAVY, marginTop: 3 }}>{fmt(d.bono)}</div>
                      <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>en facturación</div>
                    </td>
                  ) : (
                    <td style={{ border: `1px solid ${BORDER}`, borderRadius: 7, padding: "10px 8px", textAlign: "center", width: "50%", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>REGALOS</div>
                      <div style={{ fontSize: 30, fontWeight: 900, color: NAVY, lineHeight: 1, marginTop: 3 }}>{d.regalo}</div>
                      <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>alícuota{d.regalo!==1?"s":""}</div>
                    </td>
                  )}
                </tr></tbody>
              </table>

              {/* Ahorro total — con 2 categorías si es Transit fijo */}
              <div style={{ background: "#15803d", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Ahorro total directo</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>{fmt(d.totalAhorro)}</div>

                {d.isTransitFixed ? (
                  <>
                    {/* Categoría 1: Beneficios para retirar */}
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "0.5px solid rgba(255,255,255,0.25)" }}>
                      <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.75)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Beneficios para retirar: {fmt(d.beneficiosRetiro)}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {d.ahorroPatent > 0 && <span style={{ background: "rgba(255,255,255,0.15)", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "2px 9px", fontSize: 9.5, color: "#fff", fontWeight: 600 }}>Patent: {fmt(d.ahorroPatent)}</span>}
                        {d.descC1Pct > 0 && <span style={{ background: "rgba(255,255,255,0.15)", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "2px 9px", fontSize: 9.5, color: "#fff", fontWeight: 600 }}>C1: {fmt(d.descC1Monto)}</span>}
                      </div>
                    </div>
                    {/* Categoría 2: Beneficios post retiro */}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid rgba(255,255,255,0.25)" }}>
                      <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.75)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Beneficios post retiro: {fmt(d.beneficiosPost)}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        <span style={{ background: "rgba(255,255,255,0.15)", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "2px 9px", fontSize: 9.5, color: "#fff", fontWeight: 600 }}>3 services: {fmt(p.transitFixed.serviceUnit * p.transitFixed.servicesCount)}</span>
                        <span style={{ background: "rgba(255,255,255,0.15)", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "2px 9px", fontSize: 9.5, color: "#fff", fontWeight: 600 }}>2 alícuotas: {fmt(p.transitFixed.alicuotasPost)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {d.ahorroPatent > 0 && <span style={{ background: "rgba(255,255,255,0.15)", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "2px 9px", fontSize: 9.5, color: "#fff", fontWeight: 600 }}>Patent: {fmt(d.ahorroPatent)}</span>}
                    {d.descC1Pct > 0 && <span style={{ background: "rgba(255,255,255,0.15)", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "2px 9px", fontSize: 9.5, color: "#fff", fontWeight: 600 }}>C1: {fmt(d.descC1Monto)}</span>}
                    {d.bono > 0 && <span style={{ background: "rgba(255,255,255,0.15)", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "2px 9px", fontSize: 9.5, color: "#fff", fontWeight: 600 }}>Bono: {fmt(d.bono)}</span>}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", marginBottom: 7 }}>Si pagás de más mensual:</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ fontSize: 11, color: GRAY, padding: "4px 0", borderBottom: `0.5px solid ${BORDER}` }}>{fmt(d.proj1Monthly)}/mes</td>
                    <td style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textAlign: "right", padding: "4px 0", borderBottom: `0.5px solid ${BORDER}` }}>cancela en {d.proj1Months} meses</td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 11, color: GRAY, paddingTop: 4 }}>{fmt(d.proj2Monthly)}/mes</td>
                    <td style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textAlign: "right", paddingTop: 4 }}>cancela en {d.proj2Months} meses</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER */}
      <div style={{ padding: "8px 22px 10px", borderTop: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: 8, color: "#9ca3af", lineHeight: 1.6, margin: 0 }}>
          * Valores de referencia según valor móvil 01/06/2026.{" "}
          {(d.isAAC || d.isTransitFixed) ? `Adjudicación garantizada en cuota ${d.adjCuota}. ` : "Cuotas fijas por contrato de la 3 a la 13. "}
          {d.isTransitFixed ? "Beneficios post retiro: 3 primeros services bonificados al 100% (valor estimado) y 2 alícuotas bonificadas. " : ""}
          {d.inclPatent ? `El beneficio del ${Math.round(d.bonifPatentPct*100)}% aplica sobre aranceles de patentamiento. ` : ""}
          {d.descC1Pct > 0 ? `El descuento del ${Math.round(d.descC1Pct*100)}% en cuota 1 es mediante reintegro o descuento directo con Tarjeta de Crédito. ` : ""}
          Sujeto a peritaje final del usado y aprobación crediticia de Ford Plan Óvalo.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [step, setStep] = useState("form");
  const [result, setResult] = useState(null);
  const [clientName, setClientName] = useState("");
  const [planKey, setPlanKey] = useState("ranger_xl");
  const [retiroName, setRetiroName] = useState("Maverick XLT");
  const [capital, setCapital] = useState("");
  const [bonifPatStr, setBonifPatStr] = useState("50");
  const [descC1Str, setDescC1Str] = useState("0");
  const [validez, setValidez] = useState("20/06/26");
  const [fotoUrl, setFotoUrl] = useState("");
  const [customFoto, setCustomFoto] = useState(false);
  const [logoBase64, setLogoBase64] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [inclGastos, setInclGastos] = useState(true);
  const [inclDiff, setInclDiff] = useState(true);
  const [inclPatent, setInclPatent] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    imageToBase64("/logofordgoldstein.png").then(b64 => { if (b64) setLogoBase64(b64); });
  }, []);

  const handleImg = useCallback((e, setter, setCustom) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => { setter(ev.target.result); if (setCustom) setCustom(true); };
    r.readAsDataURL(file);
  }, []);

  const parseCap = s => parseFloat((s||"0").replace(/\./g,"").replace(/,/g,"").replace(/\$/g,"")) || 0;
  const getBonifPct = () => clamp(parseFloat(bonifPatStr)||0, 0, 100) / 100;
  const getDescC1Pct = () => clamp(parseFloat(descC1Str)||0, 0, 50) / 100;

  const updateRetiro = name => {
    setRetiroName(name);
    if (!customFoto && MODEL_PHOTOS[name]) {
      imageToBase64(MODEL_PHOTOS[name].principal).then(b64 => setFotoUrl(b64 || MODEL_PHOTOS[name].principal));
    } else if (!customFoto) { setFotoUrl(""); }
  };

  const planSel = PLANS[planKey];
  const isTransitFixedSel = planKey === "transit_van" && isTransit(retiroName);

  const handleCalc = () => {
    setError("");
    if (!clientName.trim()) { setError("Ingresá el nombre del cliente."); return; }
    const cap = parseCap(capital);
    // En Transit fijo no se requiere capital
    if (!isTransitFixedSel && !cap) { setError("Ingresá el capital disponible."); return; }
    const r = calculate(planKey, retiroName, cap, getBonifPct(), getDescC1Pct(), inclGastos, inclDiff, inclPatent);
    if (!r) { setError("Error en el cálculo."); return; }
    if (!r.isTransitFixed && r.ofertaReal < 0) { setError(`La oferta es negativa (${fmt(r.ofertaReal)}). El capital no cubre los gastos.`); return; }
    setResult(r); setStep("preview");
  };

  const handleExportPDF = async () => {
    const el = printRef.current;
    if (!el) return;
    setExporting(true);
    try {
      await html2pdf().set({
        margin: 0,
        filename: `Simulacion-${clientName.replace(/\s+/g,"-")}.pdf`,
        image: { type: "jpeg", quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: false, letterRendering: true, width: 794, windowWidth: 794, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait", hotfixes: ["px_scaling"] }
      }).from(el).save();
    } catch (err) { console.error(err); window.print(); }
    setExporting(false);
  };

  const IS = { width: "100%", padding: "10px 12px", border: "2px solid #cbd5e1", borderRadius: 8, fontSize: 14, outline: "none", background: "#f8fafc", boxSizing: "border-box" };
  const LS = { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" };
  const cap = parseCap(capital);
  const liveCalc = (isTransitFixedSel || cap > 0) ? calculate(planKey, retiroName, cap, getBonifPct(), getDescC1Pct(), inclGastos, inclDiff, inclPatent) : null;

  const CB = ({ checked, onChange, label }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "7px 10px", background: checked ? "#eff6ff" : "#f8fafc", border: `1.5px solid ${checked ? "#3b82f6" : "#cbd5e1"}`, borderRadius: 7, marginBottom: 6, userSelect: "none" }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? "#3b82f6" : "#94a3b8"}`, background: checked ? "#3b82f6" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {checked && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={{ fontSize: 13, color: checked ? "#1d4ed8" : "#64748b", fontWeight: checked ? 600 : 400 }}>{label}</span>
    </label>
  );

  if (step === "form") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a1628, #152a4a, #0d2137)", padding: "20px 12px" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            {logoBase64 ? <img src={logoBase64} alt="Ford Goldstein" style={{ height: 52, marginBottom: 8, background: "white", padding: "6px 16px", borderRadius: 8 }} />
              : <div style={{ fontSize: 18, fontWeight: 900, color: "white", marginBottom: 8 }}>Ford | Goldstein</div>}
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: "4px 0" }}>Simulador Óvalo</h1>
            <div style={{ fontSize: 12, color: "#6b8db5" }}>Motor de cálculo integrado — Valores Junio 2026</div>
          </div>

          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={LS}>Nombre del Cliente</label>
              <input style={IS} placeholder="Ej: Jorgelina" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={LS}>Plan de Suscripción</label>
                <select style={IS} value={planKey} onChange={e => setPlanKey(e.target.value)}>
                  {Object.entries(PLANS).map(([k,p]) => <option key={k} value={k}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label style={LS}>Modelo de Retiro</label>
                <select style={IS} value={retiroName} onChange={e => updateRetiro(e.target.value)}>
                  {RETIRO_MODELS.map(g => (
                    <optgroup key={g.group} label={`── ${g.group} ──`}>
                      {g.models.map(m => <option key={m.name} value={m.name}>{m.name} — {fmt(m.vm)}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            {/* Capital — oculto en modo Transit fijo */}
            {!isTransitFixedSel && (
              <div style={{ marginBottom: 16 }}>
                <label style={LS}>Capital Disponible del Cliente ($)</label>
                <input style={IS} placeholder="20000000" value={capital} onChange={e => setCapital(e.target.value)} />
                {cap > 0 && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{fmt(cap)}</div>}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={LS}>Bonif. Patent. (%)</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...IS, paddingRight: 30 }} type="number" min="0" max="100" placeholder="50"
                    value={bonifPatStr} onChange={e => setBonifPatStr(e.target.value)}
                    onBlur={e => setBonifPatStr(String(clamp(parseFloat(e.target.value)||0,0,100)))} />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 700, pointerEvents: "none" }}>%</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>
                  Ahorro: {fmt((allRetiroModels.find(m=>m.name===retiroName)?.vm||0)*0.07*getBonifPct())}
                </div>
              </div>
              <div>
                <label style={LS}>Desc. C1 (TC) (%)</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...IS, paddingRight: 30 }} type="number" min="0" max="50" placeholder="0"
                    value={descC1Str} onChange={e => setDescC1Str(e.target.value)}
                    onBlur={e => setDescC1Str(String(clamp(parseFloat(e.target.value)||0,0,50)))} />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 700, pointerEvents: "none" }}>%</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>
                  {getDescC1Pct()>0 ? `Desc: ${fmt(PLANS[planKey]?.c1*getDescC1Pct())}` : "Sin descuento"}
                </div>
              </div>
              <div>
                <label style={LS}>Válido hasta</label>
                <input style={IS} value={validez} onChange={e => setValidez(e.target.value)} />
              </div>
            </div>

            {/* Gastos opcionales — ocultos en modo Transit fijo */}
            {!isTransitFixedSel && (
              <div style={{ marginBottom: 16, padding: 14, background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
                <label style={{ ...LS, marginBottom: 10 }}>Incluir en Licitación</label>
                <CB checked={inclGastos} onChange={e => setInclGastos(e.target.checked)} label={`Gastos de gestión — ${fmt(1500000)}`} />
                <CB checked={inclDiff} onChange={e => setInclDiff(e.target.checked)}
                  label={`Diferencia de modelo — ${(() => { const vm=allRetiroModels.find(m=>m.name===retiroName)?.vm||0; const diff=vm>(PLANS[planKey]?.vm||0)?vm-(PLANS[planKey]?.vm||0):0; return diff>0?fmt(diff):"$0"; })()}`} />
                <CB checked={inclPatent} onChange={e => setInclPatent(e.target.checked)}
                  label={`Patentamiento (${Math.round(getBonifPct()*100)}% bonif.) — ${fmt((allRetiroModels.find(m=>m.name===retiroName)?.vm||0)*0.07*(1-getBonifPct()))}`} />
              </div>
            )}

            <div style={{ marginBottom: 20, padding: 14, background: "#f1f5f9", borderRadius: 10 }}>
              <label style={LS}>Foto Unidad {MODEL_PHOTOS[retiroName] && !customFoto ? "(auto)" : ""}</label>
              <input type="file" accept="image/*" onChange={e => handleImg(e, setFotoUrl, setCustomFoto)} style={{ fontSize: 11 }} />
              {fotoUrl && <img src={fotoUrl} alt="" style={{ height: 40, marginTop: 6, objectFit: "contain" }} />}
            </div>

            {isTransitFixedSel && (
              <div style={{ background: "#ecfdf5", border: "2px solid #34d399", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#047857" }}>
                ✓ <strong>Transit · Adjudicación asegurada cuota 3:</strong> Esquema fijo. No requiere capital. Incluye beneficios post retiro (3 services + 2 alícuotas bonificadas).
              </div>
            )}
            {planKey === "ranger_aac3" && (
              <div style={{ background: "#ecfdf5", border: "2px solid #34d399", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#047857" }}>
                ✓ <strong>Ranger · Adjudicación asegurada cuota 3:</strong> El cliente integra el 20% y tiene 3 cuotas pagas al adjudicar.
              </div>
            )}
            {planKey === "territory_sel" && (
              <div style={{ background: "#fef3c7", border: "2px solid #f59e0b", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#92400e" }}>
                🏷️ <strong>Territory:</strong> Cuota fija $457.000 (cuota 2 a 13).
              </div>
            )}

            {liveCalc && (isTransitFixedSel || liveCalc.ofertaReal > 0) && (
              <div style={{ background: "#eff6ff", border: "2px solid #93c5fd", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#001f5b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Vista Rápida</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                  {[
                    [liveCalc.isTransitFixed ? "Retiro" : (liveCalc.isAAC ? "Oferta" : "Puja"), liveCalc.isTransitFixed ? fmt(liveCalc.plan.intMin) : fmt(liveCalc.ofertaReal), liveCalc.isTransitFixed ? "integr." : `${liveCalc.pujaPct.toFixed(1)}% VM`, liveCalc.isTransitFixed ? "#16a34a" : liveCalc.probColor],
                    ["Canceladas", `${liveCalc.nAdelanto+liveCalc.regalo}`, "cuotas", "#16a34a"],
                    ["Restantes", `${liveCalc.cuotasRestantes}`, `de ${liveCalc.plan.cuotas}`, "#001f5b"],
                    ["Ahorro", fmt(liveCalc.totalAhorro), "total", "#16a34a"]
                  ].map(([title,val,sub,color],i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>{title}</div>
                      <div style={{ fontWeight: 900, fontSize: 15, color }}>{val}</div>
                      <div style={{ fontSize: 9, color }}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>{error}</div>}

            <button onClick={handleCalc} style={{ width: "100%", padding: 16, background: "linear-gradient(135deg, #001f5b, #0056b3)", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 900, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, boxShadow: "0 4px 20px rgba(0,31,91,0.4)" }}>
              Generar Simulación
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#e2e8f0", padding: 16 }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="no-print" style={{ maxWidth: 820, margin: "0 auto 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <button onClick={() => setStep("form")} style={{ padding: "10px 20px", background: "white", border: "2px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#333" }}>
          ← Volver
        </button>
        <button onClick={handleExportPDF} disabled={exporting} style={{ padding: "10px 28px", background: exporting ? "#6b7280" : "#001f5b", color: "white", border: "none", borderRadius: 8, cursor: exporting ? "wait" : "pointer", fontWeight: 900, fontSize: 14 }}>
          {exporting ? "Generando PDF..." : "Descargar PDF"}
        </button>
      </div>
      <div style={{ maxWidth: 794, margin: "0 auto", background: "white", borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <div ref={printRef} style={{ width: 794 }}>
          <DocPreview data={result} clientName={clientName} validez={validez} logoBase64={logoBase64} fotoUrl={fotoUrl} />
        </div>
      </div>
    </div>
  );
}
