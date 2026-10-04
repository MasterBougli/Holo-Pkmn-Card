import { db } from "./db";
import { gameRarities } from "./rarity-schema";
export { canonicalRarity,findRarity } from "./rarity-types";
export async function getGameRarities(connection:Pick<typeof db,"select">=db){return (await connection.select().from(gameRarities)).sort((a,b)=>a.name.localeCompare(b.name,"fr"));}
