import Link from "next/link";
import { KeyRound } from "lucide-react";
import { PlayerChrome } from "@/components/player-ui";
import { ResetPasswordForm } from "@/components/auth-forms";
export default async function ResetPasswordPage({searchParams}:{searchParams:Promise<{token?:string}>}){const {token=""}=await searchParams;return <><PlayerChrome active="login"/><main className="shell auth-wrap"><section className="auth-card"><span className="mini-tag">Dernière étape</span><h1>Nouveau mot de passe</h1><p>Choisis un mot de passe de 8 à 64 caractères.</p><ResetPasswordForm token={token}/><p className="auth-foot"><Link href="/connexion"><KeyRound size={14} style={{verticalAlign:"middle"}}/> Retour à la connexion</Link></p></section></main></>}
