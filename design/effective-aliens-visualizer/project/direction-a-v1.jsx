// Direction A — Editorial narrative (Information is Beautiful lineage).
// Warm cream paper, serif display + sans body, single warm-orange accent,
// the tool reads like a long-form data essay split into chapters.

const { useState } = React;

const palette = {
  bg: '#f4efe2',
  paper: '#faf6ec',
  ink: '#1f1d18',
  muted: '#7a7368',
  rule: '#1f1d18',
  accent: '#c2410c',
  bar: '#2a2823',
  grid: 'rgba(31,29,24,0.08)',
  text: '#1f1d18',
};

const A_Type = {
  display: { fontFamily: 'Fraunces, serif', fontWeight: 600, letterSpacing:'-0.01em' },
  serif:   { fontFamily: 'Source Serif 4, serif' },
  sans:    { fontFamily: 'IBM Plex Sans, sans-serif' },
  mono:    { fontFamily: 'IBM Plex Mono, monospace' },
};

const A_Chapter = ({num, eyebrow, title, kicker, children}) => (
  <section style={{padding:'56px 80px 48px', borderTop:'1px solid #1f1d18'}}>
    <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:32, alignItems:'baseline'}}>
      <div>
        <div style={{...A_Type.mono, fontSize:11, letterSpacing:'0.18em', color:palette.muted, textTransform:'uppercase'}}>Ch. {num}</div>
        <div style={{...A_Type.mono, fontSize:11, letterSpacing:'0.18em', color:palette.accent, textTransform:'uppercase', marginTop:6}}>{eyebrow}</div>
      </div>
      <div>
        <h2 style={{...A_Type.display, fontSize:44, lineHeight:1.05, margin:0, color:palette.ink}}>{title}</h2>
        {kicker && <p style={{...A_Type.serif, fontSize:18, lineHeight:1.45, color:palette.muted, marginTop:14, maxWidth:780}}>{kicker}</p>}
      </div>
    </div>
    <div style={{marginTop:36}}>{children}</div>
  </section>
);

const A_StatPair = () => (
  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, border:'1px solid '+palette.ink, background:palette.paper}}>
    {[
      {top:'P( no other civilisation in the Milky Way )', val:'37%', detail:'5th–95th: 18% – 62%'},
      {top:'P( at least one other civilisation in the Milky Way )', val:'63%', detail:'5th–95th: 38% – 82%'},
    ].map((s,i)=>(
      <div key={i} style={{padding:'28px 32px', borderRight: i===0?'1px solid '+palette.ink:'none'}}>
        <div style={{...A_Type.mono, fontSize:11, letterSpacing:'0.14em', color:palette.muted, textTransform:'uppercase'}}>{s.top}</div>
        <div style={{...A_Type.display, fontSize:88, lineHeight:0.95, marginTop:14, color:palette.ink}}>{s.val}</div>
        <div style={{...A_Type.mono, fontSize:11.5, color:palette.muted, marginTop:10}}>{s.detail}</div>
      </div>
    ))}
    <div style={{gridColumn:'1 / -1', borderTop:'1px solid '+palette.ink, padding:'14px 32px', display:'flex', justifyContent:'space-between', ...A_Type.mono, fontSize:11.5, color:palette.muted}}>
      <span>P( more than one ) — surfacing the Poisson tail — <span style={{color:palette.ink}}>52%</span></span>
      <span>n = 100,000 Monte Carlo samples · debounced 150 ms</span>
    </div>
  </div>
);

