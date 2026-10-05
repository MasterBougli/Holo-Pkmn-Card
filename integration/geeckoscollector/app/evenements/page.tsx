import {PlayerChrome} from "@/components/player-ui";import {EventFeed} from "@/components/event-feed";
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){const p=await searchParams,page=Math.min(1000,Math.max(0,Math.floor(Number(p.page)||0)));return <><PlayerChrome active="events"/><main className="catalogue-main"><span className="section-kicker">LES RENDEZ-VOUS DU JEU</span><h1>Événements</h1><EventFeed limit={12} offset={page*12} pagination/></main></>;}
