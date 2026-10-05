import Link from "next/link";
import { MailCheck } from "lucide-react";
import { PlayerChrome } from "@/components/player-ui";
import { ResendVerificationForm } from "@/components/auth-forms";
export default function VerificationPage(){return <><PlayerChrome/><main className="shell auth-wrap"><section className="auth-card" style={{textAlign:"center"}}><div className="news-icon" style={{margin:"0 auto 18px",width:64,height:64}}><MailCheck size={28}/></div><span className="mini-tag">Plus qu’une étape</span><h1>Vérifie ton e-mail</h1><p>Un lien de confirmation vient d’être envoyé à l’adresse indiquée. Pense aussi à regarder dans tes courriers indésirables.</p><ResendVerificationForm/><p className="auth-foot"><Link href="/connexion">Retour à la connexion</Link></p></section></main></>}
