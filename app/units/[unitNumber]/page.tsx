import Link from "next/link";
import { notFound } from "next/navigation";
import { ReservationSidebar } from "@/components/reservation/ReservationSidebar";
import { UnitWorkspace } from "@/components/units/UnitWorkspace";
import { getApartments, getEsubDetails } from "@/lib/apartments";
import { apartments as apartmentMetadata, assetRegistry, canOpenUnit, planRegistry } from "@/lib/data";
import { formatArea, formatPrice } from "@/lib/format";

export function generateStaticParams() {
  return apartmentMetadata.map((unit) => ({ unitNumber: unit.number_num }));
}

const salesData = [
  {
    name: "Ahmed Ibraheem",
    role: "Customer Relations Manager",
    tel: "+372 5944 4444",
    whatsappLink: "https://wa.me/3725944444?text=Hello%20Diana%2C%20I%20am%20interested%20in%20unit%2061%20at%20Krulli%2010.",
    email: "ahmed@myxellia.io",
    img: "/assets/ahmed.jpg",
  },
  {
    name: "David Peter",
    role: "Sales Manager",
    tel: "+372 5944 4555",
    whatsappLink: "https://wa.me/3725944555?text=Hello%20Martin%2C%20I%20am%20interested%20in%20unit%2061%20at%20Krulli%2010.",
    email: "david@myxellia.io",
    img: "/assets/peter.png",
  },
];

const hideIds = ['134', '112', '102']

export default async function UnitPage({ params }: { params: Promise<{ unitNumber: string }> }) {
  const { unitNumber } = await params;
  const apartments = await getApartments();
  const esubDetails = await getEsubDetails();

  const unit = apartments.find((apartment) => Number(apartment.number_num) === Number(unitNumber));
  if (!unit || !canOpenUnit(unit)) notFound();

  const asset = assetRegistry.units[unit.number_num];
  const unitKind = Object.values(unit.function).find(Boolean) || "Apartment";
  const status = unit.allocated ? "sold" : "available";
  const statusLabel = unit.allocated ? "Sold" : "Available";
  const salesSubject = encodeURIComponent(`Myxellia unit ${unit.number}`);
  const salesEmail = `mailto:david@myxellia.io?subject=${salesSubject}`;
  const floor = Number(unit.min_floor || unit.floor);
  const tower = unit.house.identificator;
  const planApartments = apartments.filter((apartment) => Number(apartment.min_floor || apartment.floor) === floor && apartment.house.identificator === tower);
  const sourceFloor = floor >= 6 && floor <= 9 ? 6 : floor;
  const unitPlans = {
    [String(floor)]: { [tower]: planRegistry[String(floor)]?.[tower] },
    ...(sourceFloor === floor ? {} : { [String(sourceFloor)]: { [tower]: planRegistry[String(sourceFloor)]?.[tower] } }),
  };

  return (
    <div className="unit-page">
      {!hideIds.includes(unitNumber) && (
        <aside className="unit-details">
          <header className="unit-brandbar">
            {/* <img src="/assets/logo.svg" alt="Myxellia" /> */}
            <Link href="/" aria-label="Back to all units">
              <span aria-hidden="true">←</span>
            </Link>
          </header>

          <section className="unit-summary">
            <div className="unit-heading">
              <small>{unit.house.name} · Tallinn</small>
              <h1>{unit.number}</h1>
              <p>{unitKind}</p>
            </div>

            <dl className="unit-facts">
              <div>
                <dt>Tower</dt>
                <dd>{unit.house.identificator}</dd>
              </div>
              <div>
                <dt>Floor</dt>
                <dd>{unit.floor}</dd>
              </div>
              <div>
                <dt>Rooms</dt>
                <dd>{unit.rooms_count || "-"}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{formatArea(unit)}</dd>
              </div>
              <div>
                <dt>{unit.extra_size_type || "Outdoor area"}</dt>
                <dd>{unit.balcony_size_raw ? `${unit.balcony_size_raw} m²` : "-"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd className={`unit-status status-${status}`}>{statusLabel}</dd>
              </div>
            </dl>

            <div className="unit-price">
              <span>Price</span>
              <strong>{formatPrice(unit)}</strong>
            </div>

            <dl className="unit-extras">
              <div>
                <dt>View</dt>
                <dd>{unit.view || "-"}</dd>
              </div>
              <div>
                <dt>Interior finish</dt>
                <dd>Myxellia</dd>
              </div>
              <div>
                <dt>Ceiling height</dt>
                <dd>2.9 m</dd>
              </div>
            </dl>

            <nav className="unit-resource-links" aria-label="Unit resources">
              <a href="#unit-stage">
                <span aria-hidden="true">▦</span> Explore floor plan
              </a>
              <a href="#unit-stage">
                <span aria-hidden="true">◇</span> View 3D and interior
              </a>
            </nav>
          </section>
        </aside>
      )}

      <main className="unit-workspace" id="unit-stage" style={{ width: hideIds.includes(unitNumber) ? '100vw' : 'unset' }}>
        <UnitWorkspace unit={unit} asset={asset} apartments={planApartments} plans={unitPlans} />
      </main>

      {!hideIds.includes(unitNumber) && (
        <ReservationSidebar
          esubDetails={esubDetails}
          unitId={unit?.unit}
          allocationId={unit?.id}
          unitNumber={unit.number}
          propertyName={unit.house.name}
          available={!unit.allocated}
          salesSubject={salesSubject}
          contacts={salesData}
        />
      )}
    </div>
  );
}
