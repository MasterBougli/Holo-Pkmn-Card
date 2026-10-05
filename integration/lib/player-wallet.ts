import {eq,sql} from "drizzle-orm";
import {db} from "./db";
import {playerWallets} from "./event-reward-schema";
export async function playerWallet(userId:string){const [wallet]=await db.select({coins:sql<string>`coins::text`,gems:sql<string>`gems::text`}).from(playerWallets).where(eq(playerWallets.userId,userId)).limit(1);return wallet??{coins:"0",gems:"0"};}
