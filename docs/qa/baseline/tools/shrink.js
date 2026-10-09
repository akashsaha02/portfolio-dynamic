// Re-encode full-page screenshots as JPEG (max 720px wide) so the baseline folder stays small.
const sharp=require(process.argv[3]);const fs=require("fs"),path=require("path");const dir=process.argv[2];
(async()=>{for(const f of fs.readdirSync(dir).filter(f=>f.endsWith("-full.png"))){const src=path.join(dir,f);
 const out=src.replace(/\.png$/,".jpg");const m=await sharp(src,{limitInputPixels:false}).metadata();
 await sharp(src,{limitInputPixels:false}).resize({width:Math.min(720,m.width)}).jpeg({quality:72,mozjpeg:true}).toFile(out);fs.unlinkSync(src);
 console.log(f,"->",path.basename(out),Math.round(fs.statSync(out).size/1024)+"KB");}})();
