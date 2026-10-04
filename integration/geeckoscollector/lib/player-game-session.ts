import { headers } from "next/headers";
import { auth } from "./auth";
import { getGameAccess } from "./game-access";
import { AdminError } from "./admin-authorisation";
export async function playerGameSession(){
 const session=await auth.api.getSession({headers:await headers()});
 if(!session)throw new AdminError("Connecte-toi pour jouer.",401);
 if(!session.user.username||!session.user.emailVerified)throw new AdminError("Complète ton compte et vérifie ton adresse e-mail.",403);
 if(!(await getGameAccess(session.user.id)).allowed)throw new AdminError("Le jeu est en maintenance.",503);
 return session;
}
