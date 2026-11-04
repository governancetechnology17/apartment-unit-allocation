"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { canOpenUnit } from "@/lib/data";
import { getPlanOverlay, unitsOnFloor } from "@/lib/floor-plans";
import type { Apartment, PlanRegistry } from "@/lib/types";
import { InteractivePlanSvg } from "./InteractivePlanSvg";
import { UnitLabel } from "./UnitLabel";

interface FloorPlanViewerProps {
  apartments: Apartment[];
  registry: PlanRegistry;
  initialFloor?: number;
  initialTower?: "A" | "B";
  activeUnitNumber?: string;
  showControls?: boolean;
}

export function FloorPlanViewer({ apartments, registry, initialFloor = 1, initialTower = "A", activeUnitNumber, showControls = true }: FloorPlanViewerProps) {
  const router = useRouter();
  const [floor, setFloor] = useState(initialFloor);
  const [tower, setTower] = useState<"A" | "B">(initialTower);
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);
  const floorUnits = useMemo(() => unitsOnFloor(apartments, floor, tower), [apartments, floor, tower]);
  const floorUnitsByNumber = useMemo(() => new Map(floorUnits.map((unit) => [String(Number(unit.number_num)), unit])), [floorUnits]);
  const overlay = useMemo(() => getPlanOverlay(registry, apartments, floor, tower), [registry, apartments, floor, tower]);
  const regionMap = useMemo(() => {
    if (floor === 12) {
      const targetUnits = [...overlay.labels].sort((left, right) => Number(left.unit) - Number(right.unit));
      return Object.fromEntries(
        ["76", "77", "78"].flatMap((sourceUnit, index) => (targetUnits[index] ? [[sourceUnit, String(Number(targetUnits[index].unit))]] : [])),
      );
    }

    const sourceFloor = floor >= 6 && floor <= 9 ? 6 : floor;
    const sourceOverlay = registry[String(sourceFloor)]?.[tower] || overlay;
    const unusedLabels = [...sourceOverlay.labels];

    return Object.fromEntries(
      overlay.labels.map((target) => {
        const source = unusedLabels.reduce((closest, candidate) => {
          const distance = Math.hypot(candidate.x - target.x, candidate.y - target.y);
          const closestDistance = Math.hypot(closest.x - target.x, closest.y - target.y);
          return distance < closestDistance ? candidate : closest;
        }, unusedLabels[0] || target);
        unusedLabels.splice(unusedLabels.indexOf(source), 1);
        return [String(Number(source.unit)), String(Number(target.unit))];
      }),
    );
  }, [floor, overlay, registry, tower]);
  const planSource = floor >= 4 && floor <= 11 ? `/plans/towers/floor-${tower}-${floor}.svg` : `/plans/floor-${floor}.svg`;
  const [, , viewWidth, viewHeight] = overlay.viewBox;

  return (
    <section className="floor-plan-viewer">
      <div className="floor-plan-board" style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}>
        {/* The SVG and labels share the production viewBox, so percentages stay aligned. */}
        <InteractivePlanSvg
          src={planSource}
          regionMap={regionMap}
          highlightedUnit={hoveredUnit || (activeUnitNumber ? String(Number(activeUnitNumber)) : null)}
          onUnitHover={setHoveredUnit}
          onUnitSelect={(unitNumber) => {
            // const unit = floorUnitsByNumber.get(String(Number(unitNumber)));
            // if (unit && canOpenUnit(unit)) router.push(`/units/${unit.number_num}`);
          }}
        />
        <div className="plan-label-layer">
          {overlay.labels.map((label) => {
            const unit = floorUnitsByNumber.get(String(Number(label.unit)));
            return unit ? (
              <UnitLabel
                key={unit.number_num}
                unit={unit}
                label={label}
                viewWidth={viewWidth}
                viewHeight={viewHeight}
                active={Number(unit.number_num) === Number(hoveredUnit || activeUnitNumber)}
                scale={floor === 1 ? 1.2 : 1}
                onHover={setHoveredUnit}
              />
            ) : null;
          })}
        </div>
      </div>

      {showControls && (
        <div className="plan-controls" aria-label="Floor plan controls">
          <div className="segmented-control">
            {(["A", "B"] as const).map((value) => (
              <button key={value} className={tower === value ? "selected" : ""} onClick={() => setTower(value)}>
                Tower {value}
              </button>
            ))}
          </div>
          <div className="floor-buttons">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <button key={value} className={floor === value ? "selected" : ""} onClick={() => setFloor(value)} aria-label={`Floor ${value}`}>
                {value}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
