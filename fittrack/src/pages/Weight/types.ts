export interface Measurement {
  id: number;
  site: number;
  name: string;
  lengthCm: number;
}

export interface MeasurementSite {
  id: number;
  name: string;
}

export interface WeightPhoto {
  id: number;
}

export interface WeightEntry {
  id: number;
  date: Date;
  weightKg: number;
  measurements: Measurement[];
  photos: WeightPhoto[];
}

export interface WeightEntryDto {
  id: number;
  date: string;
  weightKg: number;
  measurements: Measurement[];
  photos: WeightPhoto[];
}
