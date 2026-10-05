import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PlayerChrome } from "@/components/player-ui";
import { ChooseUsernameForm } from "@/components/auth-forms";
import { auth } from "@/lib/auth";
export default async function ChooseUsernamePage(){const session=await auth.api.getSession({headers:await headers()});if(!session)redirect("/connexion");if(session.user.username)redirect("/compte");return <><PlayerChrome/><main className="shell auth-wrap"><section className="auth-card"><span className="mini-tag">Bienvenue dans l’aventure</span><h1>Choisis ton pseudo</h1><p>Il permettra aux autres collectionneurs de te reconnaître. Tu pourras ensuite accéder à ton espace joueur.</p><ChooseUsernameForm/></section></main></>}
