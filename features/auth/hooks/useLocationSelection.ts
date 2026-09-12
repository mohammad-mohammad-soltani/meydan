"use client";

import { useCallback, useRef, useState } from "react";
import type { City, MapFocusRequest, Province, SelectedLocation } from "@/features/map/types";
import { getProvinceCenter, resolveCityCenter } from "../services/area-center.service";

/**
 * Owns the chosen point and the map's recenter requests. Reverse geocoding
 * itself lives in the picker (debounced + cached); this hook only records the
 * result and tells the map where to look when the dropdowns change.
 *
 * Changing the area clears the point, but that happens in the change handlers
 * rather than an effect so it does not cost an extra render pass.
 */
export function useLocationSelection() {
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [resolving, setResolving] = useState(false);
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const focusNonce = useRef(0);

  // A city center resolves over the network; a late response for a previously
  // selected city must not recenter the map after the user has moved on.
  const pendingFocus = useRef(0);

  const requestFocus = useCallback((latitude: number, longitude: number, zoom: number) => {
    focusNonce.current += 1;
    setFocusRequest({ latitude, longitude, zoom, nonce: focusNonce.current });
  }, []);

  const focusProvince = useCallback(
    (nextProvince: Province | null) => {
      pendingFocus.current += 1;
      setLocation(null);
      const center = getProvinceCenter(nextProvince);
      requestFocus(center.latitude, center.longitude, nextProvince ? 8 : 6);
    },
    [requestFocus],
  );

  const focusCity = useCallback(
    (nextCity: City, nextProvince: Province | null) => {
      pendingFocus.current += 1;
      setLocation(null);
      const token = pendingFocus.current;
      void resolveCityCenter(nextCity, nextProvince).then((center) => {
        if (token !== pendingFocus.current) return;
        requestFocus(center.latitude, center.longitude, 12);
      });
    },
    [requestFocus],
  );

  return {
    location,
    setLocation,
    resolving,
    setResolving,
    focusRequest,
    focusProvince,
    focusCity,
  };
}
