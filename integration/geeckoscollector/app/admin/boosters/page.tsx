import { requireAdminPage } from "@/lib/admin-page";
import { can } from "@/lib/admin-permissions";
import { boosterSets } from "@/lib/booster-management";
import { AdminShell } from "@/components/admin-shell";
import { AdminBoosters } from "@/components/admin-boosters";
export default async function Page(){
 const s=await requireAdminPage("boosters.read");
 return <AdminShell access={s.access} active="/admin/boosters" title="L’atelier des boosters" description="Une composition par set, des cadeaux aux joueurs, et une trace de chaque attribution."><AdminBoosters sets={await boosterSets()} canEdit={can(s.access,"boosters.edit")} canGrant={can(s.access,"boosters.grant")}/></AdminShell>;
}
