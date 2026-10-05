import Link from "next/link";
import { PlayerChrome } from "@/components/player-ui";
import { SignUpForm,SocialButtons } from "@/components/auth-forms";
import { getSiteSettings } from "@/lib/site-settings";
export const dynamic="force-dynamic";
export default async function SignUpPage(){
 const config=await getSiteSettings();
 return <><PlayerChrome/><main className="shell auth-wrap"><section className="auth-card"><span className="mini-tag">Ta collection t’attend</span><h1>{config.registrationsEnabled?"Créer mon compte":"Inscriptions momentanément fermées"}</h1>
 {config.registrationsEnabled?<><p>Crée ton accès et choisis ton pseudo, il accompagnera ta collection.</p><SignUpForm/><SocialButtons/></>:<div className="availability-info"><p className="availability-message">{config.registrationMessage}</p><p>Tu as déjà un compte ? La connexion reste disponible par e-mail, Google ou Twitch.</p></div>}
 <p className="auth-foot">Déjà un compte ? <Link href="/connexion">Me connecter</Link></p></section></main></>;
}
