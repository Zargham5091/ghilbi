import { THEMES, type SceneKind, type ThemeKey } from "./content";

const rnd = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const hills = `
<path d='M0 640 C250 540 450 600 700 560 S1150 520 1600 610 V1000 H0Z' fill='#000' opacity='.25'/>
<path d='M0 740 C300 650 600 760 900 690 S1400 650 1600 720 V1000 H0Z' fill='#000' opacity='.38'/>
<path d='M0 850 C400 790 800 880 1200 820 S1500 800 1600 840 V1000 H0Z' fill='#000' opacity='.55'/>`;

function extra(kind: SceneKind, accent: string): string {
  switch (kind) {
    case "hills": {
      let s = hills;
      s += `<rect x='260' y='700' width='120' height='80' fill='#1b1230' opacity='.9'/>
      <path d='M240 705 L320 640 L400 705Z' fill='#2a1b44'/><rect x='300' y='730' width='26' height='34' fill='${accent}' opacity='.9'/>`;
      for (let i = 0; i < 9; i++) {
        const x = 700 + rnd(i + 1) * 800;
        const y = 760 + rnd(i + 20) * 120;
        s += `<circle cx='${x}' cy='${y}' r='${26 + rnd(i + 40) * 24}' fill='#000' opacity='.45'/>`;
      }
      return s;
    }
    case "forest": {
      let s = hills;
      for (let i = 0; i < 16; i++) {
        const x = rnd(i + 1) * 1600;
        const y = 760 + rnd(i + 30) * 200;
        const h = 150 + rnd(i + 60) * 170;
        s += `<rect x='${x - 7}' y='${y - h * 0.4}' width='14' height='${h * 0.5}' fill='#000' opacity='.6'/>
        <ellipse cx='${x}' cy='${y - h * 0.65}' rx='${h * 0.34}' ry='${h * 0.5}' fill='#000' opacity='.5'/>`;
      }
      s += `<polygon points='520,0 660,0 380,1000 240,1000' fill='#fff' opacity='.07'/>
      <polygon points='900,0 1000,0 800,1000 700,1000' fill='#fff' opacity='.06'/>`;
      return s;
    }
    case "desk":
      return `<rect width='1600' height='1000' fill='#120d22' opacity='.82'/>
      <rect x='330' y='110' width='940' height='520' rx='18' fill='url(#s)'/>
      <circle cx='1040' cy='270' r='60' fill='#fff6dc' opacity='.9'/>
      <path d='M330 540 L470 420 L560 490 L690 380 L820 500 L930 430 L1060 520 L1170 450 L1270 530 V630 H330Z' fill='#000' opacity='.4'/>
      <g fill='#1a1230'><rect x='330' y='110' width='940' height='14'/><rect x='330' y='616' width='940' height='14'/><rect x='330' y='110' width='14' height='520'/><rect x='1256' y='110' width='14' height='520'/><rect x='793' y='110' width='14' height='520'/></g>
      <rect y='680' width='1600' height='320' fill='#241a3a'/><rect y='680' width='1600' height='16' fill='#3c2b52'/>
      <rect x='520' y='620' width='560' height='34' rx='8' fill='#0f0b1e'/>
      <rect x='590' y='490' width='420' height='140' rx='10' fill='#0b0818'/><rect x='602' y='502' width='396' height='116' rx='6' fill='${accent}' opacity='.35'/>
      <g fill='${accent}' opacity='.85'><rect x='620' y='522' width='150' height='7' rx='3'/><rect x='640' y='540' width='210' height='7' rx='3'/><rect x='640' y='558' width='120' height='7' rx='3'/></g>
      <circle cx='1230' cy='600' r='230' fill='url(#g)' opacity='.8'/>
      <path d='M1230 740 V630 L1270 580' stroke='#d9a95b' stroke-width='10' fill='none' stroke-linecap='round'/><path d='M1250 560 L1310 580 L1285 620Z' fill='${accent}'/>
      <rect x='1200' y='740' width='60' height='12' rx='5' fill='#d9a95b'/>
      <rect x='260' y='690' width='60' height='60' rx='10' fill='#6b4a3a'/><path d='M290 690 q-24 -50 0 -70 q24 20 0 70' fill='#5aa66a'/>`;
    case "city": {
      let s = `<rect y='820' width='1600' height='180' fill='#000' opacity='.6'/>`;
      let x = -20;
      let i = 0;
      while (x < 1620) {
        const w = 70 + rnd(i + 1) * 90;
        const h = 220 + rnd(i + 50) * 380;
        s += `<rect x='${x}' y='${820 - h}' width='${w}' height='${h}' fill='#000' opacity='${0.5 + rnd(i + 90) * 0.25}'/>`;
        for (let k = 0; k < 14; k++) {
          const wx = x + 10 + rnd(i * 20 + k) * (w - 24);
          const wy = 820 - h + 14 + rnd(i * 31 + k + 7) * (h - 40);
          s += `<rect x='${wx}' y='${wy}' width='6' height='9' fill='${accent}' opacity='${0.35 + rnd(k + i) * 0.55}'/>`;
        }
        x += w + 8;
        i++;
      }
      s += `<rect x='790' y='140' width='14' height='300' fill='#000' opacity='.7'/><circle cx='797' cy='136' r='7' fill='${accent}'/>`;
      return s;
    }
    case "vineyard": {
      let s = hills;
      for (let r = 0; r < 11; r++) {
        const x0 = -300 + r * 220;
        const x1 = 800 + (x0 - 800) * 0.12;
        s += `<path d='M${x0} 1000 L${x1} 640' stroke='#000' stroke-width='${18 - r * 0.6}' opacity='.4' stroke-linecap='round'/>`;
        for (let k = 0; k < 6; k++) {
          const t = 0.15 + k * 0.15;
          s += `<circle cx='${x0 + (x1 - x0) * t}' cy='${1000 + (640 - 1000) * t}' r='${12 - k}' fill='${accent}' opacity='.75'/>`;
        }
      }
      return s;
    }
  }
}

const cache = new Map<string, string>();

/** Generated, network-free background scene as a data URI. */
export function sceneDataUri(kind: SceneKind, themeKey: ThemeKey): string {
  const key = `${kind}:${themeKey}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const t = THEMES[themeKey];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'>
<defs>
<linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${t.from}'/><stop offset='.55' stop-color='${t.via}'/><stop offset='1' stop-color='${t.to}'/></linearGradient>
<radialGradient id='g'><stop offset='0' stop-color='${t.accent}' stop-opacity='.9'/><stop offset='1' stop-color='${t.accent}' stop-opacity='0'/></radialGradient>
</defs>
<rect width='1600' height='1000' fill='url(#s)'/>
<circle cx='1170' cy='320' r='240' fill='url(#g)'/><circle cx='1170' cy='320' r='84' fill='#fff6dc' opacity='.92'/>
<g fill='#fff' opacity='.22'><ellipse cx='300' cy='200' rx='150' ry='34'/><ellipse cx='400' cy='222' rx='110' ry='26'/><ellipse cx='820' cy='140' rx='170' ry='36'/><ellipse cx='1380' cy='230' rx='120' ry='28'/></g>
${extra(kind, t.accent)}
</svg>`;
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  cache.set(key, uri);
  return uri;
}
