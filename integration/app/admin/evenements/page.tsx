import {requireAdminPage} from "@/lib/admin-page";
import {AdminShell} from "@/components/admin-shell";
import {AdminEvents} from "@/components/admin-events";
export default async function Page(){const s=await requireAdminPage("events.read");return <AdminShell access={s.access} active="/admin/evenements" title="Les rendez-vous du jeu" description="Publier les annonces et préparer les futurs défis de la collection."><AdminEvents permissions={s.access.permissions} superAdmin={s.access.superAdmin}/></AdminShell>;}
