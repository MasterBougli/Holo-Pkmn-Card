"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { PasswordField } from "@/components/password-field";
import { passwordError } from "@/lib/password-policy";

type AuthResult={error?:{message?:string}|null;data?:unknown|null};
function ErrorMessage({message}:{message:string}){return message?<p className="alert" role="alert">{message}</p>:null}

export function SignInForm(){
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");setBusy(true);const form=new FormData(event.currentTarget);const identifier=String(form.get("identifier")||"").trim();const password=String(form.get("password")||"");
    try{const result=(identifier.includes("@")?await authClient.signIn.email({email:identifier,password,callbackURL:"/compte"}):await authClient.signIn.username({username:identifier,password,callbackURL:"/compte"})) as AuthResult;
      if(result.error){setError(result.error.message??"Connexion impossible. Vérifie tes identifiants et réessaie.");return}router.push("/compte");router.refresh();
    }catch{setError("Le service de connexion est momentanément indisponible. Réessaie dans un instant.")}finally{setBusy(false)}
  }
  return <form onSubmit={submit}><div className="form-field"><label htmlFor="identifier">E-mail ou pseudo</label><input id="identifier" name="identifier" autoComplete="username" placeholder="toi@exemple.fr ou TonPseudo" required/></div><div className="form-field"><label htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" autoComplete="current-password" required/></div><a className="forgot-link" href="/mot-de-passe-oublie">Mot de passe oublié ?</a><ErrorMessage message={error}/><button className="button full" type="submit" disabled={busy}>{busy?"Connexion…":"Se connecter"} <ArrowRight size={16}/></button></form>
}

export function SignUpForm(){
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");const form=new FormData(event.currentTarget);const email=String(form.get("email")||"").trim();const username=String(form.get("username")||"").trim();const password=String(form.get("password")||"");const confirm=String(form.get("passwordConfirm")||"");
    if(!/^[A-Za-z0-9]{4,16}$/.test(username)){setError("Le pseudo doit contenir de 4 à 16 lettres A-Z ou chiffres 0-9.");return}if(password!==confirm){setError("Les deux mots de passe ne correspondent pas.");return}
    const strengthError=passwordError(password);if(strengthError){setError(strengthError);return}
    setBusy(true);try{const result=await authClient.signUp.email({email,name:username,password,username,displayUsername:username,callbackURL:"/compte"}) as AuthResult;if(result.error){setError(result.error.message??"La création du compte a échoué. Réessaie.");return}router.push("/verification");
    }catch{setError("Le service d’inscription est momentanément indisponible. Réessaie dans un instant.")}finally{setBusy(false)}
  }
  return <form onSubmit={submit}><div className="form-field"><label htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" autoComplete="email" placeholder="toi@exemple.fr" required/></div><div className="form-field"><label htmlFor="username">Pseudo</label><input id="username" name="username" autoComplete="username" minLength={4} maxLength={16} pattern="[A-Za-z0-9]{4,16}" title="4 à 16 lettres A-Z ou chiffres 0-9" required/><span className="form-hint">4 à 16 caractères : lettres A-Z et chiffres 0-9. La casse sera conservée.</span></div><PasswordField id="password" label="Mot de passe"/><div className="form-field"><label htmlFor="password-confirm">Confirmer le mot de passe</label><input id="password-confirm" name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} maxLength={64} required/></div><ErrorMessage message={error}/><button className="button full" type="submit" disabled={busy}>{busy?"Création…":"Créer mon compte par e-mail"} <ArrowRight size={17}/></button></form>
}

export function SocialButtons(){const [error,setError]=useState("");const [busy,setBusy]=useState(false);const googleEnabled=process.env.NEXT_PUBLIC_GOOGLE_ENABLED==="true";const twitchEnabled=process.env.NEXT_PUBLIC_TWITCH_ENABLED==="true";
  async function start(provider:"google"|"twitch"){setError("");setBusy(true);try{const result=await authClient.signIn.social({provider,callbackURL:"/choisir-pseudo",errorCallbackURL:"/connexion?authError=oauth"}) as AuthResult;if(result.error)setError(result.error.message??"La connexion n’a pas pu démarrer.")}catch{setError("Le service de connexion est momentanément indisponible.")}finally{setBusy(false)}}
  return <><div className="divider">ou continuer avec</div><button className="social-button" type="button" disabled={!googleEnabled||busy} onClick={()=>start("google")}>G Continuer avec Google{!googleEnabled&&<small> — configuration à terminer</small>}</button><button className="social-button" type="button" disabled={!twitchEnabled||busy} onClick={()=>start("twitch")}><Gamepad2 size={17}/> Continuer avec Twitch{!twitchEnabled&&<small> — configuration à terminer</small>}</button><ErrorMessage message={error}/></>
}

