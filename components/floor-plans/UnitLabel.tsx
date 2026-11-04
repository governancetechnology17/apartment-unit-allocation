import Link from "next/link";
import { canOpenUnit } from "@/lib/data";
import { formatArea } from "@/lib/format";
import type { Apartment, PlanLabel } from "@/lib/types";

interface UnitLabelProps {
  unit: Apartment;
  label: PlanLabel;
  viewWidth: number;
  viewHeight: number;
  active: boolean;
  scale?: number;
  onHover?: (unitNumber: string | null) => void;
}

export function UnitLabel({ unit, label, viewWidth, viewHeight, active, scale = 1, onHover }: UnitLabelProps) {
  const available = canOpenUnit(unit);
  const x = label.x - (label.width * (scale - 1)) / 2;
  const y = label.y - (label.height * (scale - 1)) / 2;
  const style = {
    left: `${(x / viewWidth) * 100}%`,
    top: `${(y / viewHeight) * 100}%`,
    width: `${((label.width * scale) / viewWidth) * 100}%`,
    height: `${((label.height * scale) / viewHeight) * 100}%`,
  };
  const className = `plan-unit-label${active ? " active" : ""}${available ? "" : " disabled"}`;
  const content = (
    <>
      <strong>{unit.number}</strong>
      {available ? (
        <>
          {Number(unit.rooms_count) > 0 && <span>{unit.rooms_count} rooms</span>}
          <span>{formatArea(unit)}</span>
          <span className="label-price">
            {unit.discounted_price_raw || unit.price_raw ? `€${Number(unit.discounted_price_raw || unit.price_raw).toLocaleString("en")}` : "Ask price"}
          </span>
        </>
      ) : (
        <span>{unit.allocated ? "Sold" : "Unavailable"}</span>
      )}
    </>
  );

  return available ? (
    <Link
      className={className}
      style={style}
      href={`#`}
      // href={`/units/${unit.number_num}`}
      onPointerEnter={() => onHover?.(String(Number(unit.number_num)))}
      onPointerLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(String(Number(unit.number_num)))}
      onBlur={() => onHover?.(null)}
    >
      {content}
    </Link>
  ) : (
    <div className={className} style={style} onPointerEnter={() => onHover?.(String(Number(unit.number_num)))} onPointerLeave={() => onHover?.(null)}>
      {content}
    </div>
  );
}
