export interface PlaceSuggestion {
  locationName: string;
  latitude: number;
  longitude: number;
  /** IANA timezone resolved from the coordinates, e.g. "America/New_York". */
  timezone: string;
}
