import type { EventReward } from "./event-types";
export type CollectionRewardConfig = { setCode: string; enabled: boolean; rewards: EventReward[]; revision: number };
export type RewardSetReference = { code: string; name: string };
