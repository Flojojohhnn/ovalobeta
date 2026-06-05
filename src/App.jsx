import { useState, useCallback, useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";

// ============================================================
// PLANES JUNIO 2026
// adjCuota: cuota de adjudicación asegurada (3 para AAC3). null = licitación normal C2.
// cuotasPagas: cuotas consideradas pagadas al adjudicar (2 normal, 3 en AAC3).
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
    cuotasPagas: 3, adjCuota: 3, intCuotaLabel: "Integración mínima (30%)"
  }
};

// ============================================================
// MODELOS DE RETIRO (VM JUNIO 2026)
// ============================================================
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

  let bono = 0, regalo = 0;
  if (plan.bono?.condition === "ranger" && isRanger(retiroName)) bono = plan.bono.amount;
  if (plan.regaloCondition === "ranger" && isRanger(retiroName)) regalo = plan.regalo;
  else if (!plan.regaloCondition && plan.regalo > 0) regalo = plan.regalo;

  let saldoAdelanto = Math.max(0, ofertaReal - plan.intMin) + bono;
  if (vmRetiro < vmPlan) saldoAdelanto += vmPlan - vmRetiro;

  const nAdelanto = Math.max(0, Math.floor(saldoAdelanto / plan.ap));
  const cuotasRestantes = plan.cuotas - nAdelanto - plan.cuotasPagas;
  const pujaPct = vmPlan > 0 ? (ofertaReal / vmPlan) * 100 : 0;

  let prob = "BAJA", probColor = "#ef4444";
  if (pujaPct >= 25) { prob = "ALTA"; probColor = "#22c55e"; }
  else if (pujaPct >= 20) { prob = "MEDIA-ALTA"; probColor = "#f59e0b"; }
  else if (pujaPct >= 15) { prob = "MEDIA"; probColor = "#f97316"; }

  const ahorroPatent = inclPatent ? patBruto * bonifPatentPct : 0;
  const descC1Monto = plan.c1 * descC1Pct;

  return {
    plan, planKey, vmPlan, vmRetiro, retiroName, gastosGestion, diffModelo,
    patBruto, patNeto, bonifPatentPct, inclGastos, inclDiff, inclPatent,
    ofertaReal, bono, regalo, nAdelanto, cuotasRestantes, pujaPct, prob, probColor,
    ahorroPatent, descC1Pct, descC1Monto, c1Display: plan.c1 - descC1Monto,
    proj1Monthly: plan.cf + plan.ap, proj1Months: Math.ceil(cuotasRestantes / 2),
    proj2Monthly: plan.cf + 2 * plan.ap, proj2Months: Math.ceil(cuotasRestantes / 3),
    totalAhorro: ahorroPatent + descC1Monto, capital, isAAC, adjCuota: plan.adjCuota
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
  const BLUE = "#075ca8";
  const INK = "#172033";
  const MUTED = "#64748b";
  const BORDER = "#dbe3ec";
  const SOFT = "#f4f7fb";
  const GREEN = "#147a4f";
  const W = 794;
  const isRangerAAC = d.planKey === "ranger_aac3";
  const intLabel = p.intCuotaLabel || `Integración mínima (${Math.round(p.intMinPct * 100)}%)`;
  const mainBenefit = d.bono > d.totalAhorro
    ? { label: "Bono Ford", value: fmt(d.bono), detail: "Aplicado en la facturación de la unidad" }
    : d.totalAhorro > 0
      ? { label: "Ahorro directo", value: fmt(d.totalAhorro), detail: "Bonificaciones aplicadas a esta propuesta" }
      : d.regalo > 0
        ? { label: "Beneficio incluido", value: `${d.regalo} cuota${d.regalo !== 1 ? "s" : ""}`, detail: "Cuotas adicionales canceladas" }
        : { label: "Plan seleccionado", value: `${p.ratio}`, detail: `${p.cuotas} cuotas totales` };

  const scheduleRows = isRangerAAC
    ? [
        ["Cuota 1 · Suscripción", fmt(d.c1Display), d.descC1Pct > 0 ? `${Math.round(d.descC1Pct * 100)}% de descuento aplicado` : "Importe inicial"],
        ["Cuotas 2 a 3", fmt(p.schedule.c2_3), "Etapa de adjudicación"],
        ["Cuotas 4 a 16", fmt(p.schedule.c4_16), "Cuota fija"],
        ["Desde cuota 17", "Decreciente", "Según saldo del plan"]
      ]
    : [
        ["Cuota 1 · Suscripción", fmt(d.c1Display), d.descC1Pct > 0 ? `${Math.round(d.descC1Pct * 100)}% de descuento aplicado` : "Importe inicial"],
        [d.isAAC ? "Cuotas 2 a 3" : "Cuota 2 · Licitación", fmt(p.schedule.c2_13), d.isAAC ? "Etapa de adjudicación" : "Cuota de participación"],
        ["Cuotas 3 a 13", fmt(p.schedule.c2_13), "Cuota fija por contrato"],
        ["Cuotas 14 a 16", fmt(p.schedule.c14_16), "Siguiente etapa"],
        ["Desde cuota 17", "Decreciente", "Según saldo del plan"]
      ];

  const includedCosts = [
    d.inclGastos && ["Gastos de gestión", fmt(d.gastosGestion)],
    d.inclDiff && ["Diferencia de modelo", d.diffModelo > 0 ? fmt(d.diffModelo) : "$0"],
    d.inclPatent && [`Patentamiento con ${Math.round(d.bonifPatentPct * 100)}% bonificado`, d.patNeto === 0 ? "$0" : fmt(d.patNeto)]
  ].filter(Boolean);

  const BenefitPill = ({ children }) => (
    <span style={{ display: "inline-block", padding: "4px 9px", borderRadius: 20, background: "#eaf5ef", color: GREEN, fontSize: 9.5, fontWeight: 700 }}>{children}</span>
  );

  return (
    <div style={{ width: W, minHeight: 1123, boxSizing: "border-box", fontFamily: "'Segoe UI', Arial, sans-serif", color: INK, background: "#fff", overflow: "hidden" }}>
      {/* Encabezado comercial */}
      <div style={{ padding: "20px 24px 18px", background: `linear-gradient(135deg, ${NAVY} 0%, #063e78 100%)`, color: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody><tr>
            <td style={{ width: 180, verticalAlign: "middle" }}>
              {logoBase64
                ? <img src={logoBase64} alt="Ford Goldstein" style={{ height: 47, width: "auto", maxWidth: 166, display: "block", background: "#fff", borderRadius: 8, padding: "5px 12px", boxSizing: "border-box" }} />
                : <strong style={{ fontSize: 16 }}>Ford | Goldstein</strong>}
            </td>
            <td style={{ verticalAlign: "middle", paddingLeft: 16 }}>
              <div style={{ fontSize: 9, color: "#9fc5e9", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>Propuesta personalizada para</div>
              <div style={{ marginTop: 3, fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>{clientName}</div>
            </td>
            <td style={{ width: 126, verticalAlign: "middle", textAlign: "right" }}>
              <div style={{ fontSize: 8, color: "#9fc5e9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Propuesta válida hasta</div>
              <div style={{ marginTop: 3, fontSize: 18, fontWeight: 900 }}>{validez}</div>
            </td>
          </tr></tbody>
        </table>
      </div>

      {/* Vehículo y plan */}
      <div style={{ display: "flex", minHeight: 190, padding: "22px 24px 18px", boxSizing: "border-box", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ flex: "1 1 0", paddingRight: 20 }}>
          <div style={{ fontSize: 10, color: BLUE, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.11em" }}>Tu próximo vehículo</div>
          <div style={{ marginTop: 5, color: NAVY, fontSize: 31, lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.035em" }}>{d.retiroName}</div>
          <div style={{ marginTop: 9, color: MUTED, fontSize: 12.5, lineHeight: 1.45 }}>
            Suscripción sobre <strong style={{ color: INK }}>{p.name}</strong> · Plan {p.ratio} · {p.cuotas} cuotas
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 13 }}>
            <span style={{ padding: "5px 9px", borderRadius: 5, background: "#eef4fb", color: NAVY, fontSize: 9.5, fontWeight: 800 }}>Código {p.code}</span>
            <span style={{ padding: "5px 9px", borderRadius: 5, background: "#eef4fb", color: NAVY, fontSize: 9.5, fontWeight: 800 }}>Valor móvil {fmt(d.vmRetiro)}</span>
          </div>
        </div>
        <div style={{ width: 265, height: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #f8fafc, #eef3f8)", borderRadius: 12 }}>
          {fotoUrl
            ? <img src={fotoUrl} alt={d.retiroName} style={{ maxWidth: 245, maxHeight: 138, width: "auto", height: "auto", objectFit: "contain" }} />
            : <div style={{ color: "#8a98aa", fontSize: 11, fontWeight: 700 }}>{d.retiroName}</div>}
        </div>
      </div>

      {/* Resumen decisivo */}
      <div style={{ padding: "17px 24px 19px" }}>
        <div style={{ marginBottom: 10, fontSize: 10, color: MUTED, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Resumen de tu propuesta</div>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 8 }}>
          <tbody><tr>
            <td style={{ width: "25%", padding: "13px 14px", verticalAlign: "top", background: NAVY, borderRadius: 9 }}>
              <div style={{ color: "#a8c8e8", fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Entrega inicial</div>
              <div style={{ marginTop: 5, color: "#fff", fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em" }}>{fmt(d.capital)}</div>
              <div style={{ marginTop: 5, color: "#c9dcef", fontSize: 9 }}>Capital total informado</div>
            </td>
            <td style={{ width: "25%", padding: "13px 14px", verticalAlign: "top", background: SOFT, border: `1px solid ${BORDER}`, borderRadius: 9 }}>
              <div style={{ color: MUTED, fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Cuota 1</div>
              <div style={{ marginTop: 5, color: NAVY, fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em" }}>{fmt(d.c1Display)}</div>
              <div style={{ marginTop: 5, color: MUTED, fontSize: 9 }}>{d.descC1Pct > 0 ? "Con descuento aplicado" : "Suscripción"}</div>
            </td>
            <td style={{ width: "25%", padding: "13px 14px", verticalAlign: "top", background: SOFT, border: `1px solid ${BORDER}`, borderRadius: 9 }}>
              <div style={{ color: MUTED, fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Cuota estimada</div>
              <div style={{ marginTop: 5, color: NAVY, fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em" }}>{fmt(p.cf)}</div>
              <div style={{ marginTop: 5, color: MUTED, fontSize: 9 }}>Cuota fija de referencia</div>
            </td>
            <td style={{ width: "25%", padding: "13px 14px", verticalAlign: "top", background: "#eaf7f0", border: "1px solid #b9ddc9", borderRadius: 9 }}>
              <div style={{ color: GREEN, fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>{mainBenefit.label}</div>
              <div style={{ marginTop: 5, color: GREEN, fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em" }}>{mainBenefit.value}</div>
              <div style={{ marginTop: 5, color: "#47765f", fontSize: 9 }}>{mainBenefit.detail}</div>
            </td>
          </tr></tbody>
        </table>
      </div>

      {/* Entrega y condición de adjudicación */}
      <div style={{ display: "flex", gap: 14, padding: "0 24px 18px" }}>
        <div style={{ flex: "1 1 0", padding: "15px 16px", border: `1px solid ${BORDER}`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: NAVY, fontWeight: 900 }}>Cómo se aplica tu entrega</div>
          <div style={{ marginTop: 3, color: MUTED, fontSize: 9.5 }}>Los conceptos marcados ya están contemplados dentro del capital informado.</div>
          <table style={{ width: "100%", marginTop: 9, borderCollapse: "collapse" }}>
            <tbody>
              {includedCosts.map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: "4px 0", color: MUTED, fontSize: 10, borderBottom: `1px solid ${BORDER}` }}>{label}</td>
                  <td style={{ padding: "4px 0", color: INK, fontSize: 10.5, fontWeight: 800, textAlign: "right", borderBottom: `1px solid ${BORDER}` }}>{value}</td>
                </tr>
              ))}
              <tr>
                <td style={{ paddingTop: 8, color: NAVY, fontSize: 10.5, fontWeight: 900 }}>Monto neto aplicado al plan</td>
                <td style={{ paddingTop: 8, color: NAVY, fontSize: 16, fontWeight: 900, textAlign: "right" }}>{fmt(d.ofertaReal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ width: 300, padding: "15px 16px", color: "#fff", background: `linear-gradient(135deg, ${NAVY}, ${BLUE})`, borderRadius: 10 }}>
          <div style={{ fontSize: 9, color: "#afd0ee", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em" }}>{d.isAAC ? "Adjudicación prevista" : "Condición de adjudicación"}</div>
          <div style={{ marginTop: 5, fontSize: 22, fontWeight: 900 }}>{d.isAAC ? `Cuota ${d.adjCuota} asegurada` : `${d.pujaPct.toFixed(1)}% del valor móvil`}</div>
          <div style={{ marginTop: 6, color: "#d3e5f5", fontSize: 10, lineHeight: 1.4 }}>
            {d.isAAC
              ? `${p.cuotasPagas} cuotas pagas al adjudicar y ${intLabel.toLowerCase()}.`
              : `Nivel estimado de oferta: ${d.prob}. La adjudicación por licitación depende del resultado del acto.`}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1, padding: "8px 9px", background: "rgba(255,255,255,0.11)", borderRadius: 7 }}>
              <div style={{ color: "#afd0ee", fontSize: 8, fontWeight: 700, textTransform: "uppercase" }}>Cuotas canceladas</div>
              <div style={{ marginTop: 2, fontSize: 16, fontWeight: 900 }}>{d.nAdelanto + d.regalo}</div>
            </div>
            <div style={{ flex: 1, padding: "8px 9px", background: "rgba(255,255,255,0.11)", borderRadius: 7 }}>
              <div style={{ color: "#afd0ee", fontSize: 8, fontWeight: 700, textTransform: "uppercase" }}>Cuotas restantes</div>
              <div style={{ marginTop: 2, fontSize: 16, fontWeight: 900 }}>{d.cuotasRestantes}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cronograma y beneficios */}
      <div style={{ display: "flex", gap: 14, padding: "0 24px 18px" }}>
        <div style={{ flex: "1 1 0", padding: "15px 16px", background: SOFT, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: NAVY, fontWeight: 900 }}>Tu esquema de cuotas</div>
          <div style={{ marginTop: 3, color: MUTED, fontSize: 9.5 }}>Valores de referencia por etapa del plan.</div>
          <div style={{ marginTop: 9 }}>
            {scheduleRows.map(([label, value, detail], index) => (
              <div key={label} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: index === scheduleRows.length - 1 ? "none" : `1px solid ${BORDER}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: INK, fontSize: 10.5, fontWeight: 800 }}>{label}</div>
                  <div style={{ marginTop: 1, color: MUTED, fontSize: 8.5 }}>{detail}</div>
                </div>
                <div style={{ color: NAVY, fontSize: 13, fontWeight: 900 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: 300, padding: "15px 16px", border: `1px solid ${BORDER}`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: NAVY, fontWeight: 900 }}>Beneficios incluidos</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
            {d.inclPatent && <BenefitPill>{Math.round(d.bonifPatentPct * 100)}% de patentamiento bonificado</BenefitPill>}
            {d.descC1Pct > 0 && <BenefitPill>{Math.round(d.descC1Pct * 100)}% de descuento en cuota 1</BenefitPill>}
            {d.bono > 0 && <BenefitPill>Bono Ford de {fmt(d.bono)}</BenefitPill>}
            {d.regalo > 0 && <BenefitPill>{d.regalo} cuota{d.regalo !== 1 ? "s" : ""} de regalo</BenefitPill>}
          </div>
          <div style={{ marginTop: 13, paddingTop: 11, borderTop: `1px solid ${BORDER}` }}>
            <div style={{ color: MUTED, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>Integración requerida</div>
            <div style={{ marginTop: 3, color: NAVY, fontSize: 16, fontWeight: 900 }}>{fmt(p.intMin)}</div>
            <div style={{ marginTop: 2, color: MUTED, fontSize: 9 }}>{intLabel}</div>
          </div>
          <div style={{ marginTop: 10, color: MUTED, fontSize: 9, lineHeight: 1.45 }}>
            Si el cliente adelanta cuotas mensualmente, puede reducir el plazo estimado a {d.proj1Months} o {d.proj2Months} meses según el monto aplicado.
          </div>
        </div>
      </div>

      {/* Próximo paso */}
      <div style={{ margin: "0 24px 14px", padding: "14px 17px", display: "flex", alignItems: "center", background: "#edf5fd", border: "1px solid #bfd5ea", borderRadius: 10 }}>
        <div style={{ width: 35, height: 35, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: BLUE, borderRadius: "50%", fontSize: 18, fontWeight: 900 }}>→</div>
        <div style={{ flex: 1, paddingLeft: 12 }}>
          <div style={{ color: BLUE, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Próximo paso</div>
          <div style={{ marginTop: 2, color: NAVY, fontSize: 14, fontWeight: 900 }}>Confirmá esta propuesta con tu asesor</div>
          <div style={{ marginTop: 2, color: MUTED, fontSize: 9.5 }}>Validá disponibilidad de la unidad, peritaje del usado y documentación para avanzar.</div>
        </div>
      </div>

      {/* Condiciones */}
      <div style={{ padding: "10px 24px 12px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ color: NAVY, fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Condiciones importantes</div>
        <p style={{ margin: 0, color: "#7b8797", fontSize: 7.8, lineHeight: 1.5 }}>
          Valores de referencia según valor móvil 01/06/2026. {d.isAAC ? `Adjudicación garantizada en cuota ${d.adjCuota}. ` : "Cuotas fijas por contrato de la 3 a la 13. "}
          {d.inclPatent ? `El beneficio del ${Math.round(d.bonifPatentPct * 100)}% aplica sobre aranceles de patentamiento. ` : ""}
          {d.descC1Pct > 0 ? `El descuento del ${Math.round(d.descC1Pct * 100)}% en cuota 1 es mediante reintegro o descuento directo con Tarjeta de Crédito. ` : ""}
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

  const handleCalc = () => {
    setError("");
    if (!clientName.trim()) { setError("Ingresá el nombre del cliente."); return; }
    const cap = parseCap(capital);
    if (!cap) { setError("Ingresá el capital disponible."); return; }
    const r = calculate(planKey, retiroName, cap, getBonifPct(), getDescC1Pct(), inclGastos, inclDiff, inclPatent);
    if (!r) { setError("Error en el cálculo."); return; }
    if (r.ofertaReal < 0) { setError(`La oferta es negativa (${fmt(r.ofertaReal)}). El capital no cubre los gastos.`); return; }
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
  const liveCalc = cap > 0 ? calculate(planKey, retiroName, cap, getBonifPct(), getDescC1Pct(), inclGastos, inclDiff, inclPatent) : null;

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
            <div style={{ marginBottom: 16 }}>
              <label style={LS}>Capital Disponible del Cliente ($)</label>
              <input style={IS} placeholder="20000000" value={capital} onChange={e => setCapital(e.target.value)} />
              {cap > 0 && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{fmt(cap)}</div>}
            </div>
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

            <div style={{ marginBottom: 16, padding: 14, background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
              <label style={{ ...LS, marginBottom: 10 }}>Incluir en Licitación</label>
              <CB checked={inclGastos} onChange={e => setInclGastos(e.target.checked)} label={`Gastos de gestión — ${fmt(1500000)}`} />
              <CB checked={inclDiff} onChange={e => setInclDiff(e.target.checked)}
                label={`Diferencia de modelo — ${(() => { const vm=allRetiroModels.find(m=>m.name===retiroName)?.vm||0; const diff=vm>(PLANS[planKey]?.vm||0)?vm-(PLANS[planKey]?.vm||0):0; return diff>0?fmt(diff):"$0"; })()}`} />
              <CB checked={inclPatent} onChange={e => setInclPatent(e.target.checked)}
                label={`Patentamiento (${Math.round(getBonifPct()*100)}% bonif.) — ${fmt((allRetiroModels.find(m=>m.name===retiroName)?.vm||0)*0.07*(1-getBonifPct()))}`} />
            </div>

            <div style={{ marginBottom: 20, padding: 14, background: "#f1f5f9", borderRadius: 10 }}>
              <label style={LS}>Foto Unidad {MODEL_PHOTOS[retiroName] && !customFoto ? "(auto)" : ""}</label>
              <input type="file" accept="image/*" onChange={e => handleImg(e, setFotoUrl, setCustomFoto)} style={{ fontSize: 11 }} />
              {fotoUrl && <img src={fotoUrl} alt="" style={{ height: 40, marginTop: 6, objectFit: "contain" }} />}
            </div>

            {(planKey === "ranger_aac3" || planKey === "transit_van") && (
              <div style={{ background: "#ecfdf5", border: "2px solid #34d399", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#047857" }}>
                ✓ <strong>Adjudicación asegurada en cuota 3:</strong> El cliente integra el {Math.round(PLANS[planKey].intMinPct*100)}% y tiene 3 cuotas pagas al adjudicar.
              </div>
            )}
            {planKey === "territory_sel" && (
              <div style={{ background: "#fef3c7", border: "2px solid #f59e0b", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#92400e" }}>
                🏷️ <strong>Territory:</strong> Cuota fija $457.000 (cuota 2 a 13).
              </div>
            )}

            {liveCalc && liveCalc.ofertaReal > 0 && (
              <div style={{ background: "#eff6ff", border: "2px solid #93c5fd", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#001f5b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Vista Rápida</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                  {[
                    [liveCalc.isAAC ? "Oferta" : "Puja", fmt(liveCalc.ofertaReal), `${liveCalc.pujaPct.toFixed(1)}% VM`, liveCalc.probColor],
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