const A_DrakeRow = ({p, lo, hi, onLo, onHi}) => (
  <div style={{display:'grid', gridTemplateColumns:'180px 1fr 220px', gap:24, alignItems:'center', padding:'14px 0', borderBottom:'1px solid #e5dfcd'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:10}}>
      <span style={{...A_Type.serif, fontStyle:'italic', fontSize:22, color:palette.ink}}>{p.sym}</span>
      <span style={{...A_Type.sans, fontSize:13, color:palette.muted}}>{p.label}</span>
    </div>
    <div style={{display:'flex', alignItems:'center', gap:12}}>
      <span style={{...A_Type.mono, fontSize:11, color:palette.muted, width:60, textAlign:'right'}}>{formatBound(p.defLo)}</span>
      <div style={{flex:1, height:10, background:'#ece6d3', position:'relative', borderRadius:0}}>
        <div style={{position:'absolute', top:0, left:`${lo*100}%`, width:`${(hi-lo)*100}%`, height:'100%', background:palette.ink}} />
        <div style={{position:'absolute', top:-4, left:`${lo*100}%`, width:2, height:18, background:palette.accent}} />
        <div style={{position:'absolute', top:-4, left:`${hi*100}%`, width:2, height:18, background:palette.accent}} />
      </div>
      <span style={{...A_Type.mono, fontSize:11, color:palette.muted, width:60}}>{formatBound(p.defHi)}</span>
    </div>
    <div style={{display:'flex', justifyContent:'flex-end'}}>
      <window.Sparkline values={window.fakeHistogram('A-'+p.id, 32, 0, p.spread, p.peak)} w={200} h={32} stroke={palette.ink} fill="rgba(31,29,24,0.10)" />
    </div>
  </div>
);
function formatBound(v){
  if (v >= 1e6) return v.toExponential(0).replace('+','');
  if (v >= 1) return String(v);
  if (v >= 0.001) return String(v);
  return v.toExponential(0).replace('+','');
}

const A_MethodRow = ({m}) => {
  const [on, setOn] = useState(m.on);
  return (
    <div style={{display:'grid', gridTemplateColumns:'40px 1fr 140px 200px 120px', gap:20, alignItems:'center', padding:'18px 0', borderBottom:'1px solid #e5dfcd'}}>
      <window.Toggle on={on} onClick={()=>setOn(!on)} palette={palette} />
      <div>
        <div style={{...A_Type.sans, fontSize:14, fontWeight:600, color: on?palette.ink:palette.muted}}>{m.name}</div>
        <div style={{...A_Type.mono, fontSize:10.5, color:palette.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginTop:3}}>type · {m.type}</div>
      </div>
      <div>
        <div style={{...A_Type.mono, fontSize:10.5, color:palette.muted, textTransform:'uppercase', letterSpacing:'0.1em'}}>cost / decade</div>
        <div style={{...A_Type.serif, fontSize:18, color:palette.ink, marginTop:2}}>${m.cost < 1000 ? m.cost+'M' : (m.cost/1000)+'B'}</div>
      </div>
      <div>
        <div style={{...A_Type.mono, fontSize:10.5, color:palette.muted, textTransform:'uppercase', letterSpacing:'0.1em'}}>log sensitivity</div>
        <div style={{height:6, background:'#ece6d3', marginTop:8, position:'relative'}}>
          <div style={{position:'absolute', height:'100%', width:`${((m.sens+6)/6)*100}%`, background: on?palette.accent:'#c8c4bc'}} />
        </div>
        <div style={{...A_Type.mono, fontSize:11, color:palette.muted, marginTop:3}}>10{window.supScript(m.sens)} per civ · per $1B-decade</div>
      </div>
      <window.Sparkline values={window.fakeHistogram('A-m-'+m.id, 24, on?0.05:-0.3, 1, 0.5)} w={120} h={28} stroke={on?palette.ink:'#bdb6a4'} fill={on?'rgba(31,29,24,0.08)':'rgba(31,29,24,0.03)'} />
    </div>
  );
};

const A_ChannelCard = ({c}) => {
  const [on, setOn] = useState(true);
  return (
    <div style={{padding:'24px 26px', background:palette.paper, border:'1px solid '+palette.ink}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16}}>
        <div>
          <div style={{...A_Type.mono, fontSize:11, letterSpacing:'0.18em', color:palette.muted, textTransform:'uppercase'}}>Channel {c.id} · sign {c.sign}</div>
          <h3 style={{...A_Type.display, fontSize:24, margin:'8px 0 0', color:palette.ink}}>{c.title}</h3>
          <div style={{...A_Type.mono, fontSize:11, color:palette.accent, marginTop:4}}>{c.tag}</div>
        </div>
        <window.Toggle on={on} onClick={()=>setOn(!on)} palette={palette} />
      </div>
      <p style={{...A_Type.serif, fontSize:14.5, lineHeight:1.55, color:palette.ink, marginTop:14}}>{c.desc}</p>
      <div style={{...A_Type.mono, fontSize:11, color:palette.muted, marginTop:12, paddingTop:12, borderTop:'1px dashed #d8d3c8', display:'flex', justifyContent:'space-between'}}>
        <span>default value</span><span style={{color:palette.ink}}>{c.defaultV}</span>
      </div>
    </div>
  );
};

