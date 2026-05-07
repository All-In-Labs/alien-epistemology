// Shared utilities + mock data for all three Drake-tool directions.
const { useState, useMemo, useEffect, useRef } = React;

// --- Seedable PRNG (xmur3 + sfc32) so distributions are reproducible per artboard. ---
function xmur3(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return ()=>{h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);h^=h>>>16;return h>>>0;};}
function sfc32(a,b,c,d){return ()=>{a|=0;b|=0;c|=0;d|=0;const t=(a+b|0)+d|0;d=d+1|0;a=b^b>>>9;b=c+(c<<3)|0;c=(c<<21|c>>>11);c=c+t|0;return (t>>>0)/4294967296;};}
const makeRng = (seed)=>{const s=xmur3(seed);return sfc32(s(),s(),s(),s());};

// --- Generate a fake log-uniform-ish histogram that responds to a "skew" param. ---
function fakeHistogram(seed, bins=40, skew=0, spread=1, peak=0.5){
  const rng = makeRng(seed);
  const out = new Array(bins).fill(0);
  for(let i=0;i<bins;i++){
    const x = i/(bins-1);
    const center = peak + skew*0.2;
    const d = (x-center)/(0.18*spread);
    const noise = 0.85 + 0.3*rng();
    out[i] = Math.exp(-d*d) * noise;
  }
  const max = Math.max(...out);
  return out.map(v=>v/max);
}

