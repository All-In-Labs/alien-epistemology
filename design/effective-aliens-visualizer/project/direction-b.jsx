// Direction B — Restrained academic / working-paper voice.
// Neutral off-white, deep ink, single muted slate accent, math set in serif italics,
// dense tabular layouts, the tool reads like an SDO appendix you can interact with.

const { useState: useStateB } = React;

const palB = {
  bg: '#fbfaf7',
  paper: '#ffffff',
  ink: '#15171c',
  muted: '#646872',
  rule: '#dcdbd5',
  accent: '#3a4d6a',
  bar: '#15171c',
  grid: 'rgba(21,23,28,0.07)',
  text: '#15171c',
};

const B_Type = {
  display: { fontFamily: '"Source Serif 4", "Times New Roman", serif', fontWeight: 600, letterSpacing:'-0.005em' },
  serif:   { fontFamily: '"Source Serif 4", "Times New Roman", serif' },
  sans:    { fontFamily: 'IBM Plex Sans, sans-serif' },
  mono:    { fontFamily: 'IBM Plex Mono, monospace' },
};

const B_SectionLabel = ({n, title, sub}) => (
  <div style={{borderBottom:'1px solid '+palB.ink, paddingBottom:14, marginBottom:24, display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:18}}>
      <span style={{...B_Type.mono, fontSize:11, color:palB.muted, letterSpacing:'0.04em'}}>§{n}</span>
      <h2 style={{...B_Type.display, fontSize:24, lineHeight:1.1, margin:0, color:palB.ink}}>{title}</h2>
    </div>
    {sub && <span style={{...B_Type.mono, fontSize:11, color:palB.muted}}>{sub}</span>}
  </div>
);

const B_Stat = ({label, value, sub, accent}) => (
  <div style={{padding:'18px 22px', borderRight:'1px solid '+palB.rule}}>
    <div style={{...B_Type.mono, fontSize:10.5, color:palB.muted, letterSpacing:'0.06em'}}>{label}</div>
    <div style={{...B_Type.display, fontSize:46, lineHeight:1, marginTop:8, color:accent?palB.accent:palB.ink}}>{value}</div>
    {sub && <div style={{...B_Type.mono, fontSize:11, color:palB.muted, marginTop:6}}>{sub}</div>}
  </div>
);

const B_DrakeRow = ({p}) => {
  const [lo, setLo] = useStateB(0.18);
  const [hi, setHi] = useStateB(0.74);
  return (
    <tr style={{borderBottom:'1px solid '+palB.rule}}>
      <td style={{padding:'12px 14px 12px 0', ...B_Type.serif, fontStyle:'italic', fontSize:17, color:palB.ink, width:50}}>{p.sym}</td>
      <td style={{padding:'12px 14px', ...B_Type.serif, fontSize:14, color:palB.ink}}>{p.label}</td>
      <td style={{padding:'12px 14px', ...B_Type.mono, fontSize:11.5, color:palB.muted, textAlign:'right', width:90}}>{p.unit||'—'}</td>
      <td style={{padding:'12px 14px', ...B_Type.mono, fontSize:11.5, color:palB.muted, textAlign:'right', width:120}}>log-uniform</td>
      <td style={{padding:'12px 14px', width:280}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{...B_Type.mono, fontSize:11, color:palB.muted, width:54, textAlign:'right'}}>{formatBoundB(p.defLo)}</span>
          <div style={{flex:1, height:4, background:palB.rule, position:'relative'}}>
            <div style={{position:'absolute', top:0, left:`${lo*100}%`, width:`${(hi-lo)*100}%`, height:'100%', background:palB.ink}} />
            <div style={{position:'absolute', top:-3, left:`${lo*100}%`, width:2, height:10, background:palB.accent}} />
            <div style={{position:'absolute', top:-3, left:`${hi*100}%`, width:2, height:10, background:palB.accent}} />
          </div>
          <span style={{...B_Type.mono, fontSize:11, color:palB.muted, width:54}}>{formatBoundB(p.defHi)}</span>
        </div>
      </td>
      <td style={{padding:'10px 0 10px 14px', width:160}}>
        <window.Sparkline values={window.fakeHistogram('B-'+p.id, 28, 0, p.spread, p.peak)} w={150} h={26} stroke={palB.ink} fill="rgba(21,23,28,0.06)" />
      </td>
    </tr>
  );
};
function formatBoundB(v){
  if (v >= 1e6) return v.toExponential(0).replace('+','');
  if (v >= 1) return Number.isInteger(v)?String(v):v.toFixed(1);
  if (v >= 0.001) return String(v);
  return v.toExponential(0).replace('+','');
}

