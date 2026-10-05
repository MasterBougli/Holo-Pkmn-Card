"use client";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { passwordError, passwordStrength } from "@/lib/password-policy";

export function PasswordField({id,label}:{id:string;label:string}) {
  const [value,setValue]=useState("");
  const [visible,setVisible]=useState(false);
  const score=useMemo(()=>passwordStrength(value),[value]);
  const labels=["Très faible","Faible","Moyen — insuffisant","Fort","Très fort"];
  return <div className="form-field"><label htmlFor={id}>{label}</label>
    <div className="password-input"><input id={id} name="password" type={visible?"text":"password"} autoComplete="new-password" minLength={8} maxLength={64} required value={value} aria-describedby={id+"-help "+id+"-strength"} onChange={event=>{const next=event.target.value;setValue(next);event.target.setCustomValidity(next?passwordError(next):"")}}/><button className="password-toggle" type="button" aria-label={visible?"Masquer le mot de passe":"Afficher le mot de passe"} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={19} aria-hidden="true"/>:<Eye size={19} aria-hidden="true"/>}</button></div>
    <span id={id+"-help"} className="form-hint">8 à 64 caractères. Tous les caractères sont acceptés. Privilégie une phrase longue et imprévisible.</span>
    <div className="password-strength" id={id+"-strength"}><meter min={0} max={4} low={2} high={3} optimum={4} value={score} aria-label="Solidité estimée du mot de passe"/><span role="status">{value?"Solidité : "+labels[score]:"Solidité : en attente"}</span></div>
  </div>;
}
