// Primary-source citations used in tooltips and the colophon. Each entry has a
// short label and a URL where readers can find the original work.

export interface Citation {
  label: string;
  url: string;
}

export const CITATIONS = {
  sdo2018: {
    label: 'Sandberg, Drexler & Ord (2018)',
    url: 'https://arxiv.org/abs/1806.02404',
  },
  hansonGrabby: {
    label: 'Hanson et al. (2021)',
    url: 'https://arxiv.org/abs/2102.01522',
  },
  hansonFilter: {
    label: 'Hanson, The Great Filter (1998)',
    url: 'https://mason.gmu.edu/~rhanson/greatfilter.html',
  },
  bostromAstroWaste: {
    label: 'Bostrom, Astronomical Waste (2003)',
    url: 'https://nickbostrom.com/astronomical/waste',
  },
  ordPrecipice: {
    label: 'Ord, The Precipice (2020)',
    url: 'https://theprecipice.com',
  },
  azad2026: {
    label: 'Azad, Contra Fermi Paradox is Not Contra UFOs (2026)',
    url: 'https://www.jehanazad.com/p/contra-fermi-paradox-is-not-contra',
  },
  armstrongSandberg: {
    label: 'Armstrong & Sandberg, Eternity in Six Hours (2013)',
    url: 'https://www.fhi.ox.ac.uk/wp-content/uploads/intergalactic-spreading.pdf',
  },
  giveWell: {
    label: 'GiveWell — cost-effectiveness analysis',
    url: 'https://www.givewell.org/how-we-work/our-criteria/cost-effectiveness',
  },
  giveWellCash2024: {
    label: 'GiveWell, Re-evaluating unconditional cash transfers (2024)',
    url: 'https://blog.givewell.org/2024/11/12/re-evaluating-the-impact-of-unconditional-cash-transfers/',
  },
  cassan2012: {
    label: 'Cassan et al. (2012)',
    url: 'https://arxiv.org/abs/1202.0903',
  },
  petigura2013: {
    label: 'Petigura et al. (2013)',
    url: 'https://arxiv.org/abs/1311.6806',
  },
  bryson2021: {
    label: 'Bryson et al. (2021)',
    url: 'https://arxiv.org/abs/2010.14812',
  },
  robitailleWhitney2010: {
    label: 'Robitaille & Whitney (2010)',
    url: 'https://arxiv.org/abs/1001.3672',
  },
  licquiaNewman2015: {
    label: 'Licquia & Newman (2015)',
    url: 'https://arxiv.org/abs/1407.1078',
  },
  bostrom2013: {
    label: 'Bostrom, Existential Risk Prevention as Global Priority (2013)',
    url: 'https://existential-risk.com/concept.pdf',
  },
  wright2014: {
    label: 'Wright et al. (2014) — G-HAT',
    url: 'https://arxiv.org/abs/1408.1133',
  },
  macAskill2022: {
    label: 'MacAskill, What We Owe the Future (2022)',
    url: 'https://whatweowethefuture.com',
  },
  macAskill2019: {
    label: 'MacAskill, Are We Living at the Most Influential Time in History? (2019)',
    url: 'https://forum.effectivealtruism.org/posts/XXLf6FmWujkxna3E6',
  },
  schwitzgebelGarza: {
    label: 'Schwitzgebel & Garza, A Defense of the Rights of Artificial Intelligences (2015)',
    url: 'https://faculty.ucr.edu/~eschwitz/SchwitzAbs/AIRights.htm',
  },
  parfit1984: {
    label: 'Parfit, Reasons and Persons (1984)',
    url: 'https://en.wikipedia.org/wiki/Reasons_and_Persons',
  },
  rethinkPrioritiesCRAFT: {
    label: 'Rethink Priorities CRAFT/CURVE',
    url: 'https://rethinkpriorities.org/research-area/curve/',
  },
  // Detection reach (Ch.2). Each method's reach range is built from these.
  nasaStarCount2015: {
    label: 'NASA Blueshift, How Many Stars in the Milky Way? (2015)',
    url: 'https://asd.gsfc.nasa.gov/blueshift/?p=7791',
  },
  price2020: {
    label: 'Price et al., Breakthrough Listen: 1327 nearby stars (2020)',
    url: 'https://arxiv.org/abs/1906.07750',
  },
  wlodarczykSroka2020: {
    label: 'Wlodarczyk-Sroka, Garrett & Siemion (2020)',
    url: 'https://arxiv.org/abs/2006.09756',
  },
  gajjar2021: {
    label: 'Gajjar et al., Breakthrough Listen: Galactic Centre I (2021)',
    url: 'https://arxiv.org/abs/2104.14148',
  },
  margot2026: {
    label:
      'Margot, Results of ten years of UCLA SETI searches with the Green Bank Telescope (2026)',
    url: 'https://arxiv.org/abs/2605.05408',
  },
  sheikh2025: {
    label: 'Sheikh et al., Earth Detecting Earth (2025)',
    url: 'https://arxiv.org/abs/2502.02614',
  },
  tellisMarcy2017: {
    label: 'Tellis & Marcy, Laser emission from 5600 stars (2017)',
    url: 'https://arxiv.org/abs/1704.02535',
  },
  suazo2022: {
    label: 'Suazo et al., Project Hephaistos I (2022)',
    url: 'https://arxiv.org/abs/2201.11123',
  },
  stsciRockyWorlds2025: {
    label: 'STScI, Rocky Worlds DDT programme (2025)',
    url: 'https://www.stsci.edu/contents/newsletters/2025-volume-42-issue-02/webb-and-hubbles-rocky-worlds-program-is-fully-underway-what-to-expect',
  },
  giveWellBar2026: {
    label: 'GiveWell, Cost-Effectiveness Analyses (bar: 6× benchmark as of May 2026)',
    url: 'https://www.givewell.org/how-we-work/our-criteria/cost-effectiveness/cost-effectiveness-models',
  },
  giveWellCostPerLife2024: {
    label: 'GiveWell, How Much Does It Cost To Save a Life? (2024)',
    url: 'https://www.givewell.org/how-much-does-it-cost-to-save-a-life',
  },
  // Comparator cause areas (Ch.5).
  titotal2024: {
    label: 'titotal, Explaining the discrepancies in cost effectiveness ratings (2024)',
    url: 'https://forum.effectivealtruism.org/posts/qARKFgYhCqmKB2YpF',
  },
  ccmOutputs2024: {
    label: 'Rethink Priorities CCM default outputs, as reported by Vasco Grilo (Jan 2024)',
    url: 'https://ea.greaterwrong.com/posts/pniDWyjc9vY5sjGre/rethink-priorities-cross-cause-cost-effectiveness-model',
  },
  millettSnyderBeattie2017: {
    label: 'Millett & Snyder-Beattie, Existential Risk and Cost-Effective Biosecurity (2017)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5576214',
  },
} satisfies Record<string, Citation>;

export type CitationKey = keyof typeof CITATIONS;