export function ForgotPasswordForm(){const [done,setDone]=useState(false);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const email=String(new FormData(event.currentTarget).get("email")||"");try{const result=await authClient.requestPasswordReset({email,redirectTo:"/reset-mot-de-passe"}) as AuthResult;if(result.error){setError(result.error.message??"Impossible d’envoyer le lien. Réessaie.");return}setDone(true)}catch{setError("Le service d’envoi est momentanément indisponible. Réessaie dans un instant.")}finally{setBusy(false)}}
  if(done)return <div className="alert" role="status">Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé.</div>;
  return <form onSubmit={submit}><div className="form-field"><label htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" autoComplete="email" placeholder="toi@exemple.fr" required/></div><ErrorMessage message={error}/><button className="button full" type="submit" disabled={busy}>{busy?"Envoi…":"Envoyer le lien"} <ArrowRight size={17}/></button></form>
}

export function ResendVerificationForm(){const [done,setDone]=useState(false);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");setBusy(true);const email=String(new FormData(event.currentTarget).get("email")||"");try{const result=await authClient.sendVerificationEmail({email,callbackURL:"/compte"}) as AuthResult;if(result.error){setError(result.error.message??"Impossible de renvoyer le lien.");return}setDone(true)}catch{setError("Le service d’envoi est momentanément indisponible. Réessaie dans un instant.")}finally{setBusy(false)}}
  if(done)return <div className="alert" role="status">Si cette adresse attend une confirmation, un nouveau lien vient d’être envoyé.</div>;
  return <form onSubmit={submit}><div className="form-field" style={{textAlign:"left"}}><label htmlFor="resend-email">Adresse e-mail</label><input id="resend-email" name="email" type="email" autoComplete="email" required/></div><ErrorMessage message={error}/><button className="button full" type="submit" disabled={busy}>{busy?"Envoi…":"Renvoyer le lien"}</button></form>
}

export function ChooseUsernameForm(){const [error,setError]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");const username=String(new FormData(event.currentTarget).get("username")||"").trim();if(!/^[A-Za-z0-9]{4,16}$/.test(username)){setError("Choisis un pseudo de 4 à 16 lettres ou chiffres.");return}setBusy(true);try{const result=await authClient.updateUser({username,displayUsername:username}) as AuthResult;if(result.error){setError(result.error.message??"Ce pseudo n’est pas disponible.");return}router.push("/compte");router.refresh()}catch{setError("Le service de compte est momentanément indisponible. Réessaie.")}finally{setBusy(false)}}
  return <form onSubmit={submit}><div className="form-field"><label htmlFor="username">Ton pseudo unique</label><input id="username" name="username" minLength={4} maxLength={16} pattern="[A-Za-z0-9]{4,16}" required/><span className="form-hint">4 à 16 lettres A-Z ou chiffres 0-9. Les majuscules seront conservées à l’écran.</span></div><ErrorMessage message={error}/><button className="button full" disabled={busy} type="submit">Valider mon pseudo <ArrowRight size={17}/></button></form>
}

export function ResetPasswordForm({token}:{token:string}){const [error,setError]=useState("");const [done,setDone]=useState(false);const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");const form=new FormData(event.currentTarget);const password=String(form.get("password")||"");if(password!==String(form.get("confirm")||"")){setError("Les deux mots de passe ne correspondent pas.");return}const strengthError=passwordError(password);if(strengthError){setError(strengthError);return}setBusy(true);try{const result=await authClient.resetPassword({newPassword:password,token}) as AuthResult;if(result.error){setError(result.error.message??"Le lien est invalide ou expiré.");return}setDone(true)}catch{setError("Le service de compte est momentanément indisponible. Réessaie.")}finally{setBusy(false)}}
  if(done)return <div className="alert" role="status">Ton mot de passe est changé. <a href="/connexion">Tu peux te connecter.</a></div>;
  if(!token)return <div className="alert" role="alert">Le lien de réinitialisation est absent ou incomplet. Demande un nouveau lien.</div>;
  return <form onSubmit={submit}><PasswordField id="password" label="Nouveau mot de passe"/><div className="form-field"><label htmlFor="confirm">Confirmer le mot de passe</label><input id="confirm" name="confirm" type="password" minLength={8} maxLength={64} required/></div><ErrorMessage message={error}/><button className="button full" disabled={busy} type="submit">Changer le mot de passe</button></form>
}
