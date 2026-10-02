import { requireAdminPage } from "@/lib/admin-page";
import { can } from "@/lib/admin-permissions";
import { readImportDashboard } from "@/lib/catalogue-import-management";
import { AdminShell } from "@/components/admin-shell";
import { AdminImports } from "@/components/admin-imports";
export default async function ImportsPage(){const session=await requireAdminPage("catalogue.read");return <AdminShell access={session.access} active="/admin/imports" title="Les découvertes du catalogue" description="Comparer les sources, vérifier les correspondances et valider chaque import."><AdminImports initial={await readImportDashboard()} canImport={can(session.access,"catalogue.import")}/></AdminShell>;}
