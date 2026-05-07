// Direction C — Distribution-first dashboard.
// The output histogram is the largest object on the page; controls are condensed
// into a left rail you can tweak while watching the distribution morph.
// Single muted teal accent on a near-white canvas.

const { useState: useStateC } = React;

const palC = {
  bg: '#f6f5f1',
  paper: '#ffffff',
  ink: '#0f1411',
  muted: '#6e7570',
  rule: '#e6e3da',
  accent: '#2f5d52',
  bar: '#0f1411',
  grid: 'rgba(15,20,17,0.06)',
  text: '#0f1411',
};

const C_Type = {
  display: { fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing:'-0.012em' },
  serif:   { fontFamily: '"Source Serif 4", serif' },
  sans:    { fontFamily: 'Inter, sans-serif' },
  mono:    { fontFamily: 'JetBrains Mono, IBM Plex Mono, monospace' },
};

const C_Card = ({title, children, action}) => (
  <div style={{background:palC.paper, border:'1px solid '+palC.rule, padding:'16px 18px'}}>
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
      <div style={{...C_Type.mono, fontSize:10.5, color:palC.muted, letterSpacing:'0.08em', textTransform:'uppercase'}}>{title}</div>
      {action && <div style={{...C_Type.mono, fontSize:10.5, color:palC.accent, cursor:'pointer'}}>{action}</div>}
    </div>
    {children}
  </div>
);

const C_DrakeCompact = ({p}) => {
  const [lo, setLo] = useStateC(0.2);
  const [hi, setHi] = useStateC(0.75);
  return (
    <div style={{display:'grid', gridTemplateColumns:'46px 1fr 90px', gap:8, alignItems:'center', padding:'8px 0', borderBottom:'1px dashed '+palC.rule}}>
      <span style={{...C_Type.serif, fontStyle:'italic', fontSize:14, color:palC.ink}}>{p.sym}</span>
      <div>
        <div style={{...C_Type.sans, fontSize:11, color:palC.muted}}>{p.label}</div>
        <div style={{height:3, background:palC.rule, position:'relative', marginTop:5}}>
          <div style={{position:'absolute', top:0, left:`${lo*100}%`, width:`${(hi-lo)*100}%`, height:'100%', background:palC.ink}} />
          <div style={{position:'absolute', top:-2, left:`${lo*100}%`, width:1.5, height:7, background:palC.accent}} />
          <div style={{position:'absolute', top:-2, left:`${hi*100}%`, width:1.5, height:7, background:palC.accent}} />
        </div>
      </div>
      <window.Sparkline values={window.fakeHistogram('C-'+p.id, 22, 0, p.spread, p.peak)} w={84} h={20} stroke={palC.ink} fill="rgba(15,20,17,0.06)" />
    </div>
  );
};

const C_MethodCompact = ({m}) => {
  const [on, setOn] = useStateC(m.on);
  return (
    <div style={{display:'grid', gridTemplateColumns:'30px 1fr 60px', gap:8, alignItems:'center', padding:'8px 0', borderBottom:'1px dashed '+palC.rule, opacity: on?1:0.55}}>
      <window.Toggle on={on} onClick={()=>setOn(!on)} palette={palC} />
      <div>
        <div style={{...C_Type.sans, fontSize:12, color:palC.ink, fontWeight:500}}>{m.name}</div>
        <div style={{...C_Type.mono, fontSize:10, color:palC.muted}}>{m.type} · 10{window.supScript(m.sens)}</div>
      </div>
      <div style={{...C_Type.mono, fontSize:11, color:palC.ink, textAlign:'right'}}>${m.cost<1000?m.cost+'M':(m.cost/1000)+'B'}</div>
    </div>
  );
};

