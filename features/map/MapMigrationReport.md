# Map Migration Report

## Legacy map analysis

The legacy map is split between \`ViewMap.tsx\` and \`MeydanApp\`.

- \`ViewMap.tsx\` renders selectors, a map iframe, and a selected-location summary.
- \`MeydanApp\` owns province/city selection, custom dropdown opening/filtering, DOM updates, raw JSON use, localStorage coordinate caching, iframe mutation, and browser-side Nominatim requests.
- The old map uses \`data-action\`, \`querySelector\`, \`innerHTML\`, and event delegation.

## New architecture

| Responsibility | New owner |
| --- | --- |
| Typed city/province adapter | \`data/iran-cities.ts\` |
| Province/city/location types | \`types.ts\` |
| Browser-to-server geocoding client | \`services/geocoding.service.ts\` |
| Selection, loading, error state | \`hooks/useMap.ts\` |
| Province UI | \`MapSelector.tsx\` |
| City UI | \`CitySelector.tsx\` |
| Location status | \`LocationPreview.tsx\` |
| Iframe rendering | \`MapFrame.tsx\` |
| Composition | \`MapView.tsx\` |
| Nominatim proxy/cache/error boundary | \`app/api/geocoding/route.ts\` |

## Data ownership

\`data/iran-cities.json\` remains temporarily because the still-mounted legacy controller imports it. The new feature never exposes or parses raw JSON in components; it consumes the typed adapter. Move the raw source into \`features/map/data/\` only after the legacy controller is removed.

## Geocoding boundary

The browser calls only \`/api/geocoding\`. The API route validates parameters, calls Nominatim server-side, returns typed error responses, and keeps a short in-memory cache. This removes external geocoding calls and localStorage caching from the Map UI.

## Remaining debt

- Nominatim is a public service and needs rate-limit observability or a production geocoding provider.
- In-memory cache is per server instance; replace with durable caching when data becomes production-backed.
- The legacy \`ViewMap.tsx\` and map logic in \`MeydanApp\` remain until the legacy controller is retired.