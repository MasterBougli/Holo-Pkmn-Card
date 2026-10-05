export type AuthEmailPurpose = "verification" | "reset-password";

function escapeHtml(value: string) {
  const escapes: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (character) => escapes[character]);
}

export function buildAuthEmail(subject: string, url: string, purpose: AuthEmailPurpose) {
  const verification = purpose === "verification";
  const title = verification ? "Ta collection commence ici" : "Retrouve ton accès au jeu";
  const label = verification ? "VALIDATION DU COMPTE" : "SÉCURITÉ DU COMPTE";
  const intro = verification
    ? "Bienvenue sur GeeckosCollector ! Tu as demandé la création d’un compte. Il te reste à confirmer ton adresse e-mail pour accéder à ton espace joueur."
    : "Tu as demandé à réinitialiser le mot de passe de ton compte GeeckosCollector. Choisis un nouveau mot de passe pour retrouver ton espace joueur.";
  const action = verification ? "Confirmer mon adresse e-mail" : "Choisir mon nouveau mot de passe";
  const notice = verification
    ? "Si tu n’as pas demandé la création de ce compte, tu peux ignorer ce message."
    : "Si tu n’as pas demandé ce changement, ignore ce message : ton mot de passe reste inchangé.";
  const safeUrl = escapeHtml(url);
  return {
    subject: `GeeckosCollector — ${subject}`,
    text: ["GeeckosCollector", title, "", intro, "", action + " :", url, "", notice,
      "Ce lien est personnel et temporaire. Ne le partage pas.",
      "", "Message automatique envoyé à la suite d’une demande concernant ton compte."].join("\n"),
    html: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#f4f8fc;color:#10284a;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f8fc"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border:1px solid #dbe6f0;border-radius:20px;overflow:hidden;background-color:#ffffff">
<tr><td bgcolor="#123b71" style="padding:28px 24px;color:#ffffff;border-radius:20px 20px 0 0">
<p style="margin:0 0 20px;font-size:22px;font-weight:bold;color:#ffffff">Geeckos<span style="color:#ffd452">Collector</span></p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#47d5dc" style="padding:5px 12px;border-radius:6px;color:#10284a;font-size:13px;font-weight:bold">${label}</td></tr></table>
<h1 style="margin:16px 0 0;font-size:30px;line-height:1.25;color:#ffffff">${title}</h1>
</td></tr>
<tr><td bgcolor="#ffd452" height="5" style="height:5px;line-height:5px;font-size:1px">&nbsp;</td></tr>
<tr><td style="padding:28px 24px">
<p style="margin:0 0 24px;font-size:16px;line-height:1.65">${intro}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f8fc" style="border:1px solid #dbe6f0;border-radius:14px"><tr><td style="padding:20px">
<p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#123b71">${verification ? "DERNIÈRE ÉTAPE AVANT L’AVENTURE" : "UNE NOUVELLE CLÉ POUR TON COMPTE"}</p>
<p style="margin:0;font-size:16px;line-height:1.65">${verification ? "Valide ton adresse avec le bouton ci-dessous." : "Utilise le bouton ci-dessous pour définir ton nouveau mot de passe."}</p>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0"><tr><td bgcolor="#ffd452" style="border:2px solid #123b71;border-radius:10px;text-align:center"><a href="${safeUrl}" style="display:inline-block;padding:14px 20px;color:#10284a;font-size:16px;font-weight:bold;line-height:1.5;text-decoration:underline">${action}</a></td></tr></table>
<p style="margin:0 0 8px;font-size:16px">${notice}</p>
<p style="margin:0 0 24px;font-size:16px">Ce lien est personnel et temporaire. Ne le partage pas.</p>
<p style="margin:0 0 8px;font-size:14px;color:#405875">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :</p>
<p style="margin:0;font-size:14px;line-height:1.6;word-break:break-all;overflow-wrap:anywhere"><a href="${safeUrl}" style="color:#123b71;text-decoration:underline;word-break:break-all">${safeUrl}</a></p>
</td></tr>
<tr><td bgcolor="#edf4fa" style="padding:20px 24px;border-top:1px solid #dbe6f0;border-radius:0 0 20px 20px"><p style="margin:0;font-size:14px;color:#405875">Message automatique envoyé à la suite d’une demande concernant ton compte GeeckosCollector.</p></td></tr>
</table>
</td></tr></table>
</body></html>`,
  };
}
