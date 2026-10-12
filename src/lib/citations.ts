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
} satisfies Record<string, Citation>;

export type CitationKey = keyof typeof CITATIONS;
