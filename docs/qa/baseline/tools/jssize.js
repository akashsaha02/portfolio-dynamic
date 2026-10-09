// JS shipped for a route: every <script src> in the served HTML, raw and gzip -9 sizes, read from .next/static.
const fs=require("fs"),path=require("path"),zlib=require("zlib");
(async()=>{const [url,root]=process.argv.slice(2);const html=await (await fetch(url)).text();
const srcs=[...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]))];
let raw=0,gz=0,br=0;const rows=[];
for(const s of srcs){const f=path.join(root,".next",s.replace(/^\/_next\//,"").split("?")[0]);const b=fs.readFileSync(f);
 const g=zlib.gzipSync(b,{level:9}).length, bb=zlib.brotliCompressSync(b).length;raw+=b.length;gz+=g;br+=bb;
 const t=b.toString();const tags=[["gsap",/GreenSock|gsap/],["ScrollTrigger",/ScrollTrigger/],["lenis",/lenis/i],["react-dom",/react-dom|__reactFiber|reactFiber/],["next-router",/next-router|NEXT_ROUTER/]].filter(([,r])=>r.test(t)).map(([n])=>n);
 rows.push(`${s.padEnd(48)} raw ${(b.length/1024).toFixed(1).padStart(6)} KB  gzip ${(g/1024).toFixed(1).padStart(5)} KB  ${tags.join(",")}`);}
const inline=[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join("");
console.log(rows.join("\n"));
console.log(`TOTAL ${srcs.length} scripts: raw ${(raw/1024).toFixed(1)} KB, gzip ${(gz/1024).toFixed(1)} KB, brotli ${(br/1024).toFixed(1)} KB`);
console.log(`inline scripts (RSC payload etc): raw ${(inline.length/1024).toFixed(1)} KB, gzip ${(zlib.gzipSync(inline).length/1024).toFixed(1)} KB; HTML gzip ${(zlib.gzipSync(html).length/1024).toFixed(1)} KB`);
const res=await fetch(url+srcs[0].slice(1),{headers:{"accept-encoding":"gzip"}});console.log("server content-encoding:",res.headers.get("content-encoding"));})();