const B_MethodRow = ({m}) => {
  const [on, setOn] = useStateB(m.on);
  return (
    <tr style={{borderBottom:'1px solid '+palB.rule, opacity: on?1:0.55}}>
      <td style={{padding:'14px 16px 14px 0'}}><window.Toggle on={on} onClick={()=>setOn(!on)} palette={palB} /></td>
      <td style={{padding:'14px 14px', ...B_Type.serif, fontSize:14, color:palB.ink}}>{m.name}</td>
      <td style={{padding:'14px 14px', ...B_Type.mono, fontSize:11, color:palB.muted, letterSpacing:'0.04em'}}>{m.type}</td>
      <td style={{padding:'14px 14px', ...B_Type.mono, fontSize:12, color:palB.ink, textAlign:'right'}}>${m.cost < 1000 ? m.cost+'M' : (m.cost/1000)+'B'}</td>
      <td style={{padding:'14px 14px', ...B_Type.mono, fontSize:12, color:palB.ink, textAlign:'right'}}>10{window.supScript(m.sens)}</td>
      <td style={{padding:'10px 0 10px 14px'}}>
        <window.Sparkline values={window.fakeHistogram('B-m-'+m.id, 24, on?0:-0.2, 1, 0.5)} w={130} h={26} stroke={palB.ink} fill="rgba(21,23,28,0.06)" />
      </td>
    </tr>
  );
};

const B_ChannelRow = ({c}) => {
  const [on, setOn] = useStateB(true);
  return (
    <div style={{padding:'18px 22px', borderBottom:'1px solid '+palB.rule, display:'grid', gridTemplateColumns:'40px 60px 1fr 320px 200px', gap:18, alignItems:'flex-start'}}>
      <window.Toggle on={on} onClick={()=>setOn(!on)} palette={palB} />
      <div>
        <div style={{...B_Type.serif, fontStyle:'italic', fontSize:16, color:palB.ink}}>V_{c.id}</div>
        <div style={{...B_Type.mono, fontSize:11, color:palB.muted}}>sign {c.sign}</div>
      </div>
      <div>
        <div style={{...B_Type.serif, fontSize:15, fontWeight:600, color:palB.ink}}>{c.title}</div>
        <div style={{...B_Type.serif, fontSize:13, color:palB.muted, marginTop:6, lineHeight:1.5}}>{c.desc}</div>
      </div>
      <div style={{...B_Type.mono, fontSize:11, color:palB.muted}}>
        <div style={{textTransform:'uppercase', letterSpacing:'0.06em'}}>citation</div>
        <div style={{...B_Type.serif, fontSize:13, color:palB.ink, marginTop:4, fontStyle:'italic'}}>{c.tag}</div>
        <div style={{textTransform:'uppercase', letterSpacing:'0.06em', marginTop:10}}>default</div>
        <div style={{...B_Type.mono, fontSize:13, color:palB.ink, marginTop:4}}>{c.defaultV}</div>
      </div>
      <window.Sparkline values={window.fakeHistogram('B-c-'+c.id, 28, c.sign==='−'?-0.15:0.1, 1, 0.5)} w={180} h={36} stroke={palB.ink} fill="rgba(21,23,28,0.06)" />
    </div>
  );
};

