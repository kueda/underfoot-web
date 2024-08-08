import {
  DataDrivenPropertyValueSpecification,
  LayerSpecification,
  StyleSpecification
} from 'maplibre-gl';

const NO_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: []
};

const waysLayers: LayerSpecification[] = [
  {
    id: 'ways',
    source: 'ways',
    'source-layer': 'underfoot_ways',
    type: 'line',
    filter: ['match', ['get', 'highway'], ['motorway', 'primary', 'trunk', 'secondary', 'tertiary', 'path', 'track'], false, true],
    paint: {
      'line-color': 'rgb(80,80,80)',
      'line-width': 1.6
    }
  },
  {
    id: 'highways',
    source: 'ways',
    'source-layer': 'underfoot_ways',
    type: 'line',
    filter: ['match', ['get', 'highway'], ['motorway', 'primary', 'trunk'], true, false],
    paint: {
      'line-color': 'rgb(80,80,80)',
      'line-width': 3
    }
  },
  {
    id: 'roads',
    source: 'ways',
    'source-layer': 'underfoot_ways',
    type: 'line',
    filter: ['match', ['get', 'highway'], ['secondary', 'tertiary'], true, false],
    paint: {
      'line-color': 'rgb(80,80,80)',
      'line-width': 1.6
    }
  },
  {
    id: 'trails',
    source: 'ways',
    'source-layer': 'underfoot_ways',
    type: 'line',
    filter: ['match', ['get', 'highway'], ['path', 'track'], true, false],
    paint: {
      'line-color': 'rgb(80,80,80)',
      'line-width': 1.6,
      'line-dasharray': [2,1]
    }
  },
  {
    id: 'ways-labels',
    source: 'ways',
    'source-layer': 'underfoot_ways',
    type: 'symbol',
    paint: {
      'text-halo-color': 'white',
      'text-halo-width': 1
    },
    layout: {
      'symbol-placement': 'line',
      'text-size': 10,
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Bold']
    }
  },
]

const COMMON_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {},
  layers: []
}

