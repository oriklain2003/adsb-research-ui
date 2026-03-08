import { useState, useMemo } from "react";
import type { Layer } from "@deck.gl/core";
import type {
  BatchAnomalyEvent,
  BatchAnomalyVisibility,
  TimePreset,
} from "../types/batchAnomaly";
import { useBatchAnomalyEvents } from "./useBatchAnomalyEvents";
import {
  createRuleBasedDotLayer,
  createRuleBasedLineLayer,
  createKalmanDotLayer,
  createKalmanLineLayer,
} from "../components/BatchAnomalyLayers";

/** Category key → SQL category value */
const RB_CATEGORIES: Record<string, string> = {
  rb_gps_spoofing: "gps_spoofing",
  rb_gps_jamming: "gps_jamming",
  rb_probable_jamming: "probable_jamming",
  rb_coverage_hole: "coverage_hole",
  rb_transponder_off: "transponder_off",
  rb_ambiguous: "ambiguous",
};

const KALMAN_CLASSIFICATIONS: Record<string, string> = {
  k_gps_spoofing: "gps_spoofing",
  k_anomalous: "anomalous",
};

export interface BatchAnomalyLayersState {
  layers: Layer[];
  visibility: BatchAnomalyVisibility;
  setVisibility: (v: BatchAnomalyVisibility) => void;
  selectedEvent: BatchAnomalyEvent | null;
  setSelectedEvent: (e: BatchAnomalyEvent | null) => void;
  timePreset: TimePreset;
  setTimePreset: (p: TimePreset) => void;
  loading: boolean;
  eventCounts: { ruleBased: number; kalman: number };
}

export function useBatchAnomalyLayers(): BatchAnomalyLayersState {
  const [visibility, setVisibility] = useState<BatchAnomalyVisibility>({
    rb_gps_spoofing: false,
    rb_gps_jamming: false,
    rb_probable_jamming: false,
    rb_coverage_hole: false,
    rb_transponder_off: false,
    rb_ambiguous: false,
    k_gps_spoofing: false,
    k_anomalous: false,
  });

  const [selectedEvent, setSelectedEvent] = useState<BatchAnomalyEvent | null>(null);
  const [timePreset, setTimePreset] = useState<TimePreset>("48h");

  const anyVisible = Object.values(visibility).some(Boolean);

  const { ruleBasedEvents, kalmanEvents, loading } = useBatchAnomalyEvents(
    anyVisible,
    timePreset,
  );

  const layers = useMemo(() => {
    const result: Layer[] = [];

    // Rule-based layers
    for (const [key, category] of Object.entries(RB_CATEGORIES)) {
      if (!visibility[key as keyof BatchAnomalyVisibility]) continue;
      result.push(
        createRuleBasedDotLayer(category, ruleBasedEvents, setSelectedEvent) as unknown as Layer,
      );
      result.push(
        createRuleBasedLineLayer(category, ruleBasedEvents) as unknown as Layer,
      );
    }

    // Kalman layers
    for (const [key, classification] of Object.entries(KALMAN_CLASSIFICATIONS)) {
      if (!visibility[key as keyof BatchAnomalyVisibility]) continue;
      result.push(
        createKalmanDotLayer(classification, kalmanEvents, setSelectedEvent) as unknown as Layer,
      );
      result.push(
        createKalmanLineLayer(classification, kalmanEvents) as unknown as Layer,
      );
    }

    return result;
  }, [visibility, ruleBasedEvents, kalmanEvents]);

  return {
    layers,
    visibility,
    setVisibility,
    selectedEvent,
    setSelectedEvent,
    timePreset,
    setTimePreset,
    loading,
    eventCounts: {
      ruleBased: ruleBasedEvents.length,
      kalman: kalmanEvents.length,
    },
  };
}