const B_PresetRow = ({p, active}) => (
  <tr style={{borderBottom:'1px solid '+palB.rule, background: active?'#f1efe9':'transparent'}}>
    <td style={{padding:'12px 16px 12px 0', width:18}}>
      <span style={{display:'inline-block', width:10, height:10, borderRadius:'50%', border:'1.5px solid '+palB.ink, background: active?palB.ink:'transparent'}} />
    </td>
    <td style={{padding:'12px 14px', ...B_Type.serif, fontSize:14.5, color:palB.ink}}>{p.name}</td>
    <td style={{padding:'12px 14px', ...B_Type.serif, fontStyle:'italic', fontSize:13, color:palB.muted}}>{p.short}</td>
    {/* Mock dial readouts. */}
    {['α_L','r','PA','w_α','ϕ','h'].map((k,i)=>{
      const vals = {
        bostrom:['1.0','0%','off','0.5','0.5','0.5'],
        hanson: ['0.7','0%','off','0.1','0.2','0.3'],
        ord:    ['0.5','0.1%','off','0.3','0.5','0.2'],
        near:   ['0.0','3%','on','0.0','0.5','0.0'],
        dark:   ['0.5','0%','off','0.0','0.5','0.2'],
        astro:  ['1.0','0%','off','0.0','0.7','0.8'],
      }[p.id]||['—','—','—','—','—','—'];
      return <td key={i} style={{padding:'12px 8px', ...B_Type.mono, fontSize:11.5, color:palB.ink, textAlign:'center', width:60}}>{vals[i]}</td>;
    })}
  </tr>
);

