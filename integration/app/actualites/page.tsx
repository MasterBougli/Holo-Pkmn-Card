import Link from "next/link";
import {PlayerChrome} from "@/components/player-ui";
import {NewsFeed} from "@/components/news-feed";
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){const p=await searchParams,page=Math.min(1000,Math.max(0,Math.floor(Number(p.page)||0)));return <><PlayerChrome/><main className="catalogue-main"><span className="section-kicker">LE JOURNAL DU JEU</span><h1>Actualités</h1><NewsFeed limit={12} offset={page*12} pagination/></main></>;}
