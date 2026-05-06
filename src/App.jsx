import { useState, useCallback, useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";

// ============================================================
// DATA: PLANES DE SUSCRIPCIÓN (MAYO 2026)
// ============================================================
const PLANS = {
  ranger_xl: {
    name: "Ranger XL 4x2", label: "Ranger XL 4x2 (80/20 - 120c)", ratio: "80/20", cuotas: 120,
    vm: 50962700, ap: 339751, c1: 380000, cf: 509000, intMinPct: 0.20, intMin: 10192540,
    schedule: { c1: 380000, c2_13: 509000, c14_16: 502000, c17Label: "Decreciente $445.000 a $384.000" },
    bono: { amount: 2321073, condition: "ranger" }, regalo: 1, regaloCondition: "ranger"
  },
  ranger_xl_100: {
    name: "Ranger XL 4x2 100%", label: "Ranger XL 4x2 (100% - 84c)", ratio: "100%", cuotas: 84,
    vm: 50962700, ap: 607000, c1: 680000, cf: 808000, intMinPct: 0, intMin: 0,
    schedule: { c1: 680000, c2_13: 808000, c14_16: 808000, c17Label: "Decreciente $748.000 a $686.000" },
    bono: null, regalo: 0, regaloCondition: null,
    adjCuota5: true, intCuota5: 24000000
  },
  ranger_xls_v6: {
    name: "Ranger XLS V6", label: "Ranger XLS V6 (80/20 - 120c)", ratio: "80/20", cuotas: 120,
    vm: 66497510, ap: 443317, c1: 520000, cf: 665000, intMinPct: 0.20, intMin: 13299502,
    schedule: { c1: 520000, c2_13: 665000, c14_16: 589000, c17Label: "Decreciente $580.000 a $500.000" },
    bono: { amount: 2123844, condition: "ranger" }, regalo: 1, regaloCondition: "ranger"
  },
  maverick_xlt: {
    name: "Maverick XLT", label: "Maverick XLT (70/30 - 84c)", ratio: "70/30", cuotas: 84,
    vm: 56627500, ap: 471896, c1: 510000, cf: 671000, intMinPct: 0.30, intMin: 16988250,
    schedule: { c1: 510000, c2_13: 671000, c14_16: 604000, c17Label: "Decreciente $595.000 a $534.000" },
    bono: null, regalo: 0, regaloCondition: null
  },
  territory_sel: {
    name: "Territory SEL", label: "Territory SEL (70/30 - 84c)", ratio: "70/30", cuotas: 84,
    vm: 48110210, ap: 400000, c1: 320000, cf: 450000, intMinPct: 0.30, intMin: 14433063,
    schedule: { c1: 320000, c2_13: 450000, c14_16: 560000, c17Label: "Decreciente $505.000 a $456.000" },
    bono: null, regalo: 0, regaloCondition: null,
    promoAlicuota: { descPct: 0.30, apConDesc: 280643, nota: "30% bonif. sobre alícuota cuota 1 a 13 (promo mayo)" }
  },
  transit_van: {
    name: "Transit Van", label: "Transit Van (70/30 - 84c)", ratio: "70/30", cuotas: 84,
    vm: 66279520, ap: 552329, c1: 620000, cf: 786000, intMinPct: 0.30, intMin: 19883856,
    schedule: { c1: 620000, c2_13: 786000, c14_16: 707000, c17Label: "Decreciente $696.000 a $627.000" },
    bono: null, regalo: 2, regaloCondition: null
  }
};

// ============================================================
// DATA: MODELOS DE RETIRO (VM MAYO 2026)
// ============================================================
const RETIRO_MODELS = [
  { group: "Ranger", models: [
    { name: "Ranger XL 4x2 MT", vm: 50962700 },
    { name: "Ranger XL 4x2 AT", vm: 51400000 },
    { name: "Ranger XL 4x4 MT", vm: 55685660 },
    { name: "Ranger XL 4x4 AT", vm: 56200000 },
    { name: "Ranger CS XL 4x2 MT", vm: 43500000 },
    { name: "Ranger CS XL 4x4 MT", vm: 52000000 },
    { name: "Ranger CH XL 4x4 MT", vm: 49500000 },
    { name: "Ranger XLS 2.0 MT", vm: 56090750 },
    { name: "Ranger XLS V6", vm: 66497510 },
    { name: "Ranger XLT 2.0 AT 4x2", vm: 68727000 },
    { name: "Ranger XLT 2.0 AT 4x4", vm: 74446800 },
    { name: "Ranger XLT V6", vm: 75998200 },
    { name: "Ranger Black 4x4 MT", vm: 65975500 },
    { name: "Ranger Black 4x2 AT", vm: 63800000 },
    { name: "Ranger LTD 2.0 4x4", vm: 80607900 },
    { name: "Ranger LTD+ V6", vm: 84291660 },
    { name: "Ranger Raptor", vm: 114390000 }
  ]},
  { group: "SUV / Pickups", models: [
    { name: "Territory SEL", vm: 48110210 },
    { name: "Territory Titanium", vm: 56032510 },
    { name: "Territory Trend HEV", vm: 51400580 },
    { name: "Maverick XLT", vm: 56627500 },
    { name: "Maverick Tremor", vm: 70024300 },
    { name: "Maverick Lariat FHEV", vm: 67849300 },
    { name: "Everest Titanium", vm: 89560510 },
    { name: "Bronco Sport Big Bend", vm: 61248810 },
    { name: "Bronco Sport Badlands", vm: 68188280 },
    { name: "Big Bronco", vm: 103230000 },
    { name: "Bronco Badlands", vm: 103230000 },
    { name: "Kuga Platinum", vm: 84718400 },
    { name: "F-150 Híbrida Lariat", vm: 114390000 },
    { name: "F-150 Raptor", vm: 146475000 },
    { name: "F-150 Tremor", vm: 114390000 }
  ]},
  { group: "Transit", models: [
    { name: "Transit Chasis", vm: 73807010 },
    { name: "Transit Van Mediana TN", vm: 66279520 },
    { name: "Transit Van Mediana TE", vm: 69914010 },
    { name: "Transit Van Larga TE MT", vm: 75142890 },
    { name: "Transit Van Larga TE AT", vm: 79285960 },
    { name: "Transit Minibus MT", vm: 96222240 },
    { name: "Transit Minibus AT", vm: 101868100 }
  ]}
];

const MODEL_PHOTOS = {
  "Maverick XLT": {
    principal: "/fotos/maverick-xlt/principal.png",
    galeria: [
      "/fotos/maverick-xlt/foto1.png",
      "/fotos/maverick-xlt/foto2.png",
      "/fotos/maverick-xlt/foto3.png",
      "/fotos/maverick-xlt/foto4.png",
    ]
  },
};

const allRetiroModels = RETIRO_MODELS.flatMap(g => g.models);
const isRanger = (name) => name.toLowerCase().startsWith("ranger");
const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// ============================================================
// HELPER: Convertir imagen URL a base64
// ============================================================
function imageToBase64(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
}

// ============================================================
// MOTOR DE CÁLCULO (MAYO 2026 - Patentamiento 7%)
// ============================================================
function calculate(planKey, retiroName, capital, bonifPatentPct, descC1Pct) {
  const plan = PLANS[planKey];
  const retiro = allRetiroModels.find(m => m.name === retiroName);
  if (!plan || !retiro) return null;

  const vmPlan = plan.vm;
  const vmRetiro = retiro.vm;
  const gastosGestion = 1500000;
  const patPct = 0.07;
  const diffModelo = vmRetiro > vmPlan ? vmRetiro - vmPlan : 0;
  const patBruto = vmRetiro * patPct;
  const patNeto = patBruto * (1 - bonifPatentPct);
  const totalGastos = diffModelo + gastosGestion + patNeto;
  const ofertaReal = capital - totalGastos;

  const is100 = plan.ratio === "100%";

  let bono = 0, regalo = 0;
  if (!is100 && plan.bono && plan.bono.condition === "ranger" && isRanger(retiroName)) bono = plan.bono.amount;
  if (plan.regaloCondition === "ranger" && isRanger(retiroName)) regalo = plan.regalo;
  else if (!plan.regaloCondition && plan.regalo > 0) regalo = plan.regalo;

  let saldoAdelanto;
  if (is100) {
    saldoAdelanto = ofertaReal;
  } else {
    saldoAdelanto = Math.max(0, ofertaReal - plan.intMin) + bono;
  }

  let creditoModelo = 0;
  if (vmRetiro < vmPlan) { creditoModelo = vmPlan - vmRetiro; saldoAdelanto += creditoModelo; }

  const nAdelanto = Math.max(0, Math.floor(saldoAdelanto / plan.ap));
  const cuotasRestantes = plan.cuotas - nAdelanto - 2;
  const pujaPct = vmPlan > 0 ? (ofertaReal / vmPlan) * 100 : 0;

  let prob = "BAJA", probColor = "#dc2626";
  if (pujaPct >= 25) { prob = "ALTA"; probColor = "#16a34a"; }
  else if (pujaPct >= 20) { prob = "MEDIA-ALTA"; probColor = "#d97706"; }
  else if (pujaPct >= 15) { prob = "MEDIA"; probColor = "#ea580c"; }

  const ahorroPatent = patBruto * bonifPatentPct;
  const descC1Monto = plan.c1 * descC1Pct;
  const c1Display = plan.c1 - descC1Monto;
  const proj1Monthly = plan.cf + plan.ap;
  const proj1Months = Math.ceil(cuotasRestantes / 2);
  const proj2Monthly = plan.cf + 2 * plan.ap;
  const proj2Months = Math.ceil(cuotasRestantes / 3);

  return {
    plan, planKey, vmPlan, vmRetiro, retiroName, gastosGestion, diffModelo,
    patBruto, patNeto, patPct, bonifPatentPct, totalGastos, ofertaReal, bono, regalo,
    creditoModelo, saldoAdelanto, nAdelanto, cuotasRestantes, pujaPct, prob, probColor,
    ahorroPatent, descC1Pct, descC1Monto, c1Display,
    proj1Monthly, proj1Months, proj2Monthly, proj2Months,
    totalAhorro: ahorroPatent + descC1Monto,
    excedentePujaBono: Math.max(0, ofertaReal - (is100 ? 0 : plan.intMin)) + bono,
    capital, is100
  };
}

// ============================================================
// DOCUMENT PREVIEW
// ============================================================
function DocPreview({ data, clientName, validez, logoBase64, fotoUrl }) {
  if (!data) return null;
  const d = data, p = d.plan;
  const B = "#003478";

  const Row = ({ label, value, color, border = true }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: border ? "1px solid #f0f0f0" : "none", fontSize: 11, color: color || "#333" }}>
      <span>{label}</span>
      <strong style={{ color: color || B, fontSize: 12 }}>{value}</strong>
    </div>
  );

  const SectionHead = ({ children }) => (
    <div style={{ background: B, color: "white", padding: "8px 12px", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{children}</div>
  );

  const intLabel = d.is100 ? "Integración Cuota 5" : `Integración Mínima (${Math.round(p.intMinPct*100)}%)`;
  const intValue = d.is100 ? fmt(p.intCuota5) : fmt(p.intMin);
  const finPct = d.is100 ? 100 : Math.round((1 - p.intMinPct) * 100);

  return (
    <div style={{ fontFamily: "'Segoe UI',Roboto,system-ui,sans-serif", fontSize: 11, color: "#333", background: "white" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `4px solid ${B}`, paddingBottom: 10, marginBottom: 16 }}>
          <div>
            {logoBase64 ? (
              <img src={logoBase64} alt="Ford Goldstein" style={{ height: 50, maxWidth: 200, objectFit: "contain" }} />
            ) : (
              <div style={{ fontWeight: 900, fontSize: 22, color: B, letterSpacing: -0.5 }}>Ford | Goldstein</div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: B, textTransform: "uppercase" }}>Hoja de Gestión Oficial</div>
            <div style={{ fontSize: 11, color: "#666" }}>Mayo 2026</div>
            <span style={{ background: "#fef2f2", color: "#d32f2f", fontWeight: 800, padding: "2px 8px", borderRadius: 4, fontSize: 10, display: "inline-block", marginTop: 3 }}>Válido hasta {validez}</span>
          </div>
        </div>

        <div style={{ border: `2px solid ${B}`, borderRadius: 4, padding: "10px 20px", display: "flex", justifyContent: "space-between", marginBottom: 16, background: "#f8f9fa" }}>
          <div>
            <div style={{ fontSize: 10, color: "#666" }}>Titular de Gestión:</div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{clientName.toUpperCase()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#666" }}>MODELO DE SUSCRIPCIÓN:</div>
            <div style={{ fontWeight: 900, fontSize: 12, color: B }}>{p.label.toUpperCase()}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
          <div>
            <div style={{ border: "2px solid #ddd", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
              <SectionHead>1. Valores de Referencia del Plan</SectionHead>
              <div style={{ padding: 10 }}>
                <Row label={`Valor Plan ${p.name} *`} value={`${fmt(d.vmPlan)}*`} />
                <Row label={`Valor ${d.retiroName} (Retiro) *`} value={`${fmt(d.vmRetiro)}*`} />
                <Row label={`${intLabel} *`} value={`${intValue}*`} />
                <Row label={`Saldo a financiar (${finPct}%)`} value={`${fmt(d.is100 ? d.vmPlan : d.vmPlan*(1-p.intMinPct))}*`} color="#666" />
                <div style={{ background: "#eef6ff", padding: 10, borderRadius: 4, marginTop: 8, border: "1px solid #2D96CD", textAlign: "center" }}>
                  <div style={{ fontWeight: 900, color: B, fontSize: 9, textTransform: "uppercase" }}>Unidad de Retiro (Cambio de Modelo)</div>
                  <div style={{ fontWeight: 900, fontSize: 13, color: B }}>{d.retiroName.toUpperCase()}</div>
                </div>
              </div>
            </div>

            <div style={{ border: "2px solid #ddd", borderRadius: 4, overflow: "hidden" }}>
              <SectionHead>2. Licitación y Adjudicación</SectionHead>
              <div style={{ padding: 10 }}>
                <Row label="Capital Total Disponible:" value={`${fmt(d.capital)}*`} border={false} />
                <p style={{ fontSize: 7.5, opacity: 0.7, fontStyle: "italic", marginBottom: 8, lineHeight: 1.2 }}>° Valor de referencia aproximado. Sujeto a tasación al momento de licitar.-</p>
                <Row label="(-) Gastos de Gestión:" value={`${fmt(d.gastosGestion)}*`} color="#d32f2f" />
                <Row label="(-) Diferencia Modelo:" value={d.diffModelo > 0 ? `${fmt(d.diffModelo)}*` : "$0*"} color="#d32f2f" />
                <Row label={`(-) Patentamiento (${Math.round(d.bonifPatentPct*100)}% BONIF.):`} value={d.patNeto === 0 ? "$0*" : `${fmt(d.patNeto)}*`} color={d.patNeto === 0 ? "#16a34a" : "#dc2626"} />
                <div style={{ background: "#1a1a1a", color: "white", padding: 10, textAlign: "center", borderRadius: 4, margin: "10px 0" }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", marginBottom: 2 }}>Oferta de Licitación Neta (Puja)</div>
                  <strong style={{ fontSize: 16 }}>{fmt(d.ofertaReal)}*</strong>
                </div>
                <div style={{ background: "#fffdf5", border: "2px solid #edcc8d", padding: 10, borderRadius: 4 }}>
                  <div style={{ fontWeight: 900, borderBottom: "1px solid #edcc8d", marginBottom: 8, fontSize: 10 }}>RESULTADO PROYECTADO</div>
                  <Row label="Reducción de Plazo:" value={`${d.nAdelanto + d.regalo} Cuotas Canceladas`} color="#333" border={false} />
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                    <span>Probabilidad:</span>
                    <strong style={{ color: d.probColor }}>{d.prob} ({d.pujaPct.toFixed(2)}% VM)</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #edcc8d", paddingTop: 5, marginTop: 5 }}>
                    <strong>SALDO RESTANTE ESTIMADO</strong>
                    <strong style={{ fontSize: 15 }}>{d.cuotasRestantes} CUOTAS</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ border: "2px solid #ddd", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
              <SectionHead>3. Proyección de cuotas</SectionHead>
              <div style={{ padding: 10 }}>
                <div style={{ background: "#e8f5e9", borderLeft: "5px solid #16a34a", padding: 10, marginBottom: 10, borderRadius: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>Cuota 1 (Suscripción)</strong>
                    <strong style={{ fontSize: 14, color: "#16a34a" }}>{fmt(d.c1Display)}*</strong>
                  </div>
                  {d.descC1Pct > 0 && <div style={{ fontSize: 9, color: "#166534", marginTop: 2 }}>🎁 <strong>{Math.round(d.descC1Pct*100)}% de Descuento</strong> con Tarjeta de Crédito</div>}
                </div>
                <Row label={d.is100 ? "Cuota 2 a 5" : "Cuota 2 (Licitación)"} value={`${fmt(p.schedule.c2_13)}*`} />
                <div style={{ background: "#fff8e1", border: "2px solid #ffc107", padding: 8, borderRadius: 4, margin: "6px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>🔒 <strong>{d.is100 ? "Cuota 6 a 16" : "Cuota 3 a 13"}</strong></span>
                    <strong style={{ fontSize: 14, color: "#d32f2f" }}>{fmt(d.is100 ? p.schedule.c14_16 : p.schedule.c2_13)}* ¡FIJAS!</strong>
                  </div>
                </div>
                {!d.is100 && <Row label="Cuota 14 a 16" value={`${fmt(p.schedule.c14_16)}*`} />}
                <Row label="Cuota 17 al final" value="Esquema Decreciente*" />
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: `2px solid ${B}`, marginTop: 10 }}>
                  <strong>ALÍCUOTA PURA (Para adelantos)</strong>
                  <strong style={{ color: B, fontSize: 13 }}>{fmt(p.ap)}*</strong>
                </div>
                {p.promoAlicuota && (
                  <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", padding: 6, borderRadius: 4, marginTop: 6, fontSize: 9, color: "#92400e" }}>
                    🏷️ <strong>Promo Mayo:</strong> {p.promoAlicuota.nota}
                  </div>
                )}
                {d.is100 && (
                  <div style={{ background: "#eff6ff", border: "1px solid #3b82f6", padding: 6, borderRadius: 4, marginTop: 6, fontSize: 9, color: "#1e40af" }}>
                    📌 <strong>Plan 100% financiado.</strong> Adjudicación asegurada en cuota 5. Integración: {fmt(p.intCuota5)}.
                  </div>
                )}
                <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse", fontSize: 10, background: "#f9f9f9" }}>
                  <thead><tr>
                    <th style={{ background: "#eef2f7", color: B, padding: 6, textAlign: "left", fontSize: 9, textTransform: "uppercase" }}>Si pagás mensualmente:</th>
                    <th style={{ background: "#eef2f7", color: B, padding: 6, textAlign: "left", fontSize: 9, textTransform: "uppercase" }}>Cancela en:</th>
                  </tr></thead>
                  <tbody>
                    <tr><td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{fmt(d.proj1Monthly)}</td><td style={{ padding: 6, borderBottom: "1px solid #eee", color: "#16a34a", fontWeight: 900 }}>{d.proj1Months} meses</td></tr>
                    <tr><td style={{ padding: 6 }}>{fmt(d.proj2Monthly)}</td><td style={{ padding: 6, color: "#16a34a", fontWeight: 900 }}>{d.proj2Months} meses</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ border: `2px solid ${B}`, borderRadius: 4, overflow: "hidden" }}>
              <SectionHead>4. Beneficios Exclusivos Goldstein</SectionHead>
              <div style={{ padding: 10 }}>
                <div style={{ background: "#16a34a", color: "white", padding: 15, borderRadius: 8, textAlign: "center", border: "3px solid #15803d" }}>
                  <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>Bonificaciones de Operación</div>
                  <strong style={{ fontSize: 18, display: "block", margin: "5px 0" }}>{Math.round(d.bonifPatentPct*100)}% PATENTAMIENTO</strong>
                  <div style={{ background: "rgba(0,0,0,0.15)", padding: 8, borderRadius: 4, marginTop: 10, textAlign: "left", fontSize: 9 }}>
                    • Ahorro Patentamiento ({Math.round(d.bonifPatentPct*100)}%): {fmt(d.ahorroPatent)}<br/>
                    {d.descC1Pct > 0 && <>• Descuento Tarjeta Crédito C1: {fmt(d.descC1Monto)}<br/></>}
                    {d.bono > 0 && <>• Bono Ford Facturación: {fmt(d.bono)}<br/></>}
                  </div>
                  <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.3)", paddingTop: 5 }}>
                    <div style={{ fontSize: 9, color: "#dcfce7", textTransform: "uppercase" }}>Ahorro Total Directo:</div>
                    <strong style={{ fontSize: 22 }}>{fmt(d.totalAhorro)}*</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {fotoUrl && <div style={{ marginTop: 12, textAlign: "center", borderTop: "1px solid #eee", paddingTop: 10 }}><img src={fotoUrl} alt="Unidad" style={{ maxWidth: "70%", maxHeight: 160, objectFit: "contain" }} /></div>}

        <div style={{ marginTop: 12, fontSize: 7.5, color: "#888", textAlign: "justify", borderTop: "1px solid #ddd", paddingTop: 8 }}>
          * Valores de referencia según valor móvil 01/05/2026. ** Cuotas fijas por contrato de la {d.is100 ? "2 a la 16" : "3 a la 13"}. El beneficio del {Math.round(d.bonifPatentPct*100)}% aplica sobre aranceles de patentamiento. {d.descC1Pct > 0 ? `El descuento del ${Math.round(d.descC1Pct*100)}% en cuota 1 es mediante reintegro o descuento directo con Tarjeta de Crédito. ` : ""}Sujeto a peritaje final del usado y aprobación crediticia de Ford Plan Óvalo.
        </div>
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
    imageToBase64("/logofordgoldstein.png").then((b64) => {
      if (b64) setLogoBase64(b64);
    });
  }, []);

  const handleImg = useCallback((e, setter, setCustom) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => { setter(ev.target.result); if (setCustom) setCustom(true); };
    r.readAsDataURL(file);
  }, []);

  const parseCap = (s) => parseFloat((s || "0").replace(/\./g, "").replace(/,/g, "").replace(/\$/g, "")) || 0;
  const getBonifPct = () => clamp(parseFloat(bonifPatStr) || 0, 0, 100) / 100;
  const getDescC1Pct = () => clamp(parseFloat(descC1Str) || 0, 0, 50) / 100;

  const updateRetiro = (name) => {
    setRetiroName(name);
    if (!customFoto && MODEL_PHOTOS[name]) {
      imageToBase64(MODEL_PHOTOS[name].principal).then((b64) => {
        if (b64) setFotoUrl(b64);
        else setFotoUrl(MODEL_PHOTOS[name].principal);
      });
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
    if (!r) { setError("Error en el cálculo. Verificá los datos."); return; }
    if (r.ofertaReal < 0) { setError(`La puja es negativa (${fmt(r.ofertaReal)}). El capital no cubre los gastos.`); return; }
    setResult(r);
    setStep("preview");
  };

  const handleExportPDF = async () => {
    const el = printRef.current;
    if (!el) return;
    setExporting(true);
    try {
      await html2pdf().set({
        margin: [6, 6, 6, 6],
        filename: `Simulacion-${clientName.replace(/\s+/g, "-")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all"] }
      }).from(el).save();
    } catch (err) {
      console.error("PDF export error:", err);
      window.print();
    }
    setExporting(false);
  };

  const IS = { width: "100%", padding: "10px 12px", border: "2px solid #cbd5e1", borderRadius: 8, fontSize: 14, outline: "none", background: "#f8fafc", boxSizing: "border-box" };
  const LS = { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 };

  const cap = parseCap(capital);
  const liveCalc = cap > 0 ? calculate(planKey, retiroName, cap, getBonifPct(), getDescC1Pct()) : null;

  if (step === "form") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a1628, #152a4a, #0d2137)", padding: "20px 12px" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            {logoBase64 ? (
              <img src={logoBase64} alt="Ford Goldstein" style={{ height: 52, marginBottom: 8, background: "white", padding: "6px 16px", borderRadius: 8 }} />
            ) : (
              <div style={{ fontSize: 18, fontWeight: 900, color: "white", marginBottom: 8 }}>Ford | Goldstein</div>
            )}
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
                  <input
                    style={{ ...IS, paddingRight: 30 }}
                    type="number" min="0" max="100" placeholder="50"
                    value={bonifPatStr}
                    onChange={e => setBonifPatStr(e.target.value)}
                    onBlur={e => setBonifPatStr(String(clamp(parseFloat(e.target.value) || 0, 0, 100)))}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 700, pointerEvents: "none" }}>%</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>
                  Ahorro: {fmt((allRetiroModels.find(m => m.name === retiroName)?.vm || 0) * 0.07 * getBonifPct())}
                </div>
              </div>

              <div>
                <label style={LS}>Desc. C1 (TC) (%)</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...IS, paddingRight: 30 }}
                    type="number" min="0" max="50" placeholder="0"
                    value={descC1Str}
                    onChange={e => setDescC1Str(e.target.value)}
                    onBlur={e => setDescC1Str(String(clamp(parseFloat(e.target.value) || 0, 0, 50)))}
                  />
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
                📌 <strong>Plan 100% financiado:</strong> Adjudicación asegurada en cuota 5. Sin integración mínima. Sin bono Ford.
              </div>
            )}

            {planKey === "territory_sel" && (
              <div style={{ background: "#fef3c7", border: "2px solid #f59e0b", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#92400e" }}>
                🏷️ <strong>Promo Mayo:</strong> 30% de bonificación sobre alícuota de cuota 1 a 13. Cuota fija resultante: $450.000.
              </div>
            )}

            {liveCalc && liveCalc.ofertaReal > 0 && (
              <div style={{ background: "#eff6ff", border: "2px solid #93c5fd", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#003478", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Vista Rápida</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                  {[
                    ["Puja", fmt(liveCalc.ofertaReal), `${liveCalc.pujaPct.toFixed(1)}% VM`, liveCalc.probColor],
                    ["Canceladas", `${liveCalc.nAdelanto + liveCalc.regalo}`, "cuotas", "#16a34a"],
                    ["Restantes", `${liveCalc.cuotasRestantes}`, `de ${liveCalc.plan.cuotas}`, "#003478"],
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
              width: "100%", padding: 16, background: "linear-gradient(135deg, #003478, #0056b3)", color: "white",
              border: "none", borderRadius: 10, fontSize: 16, fontWeight: 900, cursor: "pointer",
              textTransform: "uppercase", letterSpacing: 2, boxShadow: "0 4px 20px rgba(0,52,120,0.4)"
            }}>
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
      <div className="no-print" style={{ maxWidth: 820, margin: "0 auto 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <button onClick={() => setStep("form")} style={{ padding: "10px 20px", background: "white", border: "2px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#333" }}>
          ← Volver
        </button>
        <button onClick={handleExportPDF} disabled={exporting} style={{
          padding: "10px 28px", background: exporting ? "#6b7280" : "#003478", color: "white", border: "none",
          borderRadius: 8, cursor: exporting ? "wait" : "pointer", fontWeight: 900, fontSize: 14, boxShadow: "0 2px 10px rgba(0,52,120,0.3)"
        }}>
          {exporting ? "Generando PDF..." : "Descargar PDF"}
        </button>
      </div>
      <div ref={printRef} style={{ maxWidth: 820, margin: "0 auto", background: "white", borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <DocPreview data={result} clientName={clientName} validez={validez} logoBase64={logoBase64} fotoUrl={fotoUrl} />
      </div>
    </div>
  );
}
