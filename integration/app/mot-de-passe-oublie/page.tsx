import Link from "next/link";
import { KeyRound } from "lucide-react";
import { PlayerChrome } from "@/components/player-ui";
import { ForgotPasswordForm } from "@/components/auth-forms";
export default function ForgotPasswordPage(){return <><PlayerChrome active="login"/><main className="shell auth-wrap"><section className="auth-card"><span className="mini-tag">On va t’aider à revenir</span><h1>Mot de passe oublié</h1><p>Indique l’adresse e-mail de ton compte. Nous t’enverrons un lien de réinitialisation.</p><ForgotPasswordForm/><p className="auth-foot"><Link href="/connexion"><KeyRound size={14} style={{verticalAlign:"middle"}}/> Retour à la connexion</Link></p></section></main></>}
