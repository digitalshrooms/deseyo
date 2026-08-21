import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sendConfirmationEmail(params: {
  resendKey: string;
  to: string;
  jmeno: string;
  withdrawalId: string;
  withdrawalType: string;
  cisloObjednavky: string | null;
  submittedAt: string;
}) {
  const { resendKey, to, jmeno, withdrawalId, withdrawalType, cisloObjednavky, submittedAt } = params;

  const typLabel: Record<string, string> = {
    LEGAL_WITHDRAWAL: "Zákonné odstoupení od smlouvy (plný refund)",
    OUT_OF_LEGAL_RIGHT: "Odstoupení — nárok na refund nevznikl (byl udělen souhlas s okamžitým plněním)",
    OUT_OF_PERIOD: "Odstoupení mimo zákonnou lhůtu — nabízíme zrušení obnovy",
    EDGE_CASE: "Nestandardní případ — předáno k manuálnímu zpracování",
  };

  const nextSteps: Record<string, string> = {
    LEGAL_WITHDRAWAL: "Vaše členství bude ukončeno a platba vrácena do 14 dnů na účet, ze kterého byla provedena.",
    OUT_OF_LEGAL_RIGHT: "Váš přístup k obsahu pokračuje do konce zaplaceného období. Automatické obnovení bylo zrušeno.",
    OUT_OF_PERIOD: "Zákonná 14denní lhůta uplynula. Nabízíme zrušení automatického obnovení.",
    EDGE_CASE: "Váš případ byl předán k manuálnímu posouzení. Ozveme se do 3 pracovních dnů na email clenstvi@deseyo.cz.",
  };

  const dateFormatted = new Date(submittedAt).toLocaleString("cs-CZ", {
    timeZone: "Europe/Prague",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const html = `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Potvrzení odstoupení od smlouvy</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#0a3330,#198379);padding:32px 32px 28px;">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">DESEYO</p>
    <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">Potvrzení odstoupení<br>od smlouvy</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 20px;color:#374151;font-size:15px;">Dobrý den, <strong>${jmeno}</strong>,</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">Vaše žádost o odstoupení od smlouvy byla přijata a zpracována. Níže naleznete souhrn.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Souhrn žádosti</p>
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr><td style="color:#6b7280;font-size:13px;width:45%;">Číslo žádosti</td><td style="color:#111827;font-size:13px;font-weight:600;">${withdrawalId.slice(0, 8).toUpperCase()}</td></tr>
          ${cisloObjednavky ? `<tr><td style="color:#6b7280;font-size:13px;">Číslo objednávky</td><td style="color:#111827;font-size:13px;font-weight:600;">${cisloObjednavky}</td></tr>` : ""}
          <tr><td style="color:#6b7280;font-size:13px;">Datum podání</td><td style="color:#111827;font-size:13px;font-weight:600;">${dateFormatted}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Typ žádosti</td><td style="color:#111827;font-size:13px;font-weight:600;">${typLabel[withdrawalType] || withdrawalType}</td></tr>
        </table>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border-radius:12px;border:1px solid #a7f3d0;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 8px;color:#065f46;font-size:13px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Dalsi kroky</p>
        <p style="margin:0;color:#065f46;font-size:14px;line-height:1.6;">${nextSteps[withdrawalType] || nextSteps.EDGE_CASE}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 8px;color:#374151;font-size:14px;">V případě dotazů nás kontaktujte:</p>
    <p style="margin:0 0 24px;color:#374151;font-size:14px;"><a href="mailto:clenstvi@deseyo.cz" style="color:#198379;text-decoration:none;font-weight:600;">clenstvi@deseyo.cz</a> &nbsp;·&nbsp; <a href="tel:+420774695769" style="color:#198379;text-decoration:none;">+420 774 695 769</a></p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">Tento email je automatické potvrzení. Uchovejte jej prosím pro případ potřeby. Tento email a žádost o odstoupení jsou součástí auditní stopy dle § 1829 OZ.</p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">© 2026 Deseyo · Všechna práva vyhrazena</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Potvrzení odstoupení od smlouvy – DESEYO\n\nDobrý den, ${jmeno},\n\nVaše žádost o odstoupení od smlouvy byla přijata.\n\nČíslo žádosti: ${withdrawalId.slice(0, 8).toUpperCase()}\n${cisloObjednavky ? `Číslo objednávky: ${cisloObjednavky}\n` : ""}Datum: ${dateFormatted}\nTyp: ${typLabel[withdrawalType] || withdrawalType}\n\nDalší kroky:\n${nextSteps[withdrawalType] || nextSteps.EDGE_CASE}\n\nKontakt: clenstvi@deseyo.cz | +420 774 695 769\n\n© 2026 Deseyo`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Deseyo <clenstvi@deseyo.cz>",
      to: [to],
      subject: "Potvrzení odstoupení od smlouvy – DESEYO",
      html,
      text,
    }),
  });

  return res.ok;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { preview_token } = await req.json();

    if (!preview_token || typeof preview_token !== "string") {
      return new Response(JSON.stringify({ error: "Chybí preview_token." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the draft withdrawal
    const { data: row, error: fetchErr } = await supabase
      .from("withdrawal")
      .select("*")
      .eq("preview_token", preview_token)
      .eq("status", "submitted")
      .maybeSingle();

    if (fetchErr || !row) {
      return new Response(JSON.stringify({ error: "Žádost nenalezena nebo již byla potvrzena." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();

    // Mark confirmed
    const { error: updateErr } = await supabase
      .from("withdrawal")
      .update({
        status: "confirmed",
        confirmed_at: now,
        updated_at: now,
      })
      .eq("id", row.id);

    if (updateErr) {
      console.error("withdrawal-confirm update error:", updateErr);
      return new Response(JSON.stringify({ error: "Nepodařilo se potvrdit žádost." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send confirmation email
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;
    if (resendKey) {
      try {
        emailSent = await sendConfirmationEmail({
          resendKey,
          to: row.email_pro_potvrzeni,
          jmeno: row.jmeno_prijmeni,
          withdrawalId: row.id,
          withdrawalType: row.type,
          cisloObjednavky: row.cislo_objednavky,
          submittedAt: row.submitted_at,
        });

        if (emailSent) {
          await supabase
            .from("withdrawal")
            .update({ confirmation_email_sent_at: now, updated_at: now })
            .eq("id", row.id);
        }
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }
    }

    // Business logic: if EDGE_CASE, send escalation alert to admin
    if (row.type === "EDGE_CASE" && resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Deseyo System <system@deseyo.cz>",
            to: ["clenstvi@deseyo.cz"],
            subject: `[EDGE CASE] Odstoupení od smlouvy – manuální zpracování #${row.id.slice(0, 8).toUpperCase()}`,
            text: `Nová žádost o odstoupení vyžaduje manuální zpracování.\n\nID: ${row.id}\nJméno: ${row.jmeno_prijmeni}\nEmail: ${row.email_z_objednavky}\nObjednávka: ${row.cislo_objednavky || "—"}\nTyp: ${row.type}\n\nSnapshot:\n${JSON.stringify(row.content_snapshot, null, 2)}`,
          }),
        });
        await supabase
          .from("withdrawal")
          .update({ escalated_at: now, updated_at: now })
          .eq("id", row.id);
      } catch (escErr) {
        console.error("Escalation email error:", escErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      id: row.id,
      type: row.type,
      status: "confirmed",
      email_sent: emailSent,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("withdrawal-confirm error:", err);
    return new Response(JSON.stringify({ error: "Interní chyba serveru." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
