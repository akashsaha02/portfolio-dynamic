// jssize.js variant: dist dir arg + extra tags (editorial, folio) + per-page total.
const fs=require("fs"),path=require("path"),zlib=require("zlib");
(async()=>{const [url,root,dist=".next"]=process.argv.slice(2);const html=await (await fetch(url)).text();
const srcs=[...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]))];
let raw=0,gz=0;const rows=[];
for(const s of srcs){const f=path.join(root,dist,s.replace(/^\/_next\//,"").split("?")[0]);const b=fs.readFileSync(f);
 const g=zlib.gzipSync(b,{level:9}).length;raw+=b.length;gz+=g;
 const t=b.toString();const tags=[["GreenSock",/GreenSock/],["gsap",/gsap/],["ScrollTrigger",/ScrollTrigger/],["lenis",/lenis/i],["react-dom",/__reactFiber|reactFiber/],["next-router",/NEXT_ROUTER|next-router/],["editorial",/hero-develop|hero-rise|See my work|SmoothScroll|lagSmoothing/],["folio",/f-hm|folio:preloader|data-folio|f-menu|f-work/]].filter(([,r])=>r.test(t)).map(([n])=>n);
 rows.push(`${s.replace(/^\/_next\/static\/chunks\//,"").padEnd(28)} raw ${(b.length/1024).toFixed(1).padStart(6)} KB  gzip ${(g/1024).toFixed(1).padStart(5)} KB  ${tags.join(",")}`);}
console.log(url);console.log(rows.join("\n"));
console.log(`TOTAL ${srcs.length} scripts: raw ${(raw/1024).toFixed(1)} KB, gzip ${(gz/1024).toFixed(1)} KB`);
const inline=[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join("");
console.log(`inline: raw ${(inline.length/1024).toFixed(1)} KB, gzip ${(zlib.gzipSync(inline).length/1024).toFixed(1)} KB; HTML gzip ${(zlib.gzipSync(html).length/1024).toFixed(1)} KB\n`);})();
