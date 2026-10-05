import Link from "next/link";
import { PlayerChrome } from "@/components/player-ui";
import { SignInForm,SocialButtons } from "@/components/auth-forms";
import { getSiteSettings } from "@/lib/site-settings";
export const dynamic="force-dynamic";
export default async function SignInPage({searchParams}:{searchParams:Promise<{authError?:string}>}){
 const [config,query]=await Promise.all([getSiteSettings(),searchParams]);
 return <><PlayerChrome active="login"/><main className="shell auth-wrap"><section className="auth-card"><span className="mini-tag">Bon retour parmi les collectionneurs</span><h1>Connexion</h1><p>Retrouve ta collection et découvre ce qui t’attend.</p>
 {query.authError==="oauth"&&<p className="alert" role="alert">La connexion avec ce fournisseur n’a pas abouti. Réessaie avec le moyen de connexion de ton compte existant.</p>}
 {!config.registrationsEnabled&&<p className="availability-info availability-message">{config.registrationMessage}</p>}
 <SignInForm/><SocialButtons/><p className="auth-foot">{config.registrationsEnabled?<>Pas encore de compte ? <Link href="/inscription">Créer mon compte</Link></>:<Link href="/inscription">Informations sur les inscriptions</Link>}</p></section></main></>;
}
