import { supabase, isSupabaseConfigured } from "../lib/supabase";

const CUPONES_LOCALES = [
  { codigo: "TECNOMATIC10", tipo: "porcentaje", valor: 10, minimo_compra: 50000, activo: true },
  { codigo: "SEGURIDAD20", tipo: "porcentaje", valor: 20, minimo_compra: 150000, activo: true },
  { codigo: "BIENVENIDO", tipo: "fijo", valor: 15000, minimo_compra: 80000, activo: true },
  { codigo: "PROMOVIP", tipo: "porcentaje", valor: 15, minimo_compra: 100000, activo: true },
];

export const couponService = {
  // Validar y calcular descuento de cupón
  async validarCupon(codigo, subtotal) {
    const codLimpio = (codigo || "").trim().toUpperCase();
    const subtotalNum = Number(subtotal || 0);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Cupones")
          .select("*")
          .eq("Codigo", codLimpio)
          .eq("Activo", true)
          .maybeSingle();

        if (!error && data) {
          if (subtotalNum < Number(data.Minimo_Compra || 0)) {
            throw new Error(`El cupón requiere una compra mínima de $${Number(data.Minimo_Compra).toLocaleString("es-CO")}`);
          }

          const descuento = data.Tipo === "porcentaje"
            ? (subtotalNum * Number(data.Valor)) / 100
            : Number(data.Valor);

          return {
            valido: true,
            codigo: data.Codigo,
            tipo: data.Tipo,
            valor: Number(data.Valor),
            descuento: Math.min(subtotalNum, descuento),
            mensaje: `Cupón ${data.Codigo} aplicado: ${data.Tipo === "porcentaje" ? `${data.Valor}% de descuento` : `$${Number(data.Valor).toLocaleString("es-CO")} de descuento`}`,
          };
        }
      } catch (err) {
        if (err.message?.includes("compra mínima")) throw err;
        console.warn("Error validando cupón en Supabase:", err);
      }
    }

    // Validación local
    const cupon = CUPONES_LOCALES.find((c) => c.codigo === codLimpio && c.activo);
    if (!cupon) {
      throw new Error("El código de cupón no es válido o ha expirado.");
    }

    if (subtotalNum < cupon.minimo_compra) {
      throw new Error(`El cupón requiere una compra mínima de $${cupon.minimo_compra.toLocaleString("es-CO")}`);
    }

    const descuento = cupon.tipo === "porcentaje"
      ? (subtotalNum * cupon.valor) / 100
      : cupon.valor;

    return {
      valido: true,
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      valor: cupon.valor,
      descuento: Math.min(subtotalNum, descuento),
      mensaje: `Cupón ${cupon.codigo} aplicado: ${cupon.tipo === "porcentaje" ? `${cupon.valor}% de descuento` : `$${cupon.valor.toLocaleString("es-CO")} de descuento`}`,
    };
  },
};
