import Link from "next/link";
import {notFound} from "next/navigation";
import {PlayerChrome} from "@/components/player-ui";
import {NewsContentView} from "@/components/news-content";
import {publicNewsArticle} from "@/lib/news-management";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params,a=await publicNewsArticle(slug);if(!a)notFound();return <><PlayerChrome/><main className="catalogue-main news-reading"><Link className="quiet-button" href="/actualites">Retour aux actualités</Link>{a.date&&<time dateTime={new Date(a.date).toISOString()}>{new Date(a.date).toLocaleString("fr-FR",{timeZone:"Europe/Paris"})}</time>}<NewsContentView content={a.content}/></main></>;}