const ROCK_STYLE: StyleSpecification = {
  ...COMMON_STYLE,
  sources: {
    rocks: {
      type: 'vector',
      // this is pmtiles://[[protocol key]]/{z}/{x}/{y}, so the file name we declared earlier gets used here
      tiles: ["pmtiles://rocks/{z}/{x}/{y}"],
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    },
    ways: {
      type: 'vector',
      tiles: ["pmtiles://ways/{z}/{x}/{y}"],
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }
  },
  layers: [
    {
      id: 'units',
      // Here we're using the key delcared in sources
      source: 'rocks',
      // layername is embedded in the pmtiles
      'source-layer': 'rock_units',
      type: 'fill',
      paint: {
        'fill-color': [
          // https://maplibre.org/maplibre-style-spec/expressions/#match
          'match',

          // input
          ['get', 'lithology'],

          // mappings
          ["agglomerate", "volcanic breccia", "volcanoclastic breccia"], 'rgb(255,213,157)',
          ["alaskite", "alkali-feldspar granite"], 'rgb(255,209,220)',
          ["alkali-feldspar rhyolite"], 'rgb(254,220,126)',
          ["alkali-feldspar syenite"], 'rgb(244,60,108)',
          ["alkali-feldspar trachyte"], 'rgb(254,183,134)',
          ["alkalic intrusive rock"], 'rgb(255,111,145)',
          ["alkalic volcanic rock"], 'rgb(194,65,0)',
          ["alkaline basalt"], 'rgb(169,101,55)',
          ["alluvial fan"], 'rgb(255,255,183)',
          ["alluvial terrace"], 'rgb(250,238,122)',
          ["alluvium", "surficial deposits"], 'rgb(255,255,137)',
          ["amphibole schist"], 'rgb(150,150,150)',
          ["amphibolite"], 'rgb(123,0,156)',
          ["andesite"], 'rgb(177,72,1)',
          ["ankaramite", "basanite", "benmoreite", "tephrite", "tephrite (basanite)"], 'rgb(133,79,43)',
          ["anorthosite"], 'rgb(255,149,174)',
          ["aplite"], 'rgb(255,193,183)',
          ["arenite"], 'rgb(166,252,170)',
          ["argillite"], 'rgb(225,240,216)',
          ["arkose"], 'rgb(105,207,156)',
          ["artificial"], 'pink',
          ["ash-flow tuff"], 'rgb(255,239,217)',
          ["augen gneiss", "cataclasite"], 'rgb(136,127,80)',
          ["basalt", "icelandite", "mugearite", "picrite"], 'rgb(221,179,151)',
          ["beach sand"], 'rgb(228,216,190)',
          ["bentonite"], 'rgb(192,208,192)',
          ["bimodal suite"], 'rgb(255,193,111)',
          ["biogenic material"], 'rgb(247,243,161)',
          ["biotite gneiss"], 'rgb(200,134,254)',
          ["black shale"], 'rgb(219,254,188)',
          ["blueschist"], 'rgb(192,192,192)',
          ["calc-silicate rock", "silica-carbonate"], 'rgb(70,0,140)',
          ["calc-silicate schist"], 'rgb(182,182,206)',
          ["calcarenite"], 'rgb(154,206,254)',
          ["carbonate rock"], 'rgb(86,224,252)',
          ["chemical sedimentary rock"], 'rgb(205,222,255)',
          ["chert"], 'rgb(154,191,192)',
          ["clastic rock"], 'rgb(217,253,211)',
          ["clay or mud", "clay"], 'rgb(255,219,103)',
          ["claystone"], 'rgb(213,230,204)',
          ["coal"], 'rgb(130,0,65)',
          ["coarse-grained mixed clastic rock"], 'rgb(165,170,173)',
          ["colluvium"], 'rgb(225,227,195)',
          ["conglomerate"], 'rgb(183,217,204)',
          ["coral"], 'rgb(255,204,153)',
          ["dacite"], 'rgb(254,205,172)',
          ["debris flow"], 'rgb(211,202,159)',
          ["delta"], 'rgb(255,250,200)',
          ["diabase"], 'rgb(214,0,0)',
          ["diorite"], 'rgb(255,51,23)',
          ["dolomite", "dolostone", "dolostone (dolomite)"], 'rgb(107,195,255)',
          ["dune sand"], 'rgb(224,210,180)',
          ["dunite"], 'rgb(176,0,42)',
          ["eclogite"], 'rgb(206,157,255)',
          ["eolian material"], 'rgb(224,197,158)',
          ["evaporite"], 'rgb(1,156,205)',
          ["exhalite"], 'rgb(217,194,163)',
          ["felsic gneiss"], 'rgb(224,188,254)',
          ["felsic metavolcanic rock"], 'rgb(255,141,255)',
          ["felsic volcanic rock"], 'rgb(244,139,0)',
          ["fine-grained mixed clastic rock"], 'rgb(149,255,202)',
          ["flaser gneiss"], 'rgb(100,2,11)',
          ["flood plain"], 'rgb(255,255,213)',
          ["gabbro"], 'rgb(233,147,190)',
          ["gabbroid"], 'rgb(172,0,0)',
          ["glacial drift"], 'rgb(191,167,67)',
          ["glacial outwash sediment"], 'rgb(255,223,133)',
          ["glacial-marine sediment"], 'rgb(254,219,46)',
          ["glaciolacustrine sediment"], 'rgb(254,226,88)',
          ["glassy volcanic rock"], 'rgb(255,195,228)',
          ["gneiss", "phanerite", "plutonic rock (phaneritic)"], 'rgb(236,214,254)',
          ["granite"], 'rgb(249,181,187)',
          ["granitic gneiss"], 'rgb(213,164,254)',
          ["granitoid", "monzogranite"], 'rgb(221,41,114)',
          ["granodiorite"], 'rgb(233,121,166)',
          ["granofels"], 'rgb(163,55,253)',
          ["granulite"], 'rgb(106,0,106)',
          ["gravel"], 'rgb(236,180,0)',
          ["graywacke"], 'rgb(184,234,195)',
          ["greenschist"], 'rgb(237,237,243)',
          ["greenstone"], 'rgb(0,128,0)',
          ["greisen"], 'rgb(164,73,255)',
          ["hawaiite"], 'rgb(198,128,80)',
          ["hornblendite"], 'rgb(163,1,9)',
          ["hornfels"], 'rgb(234,175,255)',
          ["ice"], 'rgb(255,255,255)',
          ["ignimbrite"], 'rgb(255,229,195)',
          ["intermediate metavolcanic rock"], 'rgb(255,0,0)',
          ["intermediate volcanic rock"], 'rgb(235,96,1)',
          ["intrusive carbonatite"], 'rgb(117,1,7)',
          ["iron formation"], 'rgb(185,149,152)',
          ["keratophyre"], 'rgb(254,103,0)',
          ["kimberlite"], 'rgb(193,1,10)',
          ["komatiite", "ultramafitite"], 'rgb(160,53,0)',
          ["lahar"], 'rgb(220,213,180)',
          ["lake or marine sediment"], 'rgb(244,239,228)',
          ["lamprophyre"], 'rgb(228,88,145)',
          ["landslide"], 'rgb(201,190,137)',
          ["latite"], 'rgb(254,117,24)',
          ["lava flow"], 'rgb(255,162,39)',
          ["levee"], 'rgb(255,250,233)',
          ["limestone"], 'rgb(67,175,249)',
          ["loess"], 'rgb(245,225,189)',
          ["mafic gneiss"], 'rgb(204,183,255)',
          ["mafic metavolcanic rock"], 'rgb(185,59,104)',
          ["mafic volcanic rock"], 'rgb(147,60,1)',
          ["marble"], 'rgb(0,0,255)',
          ["mass wasting material"], 'rgb(207,187,143)',
          ["medium-grained mixed clastic rock"], 'rgb(144,165,101)',
          ["meta-argillite"], 'rgb(201,255,201)',
          ["metabasalt", "meta-basalt"], 'rgb(135,43,76)',
          ["metaconglomerate", "meta-conglomerate"], 'rgb(233,255,233)',
          ["metaluminous granite"], 'rgb(255,179,197)',
          ["metamorphic rock"], 'rgb(167,167,255)',
          ["metarhyolite", "meta-rhyolite"], 'rgb(255,167,255)',
          ["metasedimentary rock"], 'rgb(125,255,125)',
          ["metavolcanic rock"], 'rgb(255,87,255)',
          ["mica schist"], 'rgb(177,177,177)',
          ["migmatite"], 'rgb(159,0,202)',
          ["mixed carbonate/clastic rock"], 'rgb(56,180,177)',
          ["mixed coal/clastic rock"], 'rgb(110,73,9)',
          ["mixed volcanic/clastic rock"], 'rgb(96,204,191)',
          ["monzodiorite"], 'rgb(255,169,157)',
          ["monzogabbro"], 'rgb(227,119,173)',
          ["monzonite"], 'rgb(255,39,90)',
          ["moraine"], 'rgb(255,238,191)',
          ["mud flat", "mud"], 'rgb(228,208,190)',
          ["mudflow"], 'rgb(229,219,179)',
          ["mudstone"], 'rgb(207,239,223)',
          ["mylonite"], 'rgb(109,80,51)',
          ["mélange", "melange"], 'rgb(187,192,197)',
          ["nepheline syenite"], 'rgb(255,27,81)',
          ["norite"], 'rgb(255,214,209)',
          ["novaculite"], 'rgb(192,174,182)',
          ["obsidian"], 'rgb(255,209,234)',
          ["oil shale"], 'rgb(187,255,221)',
          ["olistostrome"], 'rgb(141,190,205)',
          ["orthogneiss"], 'rgb(179,149,255)',
          ["orthoquartzite", "quartz arenite"], 'rgb(203,239,206)',
          ["paragneiss"], 'rgb(144,99,255)',
          ["peat"], 'rgb(255,207,129)',
          ["pegmatite"], 'rgb(255,239,243)',
          ["pelitic schist", "pelite"], 'rgb(202,202,220)',
          ["peralkaline granite"], 'rgb(252,82,98)',
          ["peraluminous granite"], 'rgb(248,190,174)',
          ["peridotite"], 'rgb(206,0,49)',
          ["phonolite"], 'rgb(95,57,31)',
          ["phosphorite"], 'rgb(191,227,220)',
          ["phyllite"], 'rgb(180,207,228)',
          ["phyllonite"], 'rgb(172,127,80)',
          ["playa"], 'rgb(241,229,223)',
          ["plutonic rock"], 'rgb(252,110,124)',
          ["porphyry"], 'rgb(255,225,232)',
          ["pumice"], 'rgb(255,229,243)',
          ["pyroclastic rock"], 'rgb(255,224,222)',
          ["pyroxenite"], 'rgb(148,0,35)',
          ["quartz diorite"], 'rgb(232,28,0)',
          ["quartz gabbro"], 'rgb(237,167,202)',
          ["quartz latite"], 'rgb(254,135,54)',
          ["quartz monzodiorite"], 'rgb(255,129,159)',
          ["quartz monzogabbro"], 'rgb(255,111,91)',
          ["quartz monzonite"], 'rgb(255,99,136)',
          ["quartz syenite"], 'rgb(251,35,56)',
          ["quartz-feldspar schist"], 'rgb(162,162,192)',
          ["quartzite"], 'rgb(159,255,159)',
          ["residuum"], 'rgb(255,227,137)',
          ["rhyodacite"], 'rgb(254,198,42)',
          ["rhyolite"], 'rgb(254,204,104)',
          ["sand sheet"], 'rgb(219,204,169)',
          ["sand"], 'rgb(255,203,35)',
          ["sandstone"], 'rgb(205,255,217)',
          ["schist"], 'rgb(219,219,231)',
          ["sedimentary breccia"], 'rgb(167,186,134)',
          ["sedimentary rock", "diatomite"], 'rgb(146,220,183)',
          ["serpentinite"], 'rgb(0,92,0)',
          ["shale"], 'rgb(172,228,200)',
          ["silt"], 'rgb(255,211,69)',
          ["siltstone"], 'rgb(214,254,154)',
          ["skarn"], 'rgb(129,3,255)',
          ["slate"], 'rgb(230,205,255)',
          ["spilite"], 'rgb(201,85,126)',
          ["stratified glacial sediment"], 'rgb(255,229,157)',
          ["sub/supra-glacial sediment"], 'rgb(254,230,112)',
          ["subaluminous granite"], 'rgb(255,111,107)',
          ["syenite"], 'rgb(244,26,135)',
          ["talus"], 'rgb(188,175,108)',
          ["tectonic breccia"], 'rgb(176,167,120)',
          ["tectonic mélange"], 'rgb(208,203,176)',
          ["tectonite"], 'rgb(132,97,62)',
          ["terrace"], 'rgb(255,246,217)',
          ["tholeiite"], 'rgb(211,157,121)',
          ["till"], 'rgb(210,194,124)',
          ["tonalite"], 'rgb(252,182,182)',
          ["trachyandesite"], 'rgb(201,82,1)',
          ["trachybasalt"], 'rgb(236,213,198)',
          ["trachyte"], 'rgb(254,160,96)',
          ["troctolite"], 'rgb(255,191,206)',
          ["trondhjemite"], 'rgb(255,167,188)',
          ["tuff"], 'rgb(249,211,211)',
          ["ultramafic intrusive rock"], 'rgb(232,0,55)',
          ["unconsolidated material"], 'rgb(253,244,63)',
          ["vitrophyre"], 'rgb(255,195,248)',
          ["volcanic ash"], 'rgb(224,176,158)',
          ["volcanic carbonatite"], 'rgb(110,37,0)',
          ["volcanic rock"], 'rgb(255,183,222)',
          ["wacke"], 'rgb(189,219,241)',
          ["water"], 'rgb(0,15,33)',
          ["welded tuff"], 'rgb(255,243,201)',

          // default
          '#000000'
        ]
      }
    },
    {
      id: 'units-lines',
      source: 'rocks',
      minzoom: 12,
      'source-layer': 'rock_units',
      type: 'line',
      paint: {
        'line-color': 'rgba(255,255,255,0.9)',
        'line-width': 1.5
      }
    },
    ...waysLayers
  ]
};