const DirectionB = () => {
  const [activePreset] = useStateB('ord');
  const [cosmology, setCosmology] = useStateB('sdo');

  return (
    <div style={{width:1280, minHeight:3600, background:palB.bg, color:palB.ink, ...B_Type.serif}}>

      {/* MASTHEAD */}
      <header style={{padding:'48px 96px 36px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', ...B_Type.mono, fontSize:11, color:palB.muted, letterSpacing:'0.06em'}}>
          <span>aliens.allinlabs.io / Working tool, draft v0.1</span>
          <span>n = 100,000 Monte Carlo · debounced 150 ms</span>
        </div>
        <h1 style={{...B_Type.display, fontSize:54, lineHeight:1.05, margin:'24px 0 0', maxWidth:980, letterSpacing:'-0.015em'}}>
          A worldview-sensitive cost-effectiveness analysis of searching for extraterrestrial civilisations
        </h1>
        <p style={{...B_Type.serif, fontSize:17, lineHeight:1.55, marginTop:18, maxWidth:880, color:palB.muted}}>
          Combines the Sandberg–Drexler–Ord (2018) probabilistic Drake formulation with a five-method detection model, four DALY-equivalent value channels, and seven worldview transforms. Output is a Monte Carlo distribution of cost-effectiveness in GiveWell top-charity-bar units. The tool takes no position on any worldview, cosmological model, or prior; it only computes EV given the user’s choices.
        </p>
        <div style={{display:'flex', alignItems:'center', gap:18, marginTop:24}}>
          <span style={{...B_Type.mono, fontSize:11, color:palB.muted, letterSpacing:'0.06em'}}>Cosmological model</span>
          <window.Segmented value={cosmology} onChange={setCosmology} palette={palB}
            options={[{value:'sdo',label:'SDO Drake'},{value:'grabby',label:'Grabby Aliens (Hanson)'},{value:'hybrid',label:'Hybrid'}]} />
          <div style={{flex:1}} />
          <button style={{...B_Type.mono, fontSize:11, padding:'8px 14px', background:palB.paper, border:'1px solid '+palB.ink, color:palB.ink, cursor:'pointer'}}>permalink</button>
          <button style={{...B_Type.mono, fontSize:11, padding:'8px 14px', background:palB.paper, border:'1px solid '+palB.rule, color:palB.muted, cursor:'pointer'}}>export json</button>
        </div>
      </header>

      {/* HEADLINE STATS — minimal table */}
      <section style={{padding:'0 96px 32px'}}>
        <div style={{border:'1px solid '+palB.ink, background:palB.paper, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
          <B_Stat label="P( N = 0 in the Milky Way )" value="37%" sub="5–95%: 18% – 62%" />
          <B_Stat label="P( N ≥ 1 in the Milky Way )" value="63%" sub="5–95%: 38% – 82%" />
          <B_Stat label="P( any detection in decade )" value="2.1%" sub="combined across enabled methods" />
          <B_Stat label="median × GiveWell bar" value="0.42×" sub="under Ord Moderate · log x-axis" accent />
        </div>
        <div style={{...B_Type.serif, fontStyle:'italic', fontSize:13, color:palB.muted, marginTop:10, maxWidth:880}}>
          Stats 1–2 are deliberately paired and given equal typographic weight per the SDO finding; either alone would mis-frame the result. See Azad (2026) for the directional-reasoning critique.
        </div>
      </section>

      <div style={{padding:'24px 96px 96px'}}>

        {/* §1 — Drake parameters */}
        <B_SectionLabel n="1" title="Drake parameters · log-uniform sampling between user bounds" sub="N = R* × fₚ × nₑ × fₗ × fᵢ × f_c × L × f_d" />
        <table style={{width:'100%', borderCollapse:'collapse', background:palB.paper, border:'1px solid '+palB.rule}}>
          <thead>
            <tr style={{...B_Type.mono, fontSize:10.5, color:palB.muted, letterSpacing:'0.06em', textTransform:'uppercase'}}>
              <th style={{textAlign:'left', padding:'10px 14px 10px 0', borderBottom:'1px solid '+palB.ink}}>sym</th>
              <th style={{textAlign:'left', padding:'10px 14px', borderBottom:'1px solid '+palB.ink}}>parameter</th>
              <th style={{textAlign:'right', padding:'10px 14px', borderBottom:'1px solid '+palB.ink}}>units</th>
              <th style={{textAlign:'right', padding:'10px 14px', borderBottom:'1px solid '+palB.ink}}>distribution</th>
              <th style={{textAlign:'left',  padding:'10px 14px', borderBottom:'1px solid '+palB.ink}}>bounds</th>
              <th style={{textAlign:'left',  padding:'10px 0 10px 14px', borderBottom:'1px solid '+palB.ink}}>marginal sample density</th>
            </tr>
          </thead>
          <tbody>{window.DRAKE_PARAMS.map(p => <B_DrakeRow key={p.id} p={p} />)}</tbody>
        </table>

        <div style={{display:'flex', gap:14, marginTop:14, ...B_Type.mono, fontSize:11, color:palB.muted}}>
          <button style={{padding:'7px 12px', background:'transparent', border:'1px solid '+palB.ink, color:palB.ink, cursor:'pointer'}}>Lock astrophysical (R*, fₚ, nₑ)</button>
          <button style={{padding:'7px 12px', background:'transparent', border:'1px solid '+palB.rule, color:palB.muted, cursor:'pointer'}}>Reset to SDO defaults</button>
        </div>

        {/* §2 — Detection */}
        <div style={{marginTop:64}} />
        <B_SectionLabel n="2" title="Detection programmes" sub="P_detect = 1 − Π_m ( 1 − P_m )" />
        <table style={{width:'100%', borderCollapse:'collapse', background:palB.paper, border:'1px solid '+palB.rule}}>
          <thead>
            <tr style={{...B_Type.mono, fontSize:10.5, color:palB.muted, letterSpacing:'0.06em', textTransform:'uppercase'}}>
              <th style={{textAlign:'left',  padding:'10px 16px 10px 0', borderBottom:'1px solid '+palB.ink, width:60}}>on</th>
              <th style={{textAlign:'left',  padding:'10px 14px', borderBottom:'1px solid '+palB.ink}}>method</th>
              <th style={{textAlign:'left',  padding:'10px 14px', borderBottom:'1px solid '+palB.ink}}>type</th>
              <th style={{textAlign:'right', padding:'10px 14px', borderBottom:'1px solid '+palB.ink}}>cost / decade</th>
              <th style={{textAlign:'right', padding:'10px 14px', borderBottom:'1px solid '+palB.ink}}>sₘ (per civ · /$1B)</th>
              <th style={{textAlign:'left',  padding:'10px 0 10px 14px', borderBottom:'1px solid '+palB.ink}}>marginal P(detect)</th>
            </tr>
          </thead>
          <tbody>{window.DETECTION_METHODS.map(m => <B_MethodRow key={m.id} m={m} />)}</tbody>
        </table>
        <div style={{...B_Type.serif, fontStyle:'italic', fontSize:13, color:palB.muted, marginTop:14, paddingLeft:14, borderLeft:'2px solid '+palB.accent, maxWidth:880}}>
          Per-method sensitivities sₘ are the most uncertain numbers in the model and dominate the result. The defaults above are placeholders; users with domain expertise should override them.
        </div>

        {/* §3 — Value channels */}
        <div style={{marginTop:64}} />
        <B_SectionLabel n="3" title="Value channels" sub="V_detect = V_A + V_B + V_C + V_D, in DALY-equivalent" />
        <div style={{background:palB.paper, border:'1px solid '+palB.rule}}>
          {window.VALUE_CHANNELS.map(c => <B_ChannelRow key={c.id} c={c} />)}
        </div>

        {/* §4 — Worldview */}
        <div style={{marginTop:64}} />
        <B_SectionLabel n="4" title="Worldview transforms · presets" sub="V_user = T_worldview ( V_detect )" />
        <table style={{width:'100%', borderCollapse:'collapse', background:palB.paper, border:'1px solid '+palB.rule}}>
          <thead>
            <tr style={{...B_Type.mono, fontSize:10.5, color:palB.muted, letterSpacing:'0.06em', textTransform:'uppercase'}}>
              <th style={{padding:'10px 14px 10px 0', borderBottom:'1px solid '+palB.ink, width:18}}></th>
              <th style={{textAlign:'left', padding:'10px 14px', borderBottom:'1px solid '+palB.ink}}>preset</th>
              <th style={{textAlign:'left', padding:'10px 14px', borderBottom:'1px solid '+palB.ink}}>character</th>
              {['α_L','r','PA','w_α','ϕ','h'].map(k=>(
                <th key={k} style={{...B_Type.serif, fontStyle:'italic', textAlign:'center', padding:'10px 8px', borderBottom:'1px solid '+palB.ink, width:60}}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>{window.PRESETS.map(p => <B_PresetRow key={p.id} p={p} active={activePreset===p.id} />)}</tbody>
        </table>

        {/* §5 — Output */}
        <div style={{marginTop:64}} />
        <B_SectionLabel n="5" title="Cost-effectiveness distribution" sub="multiplier = ( EV / total_cost ) ÷ ( 1 / 100 DALY/$ )" />
        <div style={{background:palB.paper, border:'1px solid '+palB.rule, padding:'24px 28px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18}}>
            <div>
              <div style={{...B_Type.mono, fontSize:11, color:palB.muted, letterSpacing:'0.06em'}}>OUTPUT · Ord Moderate · n = 100,000</div>
              <div style={{...B_Type.display, fontSize:42, lineHeight:1, marginTop:8, color:palB.ink}}>
                0.42<span style={{...B_Type.serif, fontStyle:'italic', fontSize:18, color:palB.muted, marginLeft:8}}>× GiveWell, median</span>
              </div>
            </div>
            <table style={{...B_Type.mono, fontSize:11.5, color:palB.muted}}>
              <tbody>
                <tr><td style={{padding:'2px 18px 2px 0'}}>5th percentile</td><td style={{...B_Type.serif, fontSize:14, color:palB.ink}}>0.003×</td></tr>
                <tr><td style={{padding:'2px 18px 2px 0'}}>95th percentile</td><td style={{...B_Type.serif, fontSize:14, color:palB.ink}}>57×</td></tr>
                <tr><td style={{padding:'2px 18px 2px 0'}}>P( &gt; GiveWell bar )</td><td style={{...B_Type.serif, fontSize:14, color:palB.ink}}>22%</td></tr>
                <tr><td style={{padding:'2px 18px 2px 0'}}>P( EV &lt; 0 )</td><td style={{...B_Type.serif, fontSize:14, color:palB.accent}}>14%</td></tr>
              </tbody>
            </table>
          </div>
          <window.Histogram seed="B-out" w={1080} h={280} refLine={0.5} palette={palB} />
        </div>

        <div style={{marginTop:32}} />
        <B_SectionLabel n="6" title="Comparator cause areas" sub="ranges, not points · whiskers = community-disputed bounds" />
        <div style={{background:palB.paper, border:'1px solid '+palB.rule, padding:'24px 28px'}}>
          <window.ComparatorBars palette={palB}
            items={[
              { label:'This tool · Ord Moderate', lo:0.003, mid:0.42, hi:57, main:true },
              ...window.COMPARATORS_DEFAULT,
            ]} />
        </div>

      </div>

      <footer style={{padding:'24px 96px 56px', borderTop:'1px solid '+palB.rule, ...B_Type.mono, fontSize:11, color:palB.muted, display:'flex', justifyContent:'space-between'}}>
        <span>Sandberg, Drexler &amp; Ord (2018) · Hanson et al. (2021) · Bostrom (2003) · Ord (2020) · Azad (2026)</span>
        <span>© all-in labs · open source · MIT</span>
      </footer>
    </div>
  );
};

window.DirectionB = DirectionB;
