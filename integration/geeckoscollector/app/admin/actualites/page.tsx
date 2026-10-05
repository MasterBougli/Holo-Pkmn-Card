import {requireAdminPage} from "@/lib/admin-page";
import {AdminShell} from "@/components/admin-shell";
import {AdminNews} from "@/components/admin-news";
export default async function Page(){const s=await requireAdminPage("news.read");return <AdminShell access={s.access} active="/admin/actualites" title="Le journal du jeu" description="Rédiger, préparer et publier les nouvelles de la collection."><AdminNews permissions={s.access.permissions} superAdmin={s.access.superAdmin}/></AdminShell>;}
