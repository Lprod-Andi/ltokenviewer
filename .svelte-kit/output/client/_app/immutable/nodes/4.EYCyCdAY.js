import{H as D}from"../chunks/OA8UcISh.js";import{_ as k}from"../chunks/C1FmrZbK.js";import{s as A,n as d,o as C,h as H}from"../chunks/Cuw_VhVy.js";import{S as L,i as T,d as g,s as F,b as i,c as y,x as n,B as R,h as E,e as x,f as j,C as I,g as S,l as w,j as b,k as B}from"../chunks/BmzIhm5K.js";function z(l,f){throw new D(l,f)}const O=!1;function P(){throw z(404,"Not found")}const N=Object.freeze(Object.defineProperty({__proto__:null,load:P,ssr:O},Symbol.toStringTag,{value:"Module"}));function U(l){let f,e,t,a="🔍 Ltoken Debug",m,u;return{c(){f=w(),e=b("div"),t=b("div"),t.textContent=a,m=w(),u=B(l[0]),this.h()},l(s){R("svelte-1hggqw9",document.head).forEach(g),f=E(s),e=x(s,"DIV",{style:!0});var c=j(e);t=x(c,"DIV",{style:!0,"data-svelte-h":!0}),I(t)!=="svelte-9xo7ol"&&(t.textContent=a),m=E(c),u=S(c,l[0]),c.forEach(g),this.h()},h(){document.title="Ltoken Debug",n(t,"color","#FAC775"),n(t,"margin-bottom","1rem"),n(t,"font-size","16px"),n(t,"font-family","sans-serif"),n(e,"padding","2rem"),n(e,"font-family","ui-monospace, monospace"),n(e,"font-size","13px"),n(e,"line-height","1.8"),n(e,"background","#111"),n(e,"color","#e0e0e0"),n(e,"min-height","100vh"),n(e,"white-space","pre-wrap")},m(s,h){i(s,f,h),i(s,e,h),y(e,t),y(e,m),y(e,u)},p(s,[h]){h&1&&F(u,s[0])},i:d,o:d,d(s){s&&(g(f),g(e))}}}function V(l,f,e){let t="Warte auf Browser...",a=null;return C(async()=>{var m,u;e(0,t="Lade js-tiktoken...");try{const{getEncoding:s}=await k(async()=>{const{getEncoding:o}=await import("../chunks/DyzTOz7e.js");return{getEncoding:o}},[],import.meta.url);e(0,t+=`
✓ Import OK`),a=s("cl100k_base"),e(0,t+=`
✓ Encoder erstellt`);const c=a.encode("Hallo");e(0,t+=`
✓ encode("Hallo") = [${Array.from(c).join(", ")}]`),e(0,t+=`
  typeof tokens = ${typeof c}`),e(0,t+=`
  tokens constructor = ${(m=c==null?void 0:c.constructor)==null?void 0:m.name}`);const p=c[0];e(0,t+=`

Erster Token ID: ${p}`);const r=a.decode([p]);e(0,t+=`
  decode([${p}]) zurückgegeben`),e(0,t+=`
  typeof decoded = ${typeof r}`),e(0,t+=`
  constructor = ${(u=r==null?void 0:r.constructor)==null?void 0:u.name}`),e(0,t+=`
  instanceof Uint8Array = ${r instanceof Uint8Array}`),e(0,t+=`
  instanceof Array = ${Array.isArray(r)}`),e(0,t+=`
  length = ${r==null?void 0:r.length}`),e(0,t+=`
  Werte = [${Array.from(r).join(", ")}]`),e(0,t+=`

--- Konvertierungsversuche ---`);try{const o=new Uint8Array(r),_=new TextDecoder("utf-8",{fatal:!1}).decode(o);e(0,t+=`
1. new Uint8Array + TextDecoder = "${_}" (len=${_.length})`)}catch(o){e(0,t+=`
1. FEHLER: ${o.message}`)}try{const o=new TextDecoder("utf-8",{fatal:!1}).decode(r);e(0,t+=`
2. TextDecoder direkt = "${o}" (len=${o.length})`)}catch(o){e(0,t+=`
2. FEHLER: ${o.message}`)}try{const o=String.fromCharCode(...Array.from(r));e(0,t+=`
3. fromCharCode = "${o}" (len=${o.length})`)}catch(o){e(0,t+=`
3. FEHLER: ${o.message}`)}try{const o=Buffer.from(r).toString("utf-8");e(0,t+=`
4. Buffer.from = "${o}" (len=${o.length})`)}catch(o){e(0,t+=`
4. FEHLER (erwartet im Browser): ${o.message}`)}try{const o=new TextDecoder("utf-8",{fatal:!1}).decode(r.buffer);e(0,t+=`
5. .buffer + TextDecoder = "${o}" (len=${o.length})`)}catch(o){e(0,t+=`
5. FEHLER: ${o.message}`)}e(0,t+=`

✓ Debug abgeschlossen`)}catch(s){e(0,t+=`

❌ FEHLER: ${s.message}
${s.stack}`)}}),H(()=>{try{a==null||a.free()}catch{}a=null}),[t]}class G extends L{constructor(f){super(),T(this,f,V,U,A,{})}}export{G as component,N as universal};