const WATERWAYS_COLOR_EXP: DataDrivenPropertyValueSpecification<string> = [
  // https://maplibre.org/maplibre-style-spec/expressions/#match
  'match',

  // input
  ['get', 'is_natural'],

  // mappings
  [0], '#FF7F00',

  '#1F78B4'
];

const WATER_STYLE: StyleSpecification = {
  ...COMMON_STYLE,
  sources: {
    water: {
      type: 'vector',
      // this is pmtiles://[[protocol key]]/{z}/{x}/{y}, so the file name we declared earlier gets used here
      tiles: ["pmtiles://water/{z}/{x}/{y}"],
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    },
    ways: {
      type: 'vector',
      tiles: ["pmtiles://ways/{z}/{x}/{y}"],
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }
  },
  layers: [
    {
      id: 'watersheds',
      source: 'water',
      // minzoom: 12,
      'source-layer': 'watersheds',
      type: 'fill',
      paint: {
        'fill-color': '#CFC4AF'
      }
    },
    {
      id: 'watersheds-lines',
      source: 'water',
      // minzoom: 12,
      'source-layer': 'watersheds',
      type: 'line',
      paint: {
        'line-color': 'rgba(255,255,255,0.9)',
        'line-width': 1.5
      }
    },
    {
      id: 'waterbodies',
      source: 'water',
      'source-layer': 'waterbodies',
      type: 'fill',
      paint: {
        'fill-color': '#1F78B4'
      }
    },
    {
      id: 'waterways',
      source: 'water',
      'source-layer': 'waterways',
      type: 'line',
      paint: {
        // 'line-color': '#1F78B4',
        'line-width': 2,
        'line-color': WATERWAYS_COLOR_EXP
      }
    },
    ...waysLayers,
    {
      id: 'waterways-labels',
      source: 'water',
      'source-layer': 'waterways',
      type: 'symbol',
      paint: {
        'text-halo-color': 'white',
        'text-halo-width': 1,
        'text-color': WATERWAYS_COLOR_EXP
      },
      layout: {
        'symbol-placement': 'line',
        'text-size': 10,
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Bold']
      }
    },
  ]
};

export {
  NO_STYLE,
  ROCK_STYLE,
  WATER_STYLE
};
