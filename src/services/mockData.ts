import { County } from '../types';

// Mock county data for testing - representing a few real US counties
export const mockCounties: County[] = [
  {
    id: 'tx-harris',
    name: 'Harris County',
    state: 'TX',
    fips: '48201',
    coordinates: [29.7604, -95.3698], // Houston area
  },
  {
    id: 'ca-fresno',
    name: 'Fresno County', 
    state: 'CA',
    fips: '06019',
    coordinates: [36.7378, -119.7871], // Central Valley
  },
  {
    id: 'ia-story',
    name: 'Story County',
    state: 'IA', 
    fips: '19169',
    coordinates: [42.0308, -93.6319], // Iowa farming area
  },
  {
    id: 'ny-wayne',
    name: 'Wayne County',
    state: 'NY',
    fips: '36117', 
    coordinates: [43.2642, -77.0867], // Apple growing region
  }
];

// Mock GeoJSON data for county boundaries
export const mockCountyGeoJSON = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: {
        name: "Harris County",
        state: "TX",
        fips: "48201",
        id: "tx-harris"
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-95.8, 29.4],
          [-94.9, 29.4], 
          [-94.9, 30.1],
          [-95.8, 30.1],
          [-95.8, 29.4]
        ]]
      }
    },
    {
      type: "Feature" as const, 
      properties: {
        name: "Fresno County",
        state: "CA",
        fips: "06019",
        id: "ca-fresno"
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-120.2, 36.2],
          [-119.2, 36.2],
          [-119.2, 37.2], 
          [-120.2, 37.2],
          [-120.2, 36.2]
        ]]
      }
    },
    {
      type: "Feature" as const,
      properties: {
        name: "Story County", 
        state: "IA",
        fips: "19169",
        id: "ia-story"
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-94.0, 41.8],
          [-93.3, 41.8],
          [-93.3, 42.3],
          [-94.0, 42.3], 
          [-94.0, 41.8]
        ]]
      }
    },
    {
      type: "Feature" as const,
      properties: {
        name: "Wayne County",
        state: "NY", 
        fips: "36117",
        id: "ny-wayne"
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-77.4, 43.0],
          [-76.7, 43.0],
          [-76.7, 43.5],
          [-77.4, 43.5],
          [-77.4, 43.0]
        ]]
      }
    }
  ]
};