const A_PresetTile = ({p, active}) => (
  <button style={{
    textAlign:'left', padding:'14px 16px', background: active?palette.ink:palette.paper,
    color: active?palette.paper:palette.ink, border:'1px solid '+palette.ink, cursor:'pointer'
  }}>
    <div style={{...A_Type.mono, fontSize:10.5, letterSpacing:'0.14em', textTransform:'uppercase', opacity:0.7}}>preset</div>
    <div style={{...A_Type.display, fontSize:18, marginTop:4}}>{p.name}</div>
    <div style={{...A_Type.serif, fontSize:13, opacity:0.8, marginTop:6, fontStyle:'italic'}}>{p.short}</div>
  </button>
);

const DirectionA = () => {
  const [drakeRanges] = useState(()=>Object.fromEntries(window.DRAKE_PARAMS.map(p=>[p.id, [0.2, 0.75]])));
  const [cosmology, setCosmology] = useState('sdo');
  const [activePreset, setActivePreset] = useState('ord');

  return (
    <div style={{width:1280, minHeight:3600, background:palette.bg, color:palette.ink, ...A_Type.serif}}>

      {/* MASTHEAD */}
      <header style={{padding:'56px 80px 36px', borderBottom:'1px solid '+palette.ink, position:'relative'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', ...A_Type.mono, fontSize:11, color:palette.muted, letterSpacing:'0.18em', textTransform:'uppercase'}}>
          <span>aliens.allinlabs.io · v0.1 draft</span>
          <span>a worldview-sensitive analysis</span>
        </div>
        <div style={{...A_Type.mono, fontSize:11, color:palette.accent, marginTop:18, letterSpacing:'0.18em', textTransform:'uppercase'}}>An interactive essay in seven parts</div>
        <h1 style={{...A_Type.display, fontSize:96, lineHeight:0.94, margin:'14px 0 0', maxWidth:1100, letterSpacing:'-0.02em'}}>
          Should we fund <em style={{fontFamily:'Fraunces, serif', fontStyle:'italic', color:palette.accent}}>alien-finding?</em>
        </h1>
        <p style={{...A_Type.serif, fontSize:21, lineHeight:1.45, marginTop:24, maxWidth:840, color:palette.ink}}>
          Frank Drake’s 1961 equation gives a number; Sandberg, Drexler &amp; Ord’s 2018 reformulation gives a <em>distribution</em>. This tool lets you set its bounds, choose detection programmes, weight four value channels and your own worldview &mdash; then asks what cost-effectiveness, in GiveWell-bar units, the search comes out at.
        </p>
        <div style={{display:'flex', gap:24, marginTop:32, alignItems:'center'}}>
          <window.Segmented
            value={cosmology} onChange={setCosmology} palette={palette}
            options={[{value:'sdo',label:'SDO Drake'},{value:'grabby',label:'Grabby Aliens'},{value:'hybrid',label:'Hybrid'}]} />
          <span style={{...A_Type.mono, fontSize:11, color:palette.muted, letterSpacing:'0.14em', textTransform:'uppercase'}}>Cosmological model</span>
          <div style={{flex:1}} />
          <button style={{...A_Type.mono, fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', padding:'10px 16px', background:palette.ink, color:palette.paper, border:'none', cursor:'pointer'}}>Copy permalink ↗</button>
        </div>
      </header>

      {/* HEADLINE STATS */}
      <section style={{padding:'48px 80px 12px'}}>
        <A_StatPair />
        <p style={{...A_Type.serif, fontStyle:'italic', fontSize:14, color:palette.muted, marginTop:14, maxWidth:840}}>
          The pairing matters more than either individual stat. <span style={{color:palette.ink, fontStyle:'normal'}}>“We are probably alone”</span> and <span style={{color:palette.ink, fontStyle:'normal'}}>“we probably are not”</span> are equally valid framings of the same Monte Carlo result. <a href="#" style={{color:palette.accent}}>Why →</a>
        </p>
      </section>

      {/* CHAPTER 1 — DRAKE */}
      <A_Chapter num="01" eyebrow="The equation" title="Seven uncertain factors, one log-uniform multiplication."
        kicker="Each parameter is sampled from a log-uniform distribution between bounds you set. Astrophysical parameters have established lower bounds; the tool nudges you to respect them. The speculative parameters fₗ, fᵢ, f_c, L are wide on purpose — that is the SDO finding.">
        <div style={{background:palette.paper, border:'1px solid '+palette.ink, padding:'8px 28px'}}>
          {window.DRAKE_PARAMS.map(p => (
            <A_DrakeRow key={p.id} p={p} lo={drakeRanges[p.id][0]} hi={drakeRanges[p.id][1]} onLo={()=>{}} onHi={()=>{}} />
          ))}
        </div>
        <div style={{display:'flex', gap:12, marginTop:18, ...A_Type.mono, fontSize:11, color:palette.muted, letterSpacing:'0.1em', textTransform:'uppercase'}}>
          <button style={{padding:'8px 14px', background:'transparent', border:'1px solid '+palette.ink, color:palette.ink, cursor:'pointer'}}>Lock astrophysical params</button>
          <button style={{padding:'8px 14px', background:'transparent', border:'1px solid '+palette.ink, color:palette.ink, cursor:'pointer'}}>Reset to SDO defaults</button>
          <div style={{flex:1}} />
          <span>Distribution previews update on slider release</span>
        </div>
      </A_Chapter>

      {/* CHAPTER 2 — DETECTION */}
      <A_Chapter num="02" eyebrow="The instruments" title="Five programmes you can fund, in any combination."
        kicker="Each method has a cost (decadal marginal spend) and a sensitivity coefficient — probability of finding a single detectable civilisation per $1B-decade of marginal spend. These sensitivities are the most uncertain numbers in the model.">
        <div style={{background:palette.paper, border:'1px solid '+palette.ink, padding:'4px 28px'}}>
          {window.DETECTION_METHODS.map(m => <A_MethodRow key={m.id} m={m} />)}
        </div>
        <div style={{...A_Type.serif, fontSize:14, color:palette.muted, marginTop:16, paddingLeft:14, borderLeft:'2px solid '+palette.accent, fontStyle:'italic', maxWidth:780}}>
          Per-method sensitivities dominate the result. Adjust them critically. Tooltips link to the primary literature; defaults are placeholders awaiting domain-expert refinement.
        </div>
      </A_Chapter>

      {/* CHAPTER 3 — VALUE CHANNELS */}
      <A_Chapter num="03" eyebrow="What detection is worth" title="Four channels — two positive, two negative, all defensible."
        kicker="Detection is not unambiguously good. Channel A (Hanson’s Filter) and Channel D (Dark Forest) can drive expected value negative. The tool refuses to hide that.">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
          {window.VALUE_CHANNELS.map(c => <A_ChannelCard key={c.id} c={c} />)}
        </div>
      </A_Chapter>

      {/* CHAPTER 4 — WORLDVIEW */}
      <A_Chapter num="04" eyebrow="Your axioms" title="Six dials and one of six presets."
        kicker="Worldview dials act as transforms on the value channels before EV is computed. No preset is privileged — Bostrom and Neartermist sit in the same dropdown.">
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
          {window.PRESETS.map(p => <A_PresetTile key={p.id} p={p} active={activePreset===p.id} />)}
        </div>
        <div style={{marginTop:28, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px 60px', background:palette.paper, padding:'24px 28px', border:'1px solid '+palette.ink}}>
          <window.RangeSlider label="Longtermism strength" sym="α_L" value={0.5} onChange={()=>{}} palette={palette} hint="0 = neartermist · 1 = pure total-view" />
          <window.RangeSlider label="Pure time discount" sym="r" value={0.1} min={0} max={10} step={0.1} unit="%/yr" onChange={()=>{}} palette={palette} hint="discounts channels A & B over horizon T" />
          <window.RangeSlider label="Alien moral weight" sym="w_α" value={0.3} onChange={()=>{}} palette={palette} hint="multiplies channel C only" />
          <window.RangeSlider label="Hingeyness" sym="h" value={0.2} onChange={()=>{}} palette={palette} hint="P( our actions matter for cosmic endowment )" />
          <window.RangeSlider label="Filter prior P( behind us )" sym="ϕ" value={0.5} onChange={()=>{}} palette={palette} hint="used in channel A only" />
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            <div style={{...A_Type.sans, fontSize:13}}>Risk aversion</div>
            <window.Segmented value="ev" onChange={()=>{}} palette={palette}
              options={[{value:'ev',label:'EV-max'},{value:'log',label:'log-utility'},{value:'diff',label:'difference'}]} />
            <div style={{...A_Type.mono, fontSize:10.5, color:palette.muted}}>summary stat used: mean / geom-mean / 25th-percentile</div>
          </div>
        </div>
      </A_Chapter>

      {/* CHAPTER 5 — OUTPUT */}
      <A_Chapter num="05" eyebrow="The verdict" title="A distribution, not a number."
        kicker="Cost-effectiveness expressed as a multiplier of the GiveWell top-charity bar (~$100 per DALY averted). Log x-axis. Vertical line marks the bar.">
        <div style={{background:palette.paper, border:'1px solid '+palette.ink, padding:'24px 28px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:14}}>
            <div>
              <div style={{...A_Type.mono, fontSize:11, color:palette.muted, letterSpacing:'0.14em', textTransform:'uppercase'}}>Cost-effectiveness · Ord Moderate preset</div>
              <div style={{...A_Type.display, fontSize:48, lineHeight:1, marginTop:6}}>0.42<span style={{...A_Type.mono, fontSize:18, color:palette.muted, marginLeft:6}}>× GiveWell · median</span></div>
            </div>
            <div style={{display:'flex', gap:24, ...A_Type.mono, fontSize:11.5, color:palette.muted}}>
              <div><div style={{textTransform:'uppercase', letterSpacing:'0.12em'}}>5th</div><div style={{...A_Type.serif, fontSize:18, color:palette.ink}}>0.003×</div></div>
              <div><div style={{textTransform:'uppercase', letterSpacing:'0.12em'}}>95th</div><div style={{...A_Type.serif, fontSize:18, color:palette.ink}}>57×</div></div>
              <div><div style={{textTransform:'uppercase', letterSpacing:'0.12em'}}>P( &gt; GW )</div><div style={{...A_Type.serif, fontSize:18, color:palette.ink}}>22%</div></div>
              <div><div style={{textTransform:'uppercase', letterSpacing:'0.12em'}}>P( EV &lt; 0 )</div><div style={{...A_Type.serif, fontSize:18, color:palette.accent}}>14%</div></div>
            </div>
          </div>
          <window.Histogram seed="A-out" w={1120} h={300} refLine={0.5} palette={palette} />
        </div>

        <div style={{marginTop:28, background:palette.paper, border:'1px solid '+palette.ink, padding:'24px 28px'}}>
          <div style={{...A_Type.mono, fontSize:11, color:palette.muted, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:12}}>vs reference cause areas — ranges, not points</div>
          <window.ComparatorBars palette={palette}
            items={[
              { label:'This tool — Ord Moderate', lo:0.003, mid:0.42, hi:57, main:true },
              ...window.COMPARATORS_DEFAULT,
            ]} />
        </div>
      </A_Chapter>

      {/* COLOPHON */}
      <footer style={{padding:'48px 80px 64px', borderTop:'1px solid '+palette.ink, ...A_Type.mono, fontSize:11, color:palette.muted, letterSpacing:'0.12em', textTransform:'uppercase', display:'flex', justifyContent:'space-between'}}>
        <span>Sources · SDO 2018 · Bostrom 2003 · Hanson 2021 · Ord 2020 · Azad 2026</span>
        <span>Worldview-diversified · no worldview privileged · no defaults flatter the conclusion</span>
      </footer>
    </div>
  );
};

window.DirectionA = DirectionA;
