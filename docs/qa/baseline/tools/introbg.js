// Measures contrast of the md+ hero intro paragraph against the pixels actually behind it.
const { chromium } = require("playwright"); const { PNG } = require("pngjs");
const lum = (r,g,b)=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)};
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[768,1024],[1024,1366],[1280,800],[1440,900]]){
 const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();await p.goto(process.argv[2],{waitUntil:"networkidle"});await p.waitForTimeout(2500);
 const sel=null;
 const box=await p.evaluate(s=>{const e=[...document.querySelectorAll("header p")].find(x=>getComputedStyle(x).display!=="none"&&x.textContent.includes("I build"));e.style.color="transparent";const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}},sel);
 await p.evaluate(()=>document.querySelector("nav").style.visibility="hidden");
 const png=PNG.sync.read(await p.screenshot({clip:box}));const L=[];
 for(let i=0;i<png.data.length;i+=4)L.push(lum(png.data[i],png.data[i+1],png.data[i+2]));L.sort((a,b)=>a-b);
 const ink=lum(40,44,32);const cr=l=>((Math.max(l,ink)+0.05)/(Math.min(l,ink)+0.05)).toFixed(2);
 const darkShare=(L.filter(l=>((Math.max(l,ink)+0.05)/(Math.min(l,ink)+0.05))<4.5).length/L.length*100).toFixed(1);
 console.log(`${w}x${h} intro box ${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}: worst ${cr(L[0])}:1, p10 ${cr(L[Math.floor(L.length*0.1)])}:1, median ${cr(L[Math.floor(L.length/2)])}:1, pixels under 4.5:1 = ${darkShare}%`);
}
await b.close()})();
