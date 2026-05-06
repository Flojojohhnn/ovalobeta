import { useState, useCallback, useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";

// ============================================================
// DATA: PLANES DE SUSCRIPCIÓN (MAYO 2026)
// ============================================================
const PLANS = {
  ranger_xl: {
    name: "Ranger XL 4x2", label: "Ranger XL 4x2 (80/20 - 120c)", ratio: "80/20", cuotas: 120,
    vm: 50962700, ap: 339751, c1: 380000, cf: 509000, intMinPct: 0.20, intMin: 10192540,
    schedule: { c2_13: 509000, c14_16: 502000 },
    bono: { amount: 2321073, condition: "ranger" }, regalo: 1, regaloCondition: "ranger"
  },
  ranger_xl_100: {
    name: "Ranger XL 4x2 100%", label: "Ranger XL 4x2 (100% - 84c)", ratio: "100%", cuotas: 84,
    vm: 50962700, ap: 607000, c1: 680000, cf: 808000, intMinPct: 0, intMin: 0,
    schedule: { c2_13: 808000, c14_16: 808000 },
    bono: null, regalo: 0, regaloCondition: null, intCuota5: 24000000
  },
  ranger_xls_v6: {
    name: "Ranger XLS V6", label: "Ranger XLS V6 (80/20 - 120c)", ratio: "80/20", cuotas: 120,
    vm: 66497510, ap: 443317, c1: 520000, cf: 665000, intMinPct: 0.20, intMin: 13299502,
    schedule: { c2_13: 665000, c14_16: 589000 },
    bono: { amount: 2123844, condition: "ranger" }, regalo: 1, regaloCondition: "ranger"
  },
  maverick_xlt: {
    name: "Maverick XLT", label: "Maverick XLT (70/30 - 84c)", ratio: "70/30", cuotas: 84,
    vm: 56627500, ap: 471896, c1: 510000, cf: 671000, intMinPct: 0.30, intMin: 16988250,
    schedule: { c2_13: 671000, c14_16: 604000 },
    bono: null, regalo: 0, regaloCondition: null
  },
  territory_sel: {
    name: "Territory SEL", label: "Territory SEL (70/30 - 84c)", ratio: "70/30", cuotas: 84,
    vm: 48110210, ap: 400000, c1: 320000, cf: 450000, intMinPct: 0.30, intMin: 14433063,
    schedule: { c2_13: 450000, c14_16: 560000 },
    bono: null, regalo: 0, regaloCondition: null,
    promo: "30% bonif. sobre alícuota cuota 1 a 13 (promo mayo)"
  },
  transit_van: {
    name: "Transit Van", label: "Transit Van (70/30 - 84c)", ratio: "70/30", cuotas: 84,
    vm: 66279520, ap: 552329, c1: 620000, cf: 786000, intMinPct: 0.30, intMin: 19883856,
    schedule: { c2_13: 786000, c14_16: 707000 },
    bono: null, regalo: 2, regaloCondition: null
  }
};

const RETIRO_MODELS = [
  { group: "Ranger", models: [
    { name: "Ranger XL 4x2 MT", vm: 50962700 }, { name: "Ranger XL 4x2 AT", vm: 51400000 },
    { name: "Ranger XL 4x4 MT", vm: 55685660 }, { name: "Ranger XL 4x4 AT", vm: 56200000 },
    { name: "Ranger CS XL 4x2 MT", vm: 43500000 }, { name: "Ranger CS XL 4x4 MT", vm: 52000000 },
    { name: "Ranger CH XL 4x4 MT", vm: 49500000 }, { name: "Ranger XLS 2.0 MT", vm: 56090750 },
    { name: "Ranger XLS V6", vm: 66497510 }, { name: "Ranger XLT 2.0 AT 4x2", vm: 68727000 },
    { name: "Ranger XLT 2.0 AT 4x4", vm: 74446800 }, { name: "Ranger XLT V6", vm: 75998200 },
    { name: "Ranger Black 4x4 MT", vm: 65975500 }, { name: "Ranger Black 4x2 AT", vm: 63800000 },
    { name: "Ranger LTD 2.0 4x4", vm: 80607900 }, { name: "Ranger LTD+ V6", vm: 84291660 },
    { name: "Ranger Raptor", vm: 114390000 }
  ]},
  { group: "SUV / Pickups", models: [
    { name: "Territory SEL", vm: 48110210 }, { name: "Territory Titanium", vm: 56032510 },
    { name: "Territory Trend HEV", vm: 51400580 }, { name: "Maverick XLT", vm: 56627500 },
    { name: "Maverick Tremor", vm: 70024300 }, { name: "Maverick Lariat FHEV", vm: 67849300 },
    { name: "Everest Titanium", vm: 89560510 }, { name: "Bronco Sport Big Bend", vm: 61248810 },
    { name: "Bronco Sport Badlands", vm: 68188280 }, { name: "Big Bronco", vm: 103230000 },
    { name: "Bronco Badlands", vm: 103230000 }, { name: "Kuga Platinum", vm: 84718400 },
    { name: "F-150 Híbrida Lariat", vm: 114390000 }, { name: "F-150 Raptor", vm: 146475000 },
    { name: "F-150 Tremor", vm: 114390000 }
  ]},
  { group: "Transit", models: [
    { name: "Transit Chasis", vm: 73807010 }, { name: "Transit Van Mediana TN", vm: 66279520 },
    { name: "Transit Van Mediana TE", vm: 69914010 }, { name: "Transit Van Larga TE MT", vm: 75142890 },
    { name: "Transit Van Larga TE AT", vm: 79285960 }, { name: "Transit Minibus MT", vm: 96222240 },
    { name: "Transit Minibus AT", vm: 101868100 }
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
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = url + "?t=" + Date.now();
  });
}

// ============================================================
// MOTOR DE CÁLCULO
// ============================================================
function calculate(planKey, retiroName, capital, bonifPatentPct, descC1Pct) {
  const plan = PLANS[planKey];
  const retiro = allRetiroModels.find(m => m.name === retiroName);
  if (!plan || !retiro) return null;

  const vmPlan = plan.vm, vmRetiro = retiro.vm;
  const gastosGestion = 1500000;
  const diffModelo = vmRetiro > vmPlan ? vmRetiro - vmPlan : 0;
  const patBruto = vmRetiro * 0.07;
  const patNeto = patBruto * (1 - bonifPatentPct);
  const ofertaReal = capital - (diffModelo + gastosGestion + patNeto);
  const is100 = plan.ratio === "100%";

  let bono = 0, regalo = 0;
  if (!is100 && plan.bono?.condition === "ranger" && isRanger(retiroName)) bono = plan.bono.amount;
  if (plan.regaloCondition === "ranger" && isRanger(retiroName)) regalo = plan.regalo;
  else if (!plan.regaloCondition && plan.regalo > 0) regalo = plan.regalo;

  let saldoAdelanto = is100 ? ofertaReal : Math.max(0, ofertaReal - plan.intMin) + bono;
  if (vmRetiro < vmPlan) saldoAdelanto += vmPlan - vmRetiro;

  const nAdelanto = Math.max(0, Math.floor(saldoAdelanto / plan.ap));
  const cuotasRestantes = plan.cuotas - nAdelanto - 2;
  const pujaPct = vmPlan > 0 ? (ofertaReal / vmPlan) * 100 : 0;

  let prob = "BAJA", probColor = "#ef4444";
  if (pujaPct >= 25) { prob = "ALTA"; probColor = "#22c55e"; }
  else if (pujaPct >= 20) { prob = "MEDIA-ALTA"; probColor = "#f59e0b"; }
  else if (pujaPct >= 15) { prob = "MEDIA"; probColor = "#f97316"; }

  const ahorroPatent = patBruto * bonifPatentPct;
  const descC1Monto = plan.c1 * descC1Pct;

  return {
    plan, planKey, vmPlan, vmRetiro, retiroName, gastosGestion, diffModelo,
    patBruto, patNeto, bonifPatentPct, ofertaReal, bono, regalo,
    nAdelanto, cuotasRestantes, pujaPct, prob, probColor,
    ahorroPatent, descC1Pct, descC1Monto, c1Display: plan.c1 - descC1Monto,
    proj1Monthly: plan.cf + plan.ap, proj1Months: Math.ceil(cuotasRestantes / 2),
    proj2Monthly: plan.cf + 2 * plan.ap, proj2Months: Math.ceil(cuotasRestantes / 3),
    totalAhorro: ahorroPatent + descC1Monto, capital, is100
  };
}

// ============================================================
// DOCUMENTO — fiel al boceto
// Layout:
//   HEADER azul: logo izq | fecha der — nombre cliente — 3 KPIs en fila completa
//   FILA 1: Plan vehículo (con foto centrada) | Licitación
//   FILA 2: Cuotas | Beneficios
//   FOOTER legal
//
// Reglas PDF:
//   - Tablas HTML en lugar de CSS grid/flex complejos
//   - Ancho fijo 794px (A4 en 96dpi menos márgenes)
//   - Sin min-height en bloques de color
//   - Imágenes en cajas fijas con width/height explícitos
//   - Sin mixBlendMode ni gradientes complejos
// ============================================================
function DocPreview({ data, clientName, validez, logoBase64, fotoUrl }) {
  if (!data) return null;
  const d = data, p = d.plan;

  const NAVY = "#001f5b";
  const BORDER = "#e5e7eb";
  const GRAY = "#6b7280";
  const W = 794; // ancho total fijo

  // Título de sección
  const ST = ({ children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <div style={{ width: 14, height: 2, background: NAVY, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY }}>{children}</span>
    </div>
  );

  // Fila de datos
  const DR = ({ label, value, lc, vc, last }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: last ? "none" : `0.5px solid ${BORDER}` }}>
      <span style={{ fontSize: 11, color: lc || GRAY }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: vc || "#0a0a0a" }}>{value}</span>
    </div>
  );

  const intLabel = d.is100 ? "Integración cuota 5" : `Integración mínima (${Math.round(p.intMinPct * 100)}%)`;
  const intValue = d.is100 ? fmt(p.intCuota5) : fmt(p.intMin);

  return (
    <div style={{ width: W, fontFamily: "'Segoe UI', Arial, sans-serif", background: "#ffffff", overflow: "hidden" }}>

      {/* ══════ HEADER AZUL (fiel al boceto) ══════
          Logo izq | Fecha der
          Nombre grande
          Subtítulo plan
          3 KPIs en fila completa (sin foto en header)
      ══════════════════════════════════════════════ */}
      <div style={{ background: NAVY, width: W, boxSizing: "border-box", padding: "20px 24px 18px 24px" }}>

        {/* Fila: logo + fecha */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody><tr>
            <td style={{ verticalAlign: "middle" }}>
              {logoBase64
                ? <img src={logoBase64} alt="Ford Goldstein"
                    style={{ height: 30, width: "auto", display: "block", background: "#fff", padding: "3px 10px", borderRadius: 5 }} />
                : <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>Ford | Goldstein</span>
              }
            </td>
            <td style={{ verticalAlign: "top", textAlign: "right" }}>
              <div style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "6px 14px", textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Válido hasta</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 2 }}>{validez}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Ford Goldstein · Mayo 2026</div>
              </div>
            </td>
          </tr></tbody>
        </table>

        {/* Nombre cliente */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Propuesta personalizada</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.05, marginTop: 2 }}>{clientName.toUpperCase()}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
            {p.name} · Plan {p.ratio} · {p.cuotas} cuotas · Retiro: {d.retiroName}
          </div>
        </div>

        {/* 3 KPIs en fila completa — igual al boceto */}
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 8, marginTop: 14 }}>
          <tbody><tr>
            {[
              { label: "Puja competitiva", value: fmt(d.ofertaReal), sub: `${d.pujaPct.toFixed(1)}% VM · ${d.prob}`, sc: d.probColor },
              { label: "Cuotas canceladas", value: String(d.nAdelanto + d.regalo), sub: `de ${p.cuotas} totales del plan`, sc: "rgba(255,255,255,0.4)" },
              { label: "Saldo restante", value: `${d.cuotasRestantes} cuotas`, sub: `Ahorro total ${fmt(d.totalAhorro)}`, sc: "rgba(255,255,255,0.4)" }
            ].map((k, i) => (
              <td key={i} style={{
                width: "33.33%", background: "rgba(255,255,255,0.07)",
                border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 7,
                padding: "10px 14px", verticalAlign: "top"
              }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginTop: 5 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: k.sc, marginTop: 4, fontWeight: 600 }}>{k.sub}</div>
              </td>
            ))}
          </tr></tbody>
        </table>
      </div>

      {/* ══════ BODY: FILA 1 — Plan vehículo | Licitación ══════ */}
      <table style={{ width: W, borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup><col style={{ width: "50%" }} /><col style={{ width: "50%" }} /></colgroup>
        <tbody><tr style={{ verticalAlign: "top" }}>

          {/* COL IZQ — Plan del vehículo + foto centrada */}
          <td style={{ padding: "18px 20px", borderRight: `0.5px solid ${BORDER}`, borderBottom: `0.5px solid ${BORDER}`, verticalAlign: "top" }}>
            <ST>Plan del vehículo</ST>
            <DR label={`VM ${p.name}`} value={fmt(d.vmPlan)} />
            <DR label={`VM Retiro (${d.retiroName})`} value={fmt(d.vmRetiro)} />
            <DR label={intLabel} value={intValue} />
            <DR label={`Saldo a financiar (${Math.round((1 - p.intMinPct) * 100)}%)`}
              value={fmt(d.is100 ? d.vmPlan : d.vmPlan * (1 - p.intMinPct))}
              lc="#9ca3af" vc="#9ca3af" last />

            {/* Caja de imagen — centrada, tamaño fijo, imagen no se deforma */}
            <div style={{
              margin: "14px 0 4px 0",
              width: "100%",
              height: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f8fafc",
              borderRadius: 8,
              border: `0.5px solid ${BORDER}`,
              overflow: "hidden"
            }}>
              {fotoUrl
                ? <img src={fotoUrl} alt={d.retiroName}
                    style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", display: "block" }} />
                : <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>Sin imagen</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, marginTop: 4 }}>{d.retiroName}</div>
                  </div>
              }
            </div>
          </td>

          {/* COL DER — Licitación */}
          <td style={{ padding: "18px 20px", borderBottom: `0.5px solid ${BORDER}`, verticalAlign: "top" }}>
            <ST>Licitación</ST>
            <DR label="Capital disponible" value={fmt(d.capital)} />
            <DR label="— Gastos de gestión" value={fmt(d.gastosGestion)} lc="#dc2626" vc="#dc2626" />
            <DR label="— Diferencia de modelo" value={d.diffModelo > 0 ? fmt(d.diffModelo) : "$0"} lc="#dc2626" vc="#dc2626" />
            <DR
              label={`— Patentamiento (${Math.round(d.bonifPatentPct * 100)}% bonif.)`}
              value={d.patNeto === 0 ? "$0" : fmt(d.patNeto)}
              lc={d.patNeto === 0 ? "#16a34a" : "#dc2626"}
              vc={d.patNeto === 0 ? "#16a34a" : "#dc2626"}
              last
            />

            {/* Bloque puja */}
            <div style={{ background: NAVY, borderRadius: 7, padding: "12px 14px", marginTop: 12 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Puja competitiva</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginTop: 4 }}>{fmt(d.ofertaReal)}</div>
              <div style={{ fontSize: 11, color: d.prob === "ALTA" ? "#4ade80" : d.prob === "MEDIA-ALTA" ? "#fbbf24" : "#f87171", marginTop: 4, fontWeight: 600 }}>
                {d.pujaPct.toFixed(2)}% del VM · Probabilidad {d.prob}
              </div>
            </div>

            {/* Resultado plazo */}
            <div style={{ background: "#f8fafc", border: `0.5px solid ${BORDER}`, borderRadius: 7, padding: "10px 12px", marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
                <span style={{ fontSize: 11, color: GRAY }}>Reducción de plazo</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{d.nAdelanto + d.regalo} cuotas canceladas</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `0.5px solid ${BORDER}`, marginTop: 7, paddingTop: 7 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>Saldo restante estimado</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{d.cuotasRestantes} cuotas</span>
              </div>
            </div>
          </td>
        </tr></tbody>
      </table>

      {/* ══════ BODY: FILA 2 — Cuotas | Beneficios ══════ */}
      <table style={{ width: W, borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup><col style={{ width: "50%" }} /><col style={{ width: "50%" }} /></colgroup>
        <tbody><tr style={{ verticalAlign: "top" }}>

          {/* COL IZQ — Cuotas */}
          <td style={{ padding: "18px 20px", borderRight: `0.5px solid ${BORDER}`, verticalAlign: "top" }}>
            <ST>Cuotas</ST>

            {/* C1 */}
            <div style={{ background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: 7, padding: "9px 11px", marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Cuota 1 (Suscripción)</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>{fmt(d.c1Display)}</span>
              </div>
              {d.descC1Pct > 0 && (
                <div style={{ fontSize: 10, color: "#16a34a", marginTop: 3 }}>
                  {Math.round(d.descC1Pct * 100)}% de descuento con Tarjeta de Crédito
                </div>
              )}
            </div>

            {/* C2 */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px", borderBottom: `0.5px solid ${BORDER}` }}>
              <span style={{ fontSize: 11, color: GRAY }}>{d.is100 ? "Cuota 2 a 5" : "Cuota 2 (licitación)"}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(p.schedule.c2_13)}</span>
            </div>

            {/* Cuotas fijas */}
            <div style={{ background: "#fffbeb", border: "0.5px solid #fde68a", borderRadius: 7, padding: "9px 11px", margin: "7px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
                    {d.is100 ? "Cuotas 6 a 16 · Fijas" : "Cuotas 3 a 13 · Fijas"}
                  </div>
                  <div style={{ fontSize: 10, color: "#b45309", marginTop: 2 }}>12 cuotas garantizadas sin variación</div>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#92400e" }}>
                  {fmt(d.is100 ? p.schedule.c14_16 : p.schedule.c2_13)}
                </span>
              </div>
            </div>

            {!d.is100 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px", borderBottom: `0.5px solid ${BORDER}` }}>
                <span style={{ fontSize: 11, color: GRAY }}>Cuota 14 a 16</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(p.schedule.c14_16)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px", borderBottom: `0.5px solid ${BORDER}` }}>
              <span style={{ fontSize: 11, color: GRAY }}>Cuota 17 al final</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>Decreciente</span>
            </div>

            {/* Alícuota */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `0.5px solid ${BORDER}`, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Alícuota pura</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{fmt(p.ap)}</span>
            </div>

            {p.promo && (
              <div style={{ background: "#fef3c7", border: "0.5px solid #fde68a", borderRadius: 6, padding: "7px 10px", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "#92400e", fontWeight: 600 }}>Promo Mayo: {p.promo}</span>
              </div>
            )}
            {d.is100 && (
              <div style={{ background: "#eff6ff", border: "0.5px solid #bfdbfe", borderRadius: 6, padding: "7px 10px", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "#1d4ed8", fontWeight: 600 }}>Plan 100%: adjudicación garantizada cuota 5 · Integración: {fmt(p.intCuota5)}</span>
              </div>
            )}
          </td>

          {/* COL DER — Beneficios */}
          <td style={{ padding: "18px 20px", verticalAlign: "top" }}>
            <ST>Beneficios</ST>

            {/* Badges patentamiento + desc C1 */}
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 7, marginBottom: 12 }}>
              <tbody><tr>
                <td style={{ border: `0.5px solid ${BORDER}`, borderRadius: 7, padding: "10px 8px", textAlign: "center", width: "50%", verticalAlign: "top" }}>
                  <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Patentamiento</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: NAVY, marginTop: 4, lineHeight: 1 }}>{Math.round(d.bonifPatentPct * 100)}%</div>
                  <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>bonificado</div>
                </td>
                {d.descC1Pct > 0 ? (
                  <td style={{ border: `0.5px solid ${BORDER}`, borderRadius: 7, padding: "10px 8px", textAlign: "center", width: "50%", verticalAlign: "top" }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Desc. cuota 1</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: NAVY, marginTop: 4, lineHeight: 1 }}>{Math.round(d.descC1Pct * 100)}%</div>
                    <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>con TC</div>
                  </td>
                ) : d.bono > 0 ? (
                  <td style={{ border: `0.5px solid ${BORDER}`, borderRadius: 7, padding: "10px 8px", textAlign: "center", width: "50%", verticalAlign: "top" }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Bono Ford</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginTop: 4 }}>{fmt(d.bono)}</div>
                    <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>en facturación</div>
                  </td>
                ) : (
                  <td style={{ border: `0.5px solid ${BORDER}`, borderRadius: 7, padding: "10px 8px", textAlign: "center", width: "50%", verticalAlign: "top" }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Regalos</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: NAVY, marginTop: 4 }}>{d.regalo}</div>
                    <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>alícuota{d.regalo !== 1 ? "s" : ""}</div>
                  </td>
                )}
              </tr></tbody>
            </table>

            {/* Ahorro total */}
            <div style={{ background: NAVY, borderRadius: 7, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ahorro total directo</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginTop: 5 }}>{fmt(d.totalAhorro)}</div>
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span style={{ background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 4, padding: "2px 8px", fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
                  Patent: {fmt(d.ahorroPatent)}
                </span>
                {d.descC1Pct > 0 && (
                  <span style={{ background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 4, padding: "2px 8px", fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
                    C1: {fmt(d.descC1Monto)}
                  </span>
                )}
                {d.bono > 0 && (
                  <span style={{ background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 4, padding: "2px 8px", fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
                    Bono: {fmt(d.bono)}
                  </span>
                )}
              </div>
            </div>

            {/* Proyección cancelación */}
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 8 }}>
              Si pagás de más mensual:
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `0.5px solid ${BORDER}` }}>
              <span style={{ fontSize: 11, color: GRAY }}>{fmt(d.proj1Monthly)}/mes</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>cancela en {d.proj1Months} meses</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <span style={{ fontSize: 11, color: GRAY }}>{fmt(d.proj2Monthly)}/mes</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>cancela en {d.proj2Months} meses</span>
            </div>
          </td>
        </tr></tbody>
      </table>

      {/* ══════ FOOTER LEGAL ══════ */}
      <div style={{ background: "#f8fafc", borderTop: `0.5px solid ${BORDER}`, padding: "9px 22px", width: W, boxSizing: "border-box" }}>
        <p style={{ fontSize: 8, color: "#9ca3af", lineHeight: 1.6, margin: 0 }}>
          * Valores de referencia según valor móvil 01/05/2026. Cuotas fijas por contrato de la {d.is100 ? "2 a la 16" : "3 a la 13"}.
          El beneficio del {Math.round(d.bonifPatentPct * 100)}% aplica sobre aranceles de patentamiento.
          {d.descC1Pct > 0 ? ` El descuento del ${Math.round(d.descC1Pct * 100)}% en cuota 1 es mediante reintegro o descuento directo con Tarjeta de Crédito.` : ""}
          {" "}Sujeto a peritaje final del usado y aprobación crediticia de Ford Plan Óvalo.
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
  const [validez, setValidez] = useState("20/05/26");
  const [fotoUrl, setFotoUrl] = useState("");
  const [customFoto, setCustomFoto] = useState(false);
  const [logoBase64, setLogoBase64] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
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

  const parseCap = s => parseFloat((s || "0").replace(/\./g, "").replace(/,/g, "").replace(/\$/g, "")) || 0;
  const getBonifPct = () => clamp(parseFloat(bonifPatStr) || 0, 0, 100) / 100;
  const getDescC1Pct = () => clamp(parseFloat(descC1Str) || 0, 0, 50) / 100;

  const updateRetiro = name => {
    setRetiroName(name);
    if (!customFoto && MODEL_PHOTOS[name]) {
      imageToBase64(MODEL_PHOTOS[name].principal).then(b64 => setFotoUrl(b64 || MODEL_PHOTOS[name].principal));
    } else if (!customFoto) {
      setFotoUrl("");
    }
  };

  const handleCalc = () => {
    setError("");
    if (!clientName.trim()) { setError("Ingresá el nombre del cliente."); return; }
    const cap = parseCap(capital);
    if (!cap) { setError("Ingresá el capital disponible."); return; }
    const r = calculate(planKey, retiroName, cap, getBonifPct(), getDescC1Pct());
    if (!r) { setError("Error en el cálculo."); return; }
    if (r.ofertaReal < 0) { setError(`La puja es negativa (${fmt(r.ofertaReal)}). El capital no cubre los gastos.`); return; }
    setResult(r);
    setStep("preview");
  };

  const handleExportPDF = async () => {
    const el = printRef.current;
    if (!el) return;
    setExporting(true);
    try {
      const opt = {
        margin: 0,
        filename: `Simulacion-${clientName.replace(/\s+/g, "-")}.pdf`,
        image: { type: "jpeg", quality: 0.97 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          letterRendering: true,
          width: 794,
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait", hotfixes: ["px_scaling"] }
      };
      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error(err);
      window.print();
    }
    setExporting(false);
  };

  const IS = { width: "100%", padding: "10px 12px", border: "2px solid #cbd5e1", borderRadius: 8, fontSize: 14, outline: "none", background: "#f8fafc", boxSizing: "border-box" };
  const LS = { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" };

  const cap = parseCap(capital);
  const liveCalc = cap > 0 ? calculate(planKey, retiroName, cap, getBonifPct(), getDescC1Pct()) : null;

  // ── FORMULARIO ──
  if (step === "form") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a1628, #152a4a, #0d2137)", padding: "20px 12px" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            {logoBase64
              ? <img src={logoBase64} alt="Ford Goldstein" style={{ height: 52, marginBottom: 8, background: "white", padding: "6px 16px", borderRadius: 8 }} />
              : <div style={{ fontSize: 18, fontWeight: 900, color: "white", marginBottom: 8 }}>Ford | Goldstein</div>}
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: "4px 0" }}>Simulador Óvalo</h1>
            <div style={{ fontSize: 12, color: "#6b8db5" }}>Motor de cálculo integrado — Valores Mayo 2026</div>
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
                  {Object.entries(PLANS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
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
                    onBlur={e => setBonifPatStr(String(clamp(parseFloat(e.target.value) || 0, 0, 100)))} />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 700, pointerEvents: "none" }}>%</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>
                  Ahorro: {fmt((allRetiroModels.find(m => m.name === retiroName)?.vm || 0) * 0.07 * getBonifPct())}
                </div>
              </div>
              <div>
                <label style={LS}>Desc. C1 (TC) (%)</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...IS, paddingRight: 30 }} type="number" min="0" max="50" placeholder="0"
                    value={descC1Str} onChange={e => setDescC1Str(e.target.value)}
                    onBlur={e => setDescC1Str(String(clamp(parseFloat(e.target.value) || 0, 0, 50)))} />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 700, pointerEvents: "none" }}>%</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>
                  {getDescC1Pct() > 0 ? `Desc: ${fmt(PLANS[planKey]?.c1 * getDescC1Pct())}` : "Sin descuento"}
                </div>
              </div>
              <div>
                <label style={LS}>Válido hasta</label>
                <input style={IS} value={validez} onChange={e => setValidez(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: 20, padding: 14, background: "#f1f5f9", borderRadius: 10 }}>
              <label style={LS}>Foto Unidad {MODEL_PHOTOS[retiroName] && !customFoto ? "(auto)" : ""}</label>
              <input type="file" accept="image/*" onChange={e => handleImg(e, setFotoUrl, setCustomFoto)} style={{ fontSize: 11 }} />
              {fotoUrl && <img src={fotoUrl} alt="" style={{ height: 40, marginTop: 6, objectFit: "contain" }} />}
            </div>

            {planKey === "ranger_xl_100" && (
              <div style={{ background: "#eff6ff", border: "2px solid #3b82f6", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#1e40af" }}>
                📌 <strong>Plan 100%:</strong> Adjudicación garantizada cuota 5. Sin integración mínima. Sin bono Ford.
              </div>
            )}
            {planKey === "territory_sel" && (
              <div style={{ background: "#fef3c7", border: "2px solid #f59e0b", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#92400e" }}>
                🏷️ <strong>Promo Mayo:</strong> 30% bonificación sobre alícuota cuota 1 a 13. Cuota fija: $450.000.
              </div>
            )}

            {liveCalc && liveCalc.ofertaReal > 0 && (
              <div style={{ background: "#eff6ff", border: "2px solid #93c5fd", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#001f5b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Vista Rápida</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                  {[
                    ["Puja", fmt(liveCalc.ofertaReal), `${liveCalc.pujaPct.toFixed(1)}% VM`, liveCalc.probColor],
                    ["Canceladas", `${liveCalc.nAdelanto + liveCalc.regalo}`, "cuotas", "#16a34a"],
                    ["Restantes", `${liveCalc.cuotasRestantes}`, `de ${liveCalc.plan.cuotas}`, "#001f5b"],
                    ["Ahorro", fmt(liveCalc.totalAhorro), "total", "#16a34a"]
                  ].map(([title, val, sub, color], i) => (
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

            <button onClick={handleCalc} style={{
              width: "100%", padding: 16, background: "linear-gradient(135deg, #001f5b, #0056b3)",
              color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 900,
              cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, boxShadow: "0 4px 20px rgba(0,31,91,0.4)"
            }}>
              Generar Simulación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PREVIEW ──
  return (
    <div style={{ minHeight: "100vh", background: "#e2e8f0", padding: 16 }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print" style={{ maxWidth: 820, margin: "0 auto 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <button onClick={() => setStep("form")} style={{ padding: "10px 20px", background: "white", border: "2px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#333" }}>
          ← Volver
        </button>
        <button onClick={handleExportPDF} disabled={exporting} style={{
          padding: "10px 28px", background: exporting ? "#6b7280" : "#001f5b",
          color: "white", border: "none", borderRadius: 8,
          cursor: exporting ? "wait" : "pointer", fontWeight: 900, fontSize: 14
        }}>
          {exporting ? "Generando PDF..." : "Descargar PDF"}
        </button>
      </div>

      {/* El wrapper del doc tiene overflow hidden y width exacto para no generar franja */}
      <div style={{ maxWidth: 794, margin: "0 auto", background: "white", borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <div ref={printRef} style={{ width: 794 }}>
          <DocPreview data={result} clientName={clientName} validez={validez} logoBase64={logoBase64} fotoUrl={fotoUrl} />
        </div>
      </div>
    </div>
  );
}