// --- Sparkline: tiny inline distribution preview for a single Drake parameter. ---
const Sparkline = ({values, w=120, h=28, stroke="#1a1a1a", fill="rgba(26,26,26,0.08)"}) => {
  const pts = values.map((v,i)=>`${(i/(values.length-1))*w},${h-v*h}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block'}}>
      <polygon points={area} fill={fill} />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.25" />
    </svg>
  );
};

// --- A static-ish histogram with shaded percentile bands and a vertical reference line. ---
const Histogram = ({seed="default", w=720, h=260, refLine=0.5, refLabel="GiveWell bar (1×)", skew=0, spread=1, peak=0.5, palette={}}) => {
  const bars = useMemo(()=>fakeHistogram(seed, 60, skew, spread, peak), [seed, skew, spread, peak]);
  const padL=44, padR=20, padT=20, padB=44;
  const innerW = w-padL-padR, innerH = h-padT-padB;
  const bw = innerW/bars.length;
  const accent = palette.accent || '#c2410c';
  const bar = palette.bar || '#3b3a36';
  const grid = palette.grid || 'rgba(0,0,0,0.08)';
  const text = palette.text || '#1a1a1a';
  const muted = palette.muted || '#7a7670';
  // Percentile bands (faked).
  const p5 = 0.12, p25 = 0.32, p75 = 0.66, p95 = 0.86;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block'}}>
      {/* y-grid */}
      {[0,0.25,0.5,0.75,1].map((g,i)=>(
        <g key={i}>
          <line x1={padL} x2={w-padR} y1={padT+innerH*(1-g)} y2={padT+innerH*(1-g)} stroke={grid} />
          <text x={padL-8} y={padT+innerH*(1-g)+4} textAnchor="end" fontSize="10" fill={muted} fontFamily="IBM Plex Mono, monospace">{Math.round(g*100)/100}</text>
        </g>
      ))}
      {/* percentile bands */}
      <rect x={padL+innerW*p5} y={padT} width={innerW*(p95-p5)} height={innerH} fill="rgba(0,0,0,0.025)" />
      <rect x={padL+innerW*p25} y={padT} width={innerW*(p75-p25)} height={innerH} fill="rgba(0,0,0,0.05)" />
      {/* bars */}
      {bars.map((v,i)=>(
        <rect key={i} x={padL+i*bw+0.5} y={padT+innerH*(1-v)} width={bw-1} height={innerH*v} fill={bar} opacity="0.85" />
      ))}
      {/* reference line */}
      <line x1={padL+innerW*refLine} x2={padL+innerW*refLine} y1={padT-4} y2={padT+innerH+4} stroke={accent} strokeWidth="1.5" strokeDasharray="3 3" />
      <text x={padL+innerW*refLine+6} y={padT+10} fontSize="11" fill={accent} fontFamily="IBM Plex Mono, monospace">{refLabel}</text>
      {/* x labels (log scale) */}
      {['10⁻⁶','10⁻³','1','10³','10⁶'].map((t,i)=>(
        <text key={i} x={padL+(i/4)*innerW} y={h-padB+18} textAnchor="middle" fontSize="10" fill={muted} fontFamily="IBM Plex Mono, monospace">{t}</text>
      ))}
      <text x={padL+innerW/2} y={h-6} textAnchor="middle" fontSize="10" fill={muted} fontFamily="IBM Plex Mono, monospace">cost-effectiveness, × GiveWell bar (log)</text>
      <text x={12} y={padT+innerH/2} textAnchor="middle" fontSize="10" fill={muted} fontFamily="IBM Plex Mono, monospace" transform={`rotate(-90 12 ${padT+innerH/2})`}>density</text>
    </svg>
  );
};

// --- Comparator bars with whisker ranges. ---
const ComparatorBars = ({palette={}, items}) => {
  const accent = palette.accent || '#c2410c';
  const text = palette.text || '#1a1a1a';
  const muted = palette.muted || '#7a7670';
  const bar = palette.bar || '#3b3a36';
  const w = 720, rowH = 36;
  const padL = 200, padR = 24;
  const h = items.length*rowH + 36;
  const innerW = w-padL-padR;
  // Map log10(x) ∈ [-3, 5] → [0, innerW]
  const mapX = (v)=> ((Math.log10(v)+3)/8)*innerW;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block'}}>
      {/* axis */}
      {[-3,-1,0,1,3,5].map((l,i)=>(
        <g key={i}>
          <line x1={padL+mapX(Math.pow(10,l))} x2={padL+mapX(Math.pow(10,l))} y1={20} y2={h-12} stroke="rgba(0,0,0,0.06)" />
          <text x={padL+mapX(Math.pow(10,l))} y={h-2} textAnchor="middle" fontSize="10" fill={muted} fontFamily="IBM Plex Mono, monospace">{l===0?'1×':`10${supScript(l)}×`}</text>
        </g>
      ))}
      {/* GiveWell line at 1× */}
      <line x1={padL+mapX(1)} x2={padL+mapX(1)} y1={16} y2={h-14} stroke={accent} strokeWidth="1.25" strokeDasharray="3 3" />
      {items.map((it, i)=>{
        const y = 28 + i*rowH;
        const x0 = padL + mapX(it.lo);
        const x1 = padL + mapX(it.hi);
        const xm = padL + mapX(it.mid);
        const isMain = it.main;
        return (
          <g key={i}>
            <text x={padL-12} y={y+4} textAnchor="end" fontSize="12" fill={text} fontFamily="IBM Plex Sans, sans-serif" fontWeight={isMain?600:500}>{it.label}</text>
            {/* whisker */}
            <line x1={x0} x2={x1} y1={y} y2={y} stroke={isMain?accent:bar} strokeWidth={isMain?2:1.5} />
            <line x1={x0} x2={x0} y1={y-5} y2={y+5} stroke={isMain?accent:bar} strokeWidth={isMain?2:1.5} />
            <line x1={x1} x2={x1} y1={y-5} y2={y+5} stroke={isMain?accent:bar} strokeWidth={isMain?2:1.5} />
            <circle cx={xm} cy={y} r={isMain?5:4} fill={isMain?accent:bar} />
          </g>
        );
      })}
    </svg>
  );
};
function supScript(n){const m={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};return String(n).split('').map(c=>m[c]||c).join('');}

// --- Range slider (visual only, but state-bound). ---
const RangeSlider = ({label, sym, min=0, max=1, step=0.01, value, onChange, unit='', warn=false, palette={}, hint}) => {
  const muted = palette.muted || '#7a7670';
  const text = palette.text || '#1a1a1a';
  const accent = palette.accent || '#c2410c';
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6}}>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12}}>
        <div style={{display:'flex', alignItems:'baseline', gap:8}}>
          {sym && <span style={{fontFamily:'Source Serif 4, serif', fontStyle:'italic', fontSize:15, color:text}}>{sym}</span>}
          <span style={{fontFamily:'IBM Plex Sans, sans-serif', fontSize:13, color:text}}>{label}</span>
        </div>
        <span style={{fontFamily:'IBM Plex Mono, monospace', fontSize:12, color:warn?accent:text}}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}
        style={{width:'100%', accentColor: warn?accent:'#1a1a1a'}} />
      {hint && <div style={{fontFamily:'IBM Plex Mono, monospace', fontSize:10.5, color:muted}}>{hint}</div>}
    </div>
  );
};

// --- Toggle pill. ---
const Toggle = ({on, onClick, palette={}}) => {
  const accent = palette.accent || '#c2410c';
  return (
    <button onClick={onClick} style={{
      width:34, height:20, borderRadius:999, border:'1px solid '+(on?accent:'#c8c4bc'),
      background:on?accent:'#fff', position:'relative', cursor:'pointer', padding:0, transition:'all 120ms'
    }}>
      <span style={{
        position:'absolute', top:1, left: on?15:1, width:16, height:16, borderRadius:'50%',
        background:on?'#fff':'#c8c4bc', transition:'left 120ms'
      }} />
    </button>
  );
};

// --- Drake parameters (with sparkline previews). ---
const DRAKE_PARAMS = [
  { id:'R',   sym:'R*',  label:'Star formation rate',         unit:' /yr',     defLo:1.5, defHi:10,   peak:0.55, spread:0.6 },
  { id:'fp',  sym:'fₚ',  label:'Stars with planets',          unit:'',         defLo:0.4, defHi:1.0,  peak:0.7,  spread:0.5 },
  { id:'ne',  sym:'nₑ',  label:'Habitable planets / system',  unit:'',         defLo:0.1, defHi:1.0,  peak:0.5,  spread:0.7 },
  { id:'fl',  sym:'fₗ',  label:'Fraction developing life',    unit:'',         defLo:1e-30, defHi:1.0, peak:0.35, spread:1.6 },
  { id:'fi',  sym:'fᵢ',  label:'Fraction with intelligence',  unit:'',         defLo:1e-3, defHi:1.0,  peak:0.4,  spread:1.4 },
  { id:'fc',  sym:'f_c', label:'Fraction communicating',      unit:'',         defLo:1e-2, defHi:1.0,  peak:0.5,  spread:1.2 },
  { id:'L',   sym:'L',   label:'Civilisation lifetime',       unit:' yr',      defLo:100, defHi:1e10, peak:0.45, spread:1.5 },
  { id:'fd',  sym:'f_d', label:'Detection-readiness multiplier', unit:'',      defLo:1e-3, defHi:1.0,  peak:0.4,  spread:1.3 },
];

const DETECTION_METHODS = [
  { id:'seti',  name:'SETI radio (BL/ATA)',            type:'radio',         cost:50,   on:true,  sens:-2  },
  { id:'tech',  name:'Technosignature search',         type:'technosig',     cost:50,   on:false, sens:-3  },
  { id:'bio',   name:'Biosignature astrobiology',      type:'biosig',        cost:5000, on:false, sens:-3  },
  { id:'probe', name:'Interstellar probe R&D',         type:'probe',         cost:500,  on:false, sens:-5  },
  { id:'retina',name:'RETINA (passive radar)',         type:'passive_radar', cost:5,    on:true,  sens:-4  },
];

const VALUE_CHANNELS = [
  { id:'A', title:'Great Filter information', tag:'Hanson 2008',     desc:'Detection updates our credence about whether the Great Filter is behind or ahead of us. Generically: finding life is bad news.', sign:'−', defaultV:'1×10¹⁰ DALY' },
  { id:'B', title:'Astronomical-waste update',tag:'Bostrom 2003',    desc:'Two-sided. Tech-viability evidence (good for "we could too") vs lightcone-claim evidence (bad for our cosmic endowment).',     sign:'±', defaultV:'1×10¹⁶ DALY' },
  { id:'C', title:'Direct-contact value',     tag:'Drake/Sagan',     desc:'Knowledge transfer; only fires for detection types that involve receiving information (radio, technosig, passive radar).',  sign:'+', defaultV:'1×10⁸ DALY'  },
  { id:'D', title:'Contact disvalue (Dark Forest)', tag:'Liu / METI debate', desc:'Detection alerts hostile aliens, or commits us to METI. Active for radio / technosig / probe.',                          sign:'−', defaultV:'−1×10¹² DALY' },
];

const PRESETS = [
  { id:'bostrom', name:'Bostrom Longtermist',     short:'long-term, total-view, no discount' },
  { id:'hanson',  name:'Hanson Filter Pessimist', short:'filter likely ahead; weight C low' },
  { id:'ord',     name:'Ord Moderate',            short:'log-utility risk; mild discount' },
  { id:'near',    name:'Neartermist',             short:'person-affecting, 3% discount' },
  { id:'dark',    name:'Dark Forest',             short:'difference-making; weight D high' },
  { id:'astro',   name:'Astronomical Waste max.', short:'channel B dominates everything' },
];

const COMPARATORS_DEFAULT = [
  { label:'GiveDirectly',                  lo:0.05,  mid:0.1,  hi:0.3 },
  { label:'GiveWell top charities',        lo:0.7,   mid:1.0,  hi:1.5 },
  { label:'Cage-free campaigns',           lo:5,     mid:80,   hi:1000 },
  { label:'AI safety (technical)',         lo:0.001, mid:1,    hi:10000 },
  { label:'Biosecurity / pandemic prep',   lo:0.1,   mid:10,   hi:1000 },
];

// Cosmology pill
const Segmented = ({options, value, onChange, palette={}}) => {
  const accent = palette.accent || '#c2410c';
  return (
    <div style={{display:'inline-flex', border:'1px solid #d8d3c8', borderRadius:6, overflow:'hidden', background:'#fff'}}>
      {options.map(o=>(
        <button key={o.value} onClick={()=>onChange(o.value)} style={{
          padding:'6px 12px', border:'none', background: value===o.value? '#1a1a1a':'transparent',
          color: value===o.value?'#fff':'#1a1a1a', fontFamily:'IBM Plex Sans, sans-serif', fontSize:12.5, cursor:'pointer',
          borderRight: '1px solid #ece7da'
        }}>{o.label}</button>
      ))}
    </div>
  );
};

Object.assign(window, {
  Sparkline, Histogram, ComparatorBars, RangeSlider, Toggle, Segmented,
  DRAKE_PARAMS, DETECTION_METHODS, VALUE_CHANNELS, PRESETS, COMPARATORS_DEFAULT,
  fakeHistogram, makeRng, supScript,
});
