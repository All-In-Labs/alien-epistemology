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
    url: 'https://jehanazad.com',
  },
  sandbergArmstrong: {
    label: 'Sandberg & Armstrong (2013)',
    url: 'https://arxiv.org/abs/1303.5040',
  },
  giveWell: {
    label: 'GiveWell — cost-effectiveness analysis',
    url: 'https://www.givewell.org/how-we-work/our-criteria/cost-effectiveness',
  },
  cassan2012: {
    label: 'Cassan et al. (2012)',
    url: 'https://arxiv.org/abs/1202.0903',
  },
  petigura2013: {
    label: 'Petigura et al. (2013)',
    url: 'https://arxiv.org/abs/1311.6806',
  },
  wright2014: {
    label: 'Wright et al. (2014) — G-HAT',
    url: 'https://arxiv.org/abs/1408.1133',
  },
  macAskill2022: {
    label: 'MacAskill, What We Owe the Future (2022)',
    url: 'https://whatweowethefuture.com',
  },
  macAskill2020: {
    label: 'MacAskill, Are We Living at the Hinge of History? (2020)',
    url: 'https://forum.effectivealtruism.org/posts/XXLf6FmWujkxna3E6',
  },
  schwitzgebelGarza: {
    label: 'Schwitzgebel & Garza (2015)',
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