const C_ChannelChip = ({c}) => {
  const [on, setOn] = useStateC(true);
  return (
    <button onClick={()=>{}} style={{
      textAlign:'left', padding:'12px 14px', background:on?palC.paper:'#f0eee8', border:'1px solid '+(on?palC.ink:palC.rule),
      cursor:'pointer', display:'flex', flexDirection:'column', gap:4, opacity:on?1:0.6
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <span style={{...C_Type.serif, fontStyle:'italic', fontSize:13, color:palC.ink}}>V_{c.id}</span>
        <span style={{...C_Type.mono, fontSize:10, color:palC.muted}}>{c.sign}</span>
      </div>
      <div style={{...C_Type.sans, fontSize:12, fontWeight:600, color:palC.ink}}>{c.title}</div>
      <div style={{...C_Type.mono, fontSize:10.5, color:palC.muted}}>{c.defaultV}</div>
    </button>
  );
};

const C_PresetTab = ({p, active}) => (
  <button style={{
    padding:'10px 14px', background:active?palC.ink:'transparent', color:active?palC.paper:palC.ink,
    border:'1px solid '+(active?palC.ink:palC.rule), cursor:'pointer', whiteSpace:'nowrap',
    ...C_Type.sans, fontSize:12, fontWeight:500
  }}>{p.name}</button>
);

const C_HeadStat = ({label, value, sub, accent}) => (
  <div style={{padding:'14px 18px', background:palC.paper, border:'1px solid '+palC.rule}}>
    <div style={{...C_Type.mono, fontSize:10, color:palC.muted, letterSpacing:'0.08em', textTransform:'uppercase'}}>{label}</div>
    <div style={{...C_Type.display, fontSize:34, lineHeight:1, marginTop:8, color:accent?palC.accent:palC.ink}}>{value}</div>
    {sub && <div style={{...C_Type.mono, fontSize:10.5, color:palC.muted, marginTop:6}}>{sub}</div>}
  </div>
);

const DirectionC = () => {
  const [cosmology, setCosmology] = useStateC('sdo');
  const [activePreset] = useStateC('ord');

  return (
    <div style={{width:1280, minHeight:3600, background:palC.bg, color:palC.ink, ...C_Type.sans}}>

      {/* APP BAR — compact */}
      <header style={{padding:'18px 28px', borderBottom:'1px solid '+palC.rule, background:palC.paper, display:'flex', alignItems:'center', gap:18}}>
        <div style={{...C_Type.display, fontSize:18, color:palC.ink}}>Drake <span style={{color:palC.accent}}>·</span> cause-prio</div>
        <div style={{...C_Type.mono, fontSize:11, color:palC.muted}}>v0.1 · aliens.allinlabs.io</div>
        <div style={{flex:1}} />
        <window.Segmented value={cosmology} onChange={setCosmology} palette={palC}
          options={[{value:'sdo',label:'SDO'},{value:'grabby',label:'Grabby'},{value:'hybrid',label:'Hybrid'}]} />
        <select style={{padding:'7px 10px', border:'1px solid '+palC.rule, background:palC.paper, ...C_Type.sans, fontSize:12, color:palC.ink}}>
          {window.PRESETS.map(p=><option key={p.id}>{p.name}</option>)}
        </select>
        <button style={{padding:'7px 12px', background:palC.ink, color:palC.paper, border:'none', cursor:'pointer', ...C_Type.mono, fontSize:11}}>🔗 share</button>
      </header>

      {/* HEADLINE STATS */}
      <section style={{padding:'24px 28px 0'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10}}>
          <C_HeadStat label="P( N = 0 in MW )" value="37%" sub="5–95%: 18% – 62%" />
          <C_HeadStat label="P( N ≥ 1 in MW )" value="63%" sub="5–95%: 38% – 82%" />
          <C_HeadStat label="P( N > 1 )" value="52%" sub="Poisson tail" />
          <C_HeadStat label="P( detect / decade )" value="2.1%" sub="combined methods" />
          <C_HeadStat label="median × GW" value="0.42×" sub="under Ord Moderate" accent />
        </div>
        <div style={{...C_Type.serif, fontStyle:'italic', fontSize:13, color:palC.muted, marginTop:10}}>
          P(N=0) and P(N≥1) carry equal billing per the SDO finding — neither is the headline.
        </div>
      </section>

      {/* MAIN — left rail of controls + main canvas */}
      <div style={{display:'grid', gridTemplateColumns:'380px 1fr', gap:16, padding:'20px 28px 28px', alignItems:'flex-start'}}>

        {/* LEFT RAIL */}
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <C_Card title="① Drake parameters" action="reset">
            {window.DRAKE_PARAMS.map(p => <C_DrakeCompact key={p.id} p={p} />)}
          </C_Card>

          <C_Card title="② Detection programmes" action="all off">
            {window.DETECTION_METHODS.map(m => <C_MethodCompact key={m.id} m={m} />)}
            <div style={{...C_Type.mono, fontSize:10.5, color:palC.muted, marginTop:10, paddingTop:10, borderTop:'1px solid '+palC.rule}}>
              Total marginal spend / decade · <span style={{color:palC.ink}}>$55M</span>
            </div>
          </C_Card>

          <C_Card title="③ Value channels">
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              {window.VALUE_CHANNELS.map(c => <C_ChannelChip key={c.id} c={c} />)}
            </div>
          </C_Card>

          <C_Card title="④ Worldview dials">
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              <window.RangeSlider label="Longtermism" sym="α_L" value={0.5} onChange={()=>{}} palette={palC} />
              <window.RangeSlider label="Time discount" sym="r" value={0.1} min={0} max={10} step={0.1} unit="%/yr" onChange={()=>{}} palette={palC} />
              <window.RangeSlider label="Alien moral weight" sym="w_α" value={0.3} onChange={()=>{}} palette={palC} />
              <window.RangeSlider label="Hingeyness" sym="h" value={0.2} onChange={()=>{}} palette={palC} />
              <window.RangeSlider label="Filter prior P(behind)" sym="ϕ" value={0.5} onChange={()=>{}} palette={palC} />
              <div>
                <div style={{...C_Type.sans, fontSize:11.5, color:palC.ink, marginBottom:5}}>Risk aversion</div>
                <window.Segmented value="ev" onChange={()=>{}} palette={palC}
                  options={[{value:'ev',label:'EV-max'},{value:'log',label:'log-util'},{value:'diff',label:'diff'}]} />
              </div>
            </div>
          </C_Card>

          <C_Card title="⑤ Prior overrides (advanced)">
            <div style={{...C_Type.serif, fontSize:12.5, color:palC.muted, fontStyle:'italic'}}>
              Bypass the cosmology model with a direct credence. The tool takes no position on whether you should.
            </div>
            <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:8}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{...C_Type.sans, fontSize:12, color:palC.ink}}>Override P(N≥1)</span>
                <window.Toggle on={false} onClick={()=>{}} palette={palC} />
              </div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{...C_Type.sans, fontSize:12, color:palC.ink}}>Override detection floor</span>
                <window.Toggle on={false} onClick={()=>{}} palette={palC} />
              </div>
            </div>
          </C_Card>
        </div>

        {/* MAIN CANVAS */}
        <div style={{display:'flex', flexDirection:'column', gap:16}}>

          {/* PRIMARY HISTOGRAM */}
          <div style={{background:palC.paper, border:'1px solid '+palC.rule, padding:'24px 28px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18}}>
              <div>
                <div style={{...C_Type.mono, fontSize:10.5, color:palC.muted, letterSpacing:'0.08em', textTransform:'uppercase'}}>Cost-effectiveness · cost / DALY-equivalent</div>
                <div style={{display:'flex', alignItems:'baseline', gap:14, marginTop:6}}>
                  <div style={{...C_Type.display, fontSize:64, lineHeight:0.95, color:palC.ink}}>0.42×</div>
                  <div style={{...C_Type.serif, fontSize:16, color:palC.muted, fontStyle:'italic'}}>median, vs GiveWell top-charity bar</div>
                </div>
              </div>
              <div style={{display:'flex', gap:10}}>
                {window.PRESETS.slice(0,3).map(p=><C_PresetTab key={p.id} p={p} active={p.id==='ord'} />)}
                <button style={{padding:'10px 12px', background:'transparent', border:'1px dashed '+palC.rule, color:palC.muted, ...C_Type.mono, fontSize:11, cursor:'pointer'}}>+ compare preset</button>
              </div>
            </div>
            <window.Histogram seed="C-out" w={820} h={340} refLine={0.5} palette={palC} />
            <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:0, borderTop:'1px solid '+palC.rule, marginTop:18, paddingTop:14}}>
              {[
                {l:'5th', v:'0.003×'},
                {l:'median', v:'0.42×'},
                {l:'95th', v:'57×'},
                {l:'P(>GW)', v:'22%'},
                {l:'P(EV<0)', v:'14%', accent:true},
              ].map((s,i)=>(
                <div key={i} style={{borderRight: i<4?'1px solid '+palC.rule:'none', padding:'0 14px'}}>
                  <div style={{...C_Type.mono, fontSize:10.5, color:palC.muted, letterSpacing:'0.06em', textTransform:'uppercase'}}>{s.l}</div>
                  <div style={{...C_Type.display, fontSize:22, color: s.accent?palC.accent:palC.ink, marginTop:4}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SIDE-BY-SIDE COMPARISON */}
          <div style={{background:palC.paper, border:'1px solid '+palC.rule, padding:'18px 22px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
              <div style={{...C_Type.mono, fontSize:10.5, color:palC.muted, letterSpacing:'0.08em', textTransform:'uppercase'}}>Side-by-side · three worldviews</div>
              <div style={{...C_Type.mono, fontSize:10.5, color:palC.muted}}>same Drake, detection &amp; channel inputs</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14}}>
              {[
                {name:'Bostrom Longtermist', med:'12.4×', skew:0.4, peak:0.62},
                {name:'Ord Moderate',         med:'0.42×', skew:0,    peak:0.5 },
                {name:'Neartermist',          med:'0.001×',skew:-0.4, peak:0.32},
              ].map((d,i)=>(
                <div key={i} style={{padding:'12px 14px', border:'1px solid '+palC.rule}}>
                  <div style={{...C_Type.sans, fontSize:12.5, fontWeight:600, color:palC.ink}}>{d.name}</div>
                  <div style={{...C_Type.display, fontSize:24, color:palC.ink, marginTop:2}}>{d.med}<span style={{...C_Type.mono, fontSize:11, color:palC.muted, marginLeft:6}}>median</span></div>
                  <div style={{marginTop:8}}>
                    <window.Histogram seed={"C-cmp-"+i} w={252} h={130} refLine={0.5} skew={d.skew} peak={d.peak} palette={palC} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COMPARATOR BARS */}
          <div style={{background:palC.paper, border:'1px solid '+palC.rule, padding:'18px 22px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
              <div style={{...C_Type.mono, fontSize:10.5, color:palC.muted, letterSpacing:'0.08em', textTransform:'uppercase'}}>vs reference cause areas</div>
              <div style={{...C_Type.mono, fontSize:10.5, color:palC.muted}}>whiskers = community-disputed range</div>
            </div>
            <window.ComparatorBars palette={palC}
              items={[
                { label:'This tool · Ord Moderate', lo:0.003, mid:0.42, hi:57, main:true },
                ...window.COMPARATORS_DEFAULT,
              ]} />
          </div>

        </div>
      </div>

      {/* HONESTY STRIP */}
      <section style={{margin:'0 28px 28px', padding:'18px 22px', background:palC.paper, border:'1px solid '+palC.rule, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18}}>
        {[
          {h:'No worldview is privileged.', b:'All six presets sit equally in the dropdown. Defaults under Ord Moderate do not produce “obviously a top cause”.'},
          {h:'P(EV < 0) is always shown.', b:'Channel D (Dark Forest) can drive expected value negative under several configurations, including the spec defaults.'},
          {h:'Sensitivities dominate.',     b:'Per-method sₘ values are the most uncertain numbers in the model. Tooltips link to the literature; defaults are placeholders.'},
        ].map((x,i)=>(
          <div key={i}>
            <div style={{...C_Type.serif, fontSize:13, fontWeight:600, color:palC.ink}}>{x.h}</div>
            <div style={{...C_Type.serif, fontSize:12.5, color:palC.muted, marginTop:4, lineHeight:1.5}}>{x.b}</div>
          </div>
        ))}
      </section>

      <footer style={{padding:'18px 28px', borderTop:'1px solid '+palC.rule, ...C_Type.mono, fontSize:11, color:palC.muted, display:'flex', justifyContent:'space-between'}}>
        <span>Sources · SDO 2018 · Bostrom 2003 · Hanson 2021 · Ord 2020 · Azad 2026</span>
        <span>n = 100,000 · debounced 150 ms · pure-client SPA</span>
      </footer>

    </div>
  );
};

window.DirectionC = DirectionC;
