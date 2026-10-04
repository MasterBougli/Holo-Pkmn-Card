import Link from "next/link";
import { getBoosterArtwork } from "@/lib/booster-artwork";
import { requireAdminPage } from "@/lib/admin-page";
import { getSetCompleteness } from "@/lib/catalogue-completeness";
import { AdminShell } from "@/components/admin-shell";
import { BoosterRoom } from "@/components/booster-room";
import type { OwnedCard } from "@/lib/booster-types";
export default async function Page({searchParams}:{searchParams:Promise<{set?:string}>}){
 const session=await requireAdminPage("boosters.read"),p=await searchParams,report=await getSetCompleteness(p.set??"");
 const examples:OwnedCard[]=(report?.cards.filter(c=>!c.missing.length).slice(0,5)??[]).map((c,i)=>({id:"preview-"+i,cardId:c.id,setCode:c.setCode,setName:c.setName,name:c.name,localId:c.localId,max:report?.set.officialCount??0,rarity:c.rarity,illustrator:c.illustrator,finish:c.finishes[0],isNew:false,defects:null,position:i}));
 return <AdminShell access={session.access} active="/admin/boosters" title="Aperçu de l’ouverture" description="Démonstration sur des cartes fixes, sans booster consommé ni exemplaire attribué."><Link className="quiet-button" href="/admin/boosters">Retour à l’atelier</Link>{examples.length?<BoosterRoom preview={examples} previewArtwork={await getBoosterArtwork(report!.set.code)}/>:<section className="admin-target-panel"><h2>Complète une fiche pour afficher l’aperçu</h2><p>Une seule carte complète suffit pour cette démonstration. Le set peut rester inactif.</p></section>}</AdminShell>;
}
