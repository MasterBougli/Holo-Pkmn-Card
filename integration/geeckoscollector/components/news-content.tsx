import type {NewsContent} from "@/lib/news-types";
import {safeNewsLink} from "@/lib/news-types";
export function NewsContentView({content,preview=false}:{content:NewsContent;preview?:boolean}){
 const Title=preview?"h2":"h1";
 return <article className="news-article"><header><span className="section-kicker">LE JOURNAL DU JEU</span><Title className="news-title">{content.title||"Titre de l’actualité"}</Title>{content.summary&&<p className="news-lead">{content.summary}</p>}{content.coverId&&<img className="news-cover" src={"/api/news/media/"+content.coverId} alt={content.coverAlt}/>}</header><div className="news-prose">{content.blocks.map(b=>{
 const text=b.bold?<strong>{b.text}</strong>:b.text,styled=b.italic?<em>{text}</em>:text;
 if(b.type==="image")return b.mediaId?<figure key={b.id}><img src={"/api/news/media/"+b.mediaId} alt={b.alt??""}/>{b.text&&<figcaption>{b.text}</figcaption>}</figure>:null;
 if(b.type==="heading")return <h2 key={b.id}>{styled}</h2>;
 if(b.type==="list")return <ul key={b.id}>{b.text.split("\n").filter(Boolean).map((line,i)=><li key={i}>{b.bold?<strong>{line}</strong>:line}</li>)}</ul>;
 if(b.type==="quote")return <blockquote key={b.id}>{styled}</blockquote>;
 if(b.type==="link")return safeNewsLink(b.href??"")?<p key={b.id}><a href={b.href} rel="noopener noreferrer">{styled}</a></p>:<p key={b.id}>{styled}</p>;
 return <p key={b.id}>{styled}</p>;
 })}{content.link&&safeNewsLink(content.link)&&<p><a className="quiet-button" href={content.link} rel="noopener noreferrer">En savoir plus</a></p>}</div></article>;
}
