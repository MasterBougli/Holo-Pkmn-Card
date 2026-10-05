import { requireAdminPage } from "@/lib/admin-page";
import { can } from "@/lib/admin-permissions";
import { collectionRewardSets } from "@/lib/collection-reward-management";
import { AdminShell } from "@/components/admin-shell";
import { AdminCollectionRewards } from "@/components/admin-collection-rewards";
export default async function CollectionRewardsPage() {
  const session = await requireAdminPage("collectionRewards.read");
  return <AdminShell access={session.access} active="/admin/recompenses-collection" title="Récompenses de collection" description="Prépare les récompenses prévues lorsqu’un joueur complète un set."><AdminCollectionRewards sets={await collectionRewardSets()} canEdit={can(session.access, "collectionRewards.edit")} /></AdminShell>;
}
