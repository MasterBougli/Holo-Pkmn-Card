import { Pool } from "pg";
import { readFile,readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
const pool=new Pool({connectionString:process.env.DATABASE_URL}),client=await pool.connect();
const key=v=>v.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ");
try{
 await client.query("BEGIN");await client.query("SELECT pg_advisory_xact_lock(748291034)");
 if(Number((await client.query("SELECT count(*) FROM game_rarities")).rows[0].count)===0){
  const names=[];
  const setting=(await client.query("SELECT booster_reveal_styles FROM site_settings WHERE id='site'")).rows[0];names.push(...Object.keys(setting?.booster_reveal_styles??{}));
  names.push(...(await client.query("SELECT DISTINCT rarity FROM catalogue_cards")).rows.map(r=>r.rarity));
  const data=JSON.parse(await readFile("lib/catalogue-data.json","utf8"));for(const set of data.sets)names.push(...set.cards.map(c=>c.rarity));
  let files=[];try{files=await readdir("Web/CardDetails");}catch{}
  for(const file of files.filter(n=>/^[A-Z0-9-]+\.json$/.test(n))){const rows=JSON.parse(await readFile("Web/CardDetails/"+file,"utf8"));for(const detail of Object.values(rows))if(typeof detail?.rarity==="string")names.push(detail.rarity);}
  const groups=new Map();for(const raw of names){if(typeof raw!=="string"||!raw.trim()||raw.length>160||/[\u0000-\u001f\u007f]/.test(raw)||["__proto__","constructor","prototype"].includes(raw.trim()))continue;const name=raw.trim(),k=key(name);if(!groups.has(k))groups.set(k,[]);if(!groups.get(k).includes(name))groups.get(k).push(name);}
  for(const [k,names] of groups)await client.query("INSERT INTO game_rarities(id,name,key,aliases) VALUES($1,$2,$3,$4)",[randomUUID(),names[0],k,JSON.stringify(names.slice(1))]);
  console.log("Initial rarity registry created:",groups.size);
 }else console.log("Existing rarity registry preserved");
 await client.query("COMMIT");
}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();await pool.end();}
