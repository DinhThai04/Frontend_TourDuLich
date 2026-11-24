import { useId } from "react";

type TourContentReadinessProps = {
  title?: string;
  program?: string;
  duration?: number;
  adultPrice?: number | null;
  departureCity?: string;
  hasPhoto: boolean;
  hasItinerary?: boolean;
  hasOpenDeparture?: boolean;
};

type CheckState = "ok" | "missing" | "unknown";

type Check = {
  label: string;
  state: CheckState;
  text: string;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

const stateStyles: Record<CheckState, { badge: string; dot: string }> = {
  ok: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  missing: {
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  unknown: {
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
  },
};

function booleanCheck(
  label: string,
  value: boolean | undefined,
  labels: { yes: string; no: string },
): Check {
  if (value === undefined) {
    return { label, state: "unknown", text: "Chưa xác định" };
  }

  return value
    ? { label, state: "ok", text: labels.yes }
    : { label, state: "missing", text: labels.no };
}

export default function TourContentReadiness({
  title,
  program,
  duration,
  adultPrice,
  departureCity,
  hasPhoto,
  hasItinerary,
  hasOpenDeparture,
}: TourContentReadinessProps) {
  const headingId = useId();
  const cleanTitle = title?.trim();
  const cleanProgram = program?.trim();
  const cleanCity = departureCity?.trim();
  const knownPrice =
    typeof adultPrice === "number" &&
    Number.isFinite(adultPrice) &&
    adultPrice > 0
      ? adultPrice
      : null;
  const knownDuration =
    typeof duration === "number" && Number.isFinite(duration) ? duration : null;

  const checks: Check[] = [
    {
      label: "Tiêu đề",
      state: cleanTitle ? "ok" : "missing",
      text: cleanTitle ? "Đã có" : "Còn thiếu",
    },
    {
      label: "Ảnh đại diện",
      state: hasPhoto ? "ok" : "missing",
      text: hasPhoto ? "Đã có" : "Còn thiếu",
    },
    {
      label: "Giá người lớn",
      state: knownPrice !== null ? "ok" : "missing",
      text: knownPrice !== null ? "Đã có" : "Còn thiếu",
    },
    {
      label: "Điểm khởi hành",
      state: cleanCity ? "ok" : "missing",
      text: cleanCity ? "Đã có" : "Còn thiếu",
    },
    booleanCheck("Lịch trình", hasItinerary, {
      yes: "Đã có",
      no: "Còn thiếu",
    }),
    booleanCheck("Lịch khởi hành mở", hasOpenDeparture, {
      yes: "Đang mở",
      no: "Chưa mở",
    }),
  ];

  const previewFacts = [
    knownDuration !== null
      ? `Thời lượng: ${numberFormatter.format(knownDuration)} ngày`
      : null,
    cleanCity ? `Khởi hành từ ${cleanCity}` : null,
    knownPrice !== null
      ? `Giá người lớn: ${currencyFormatter.format(knownPrice)}`
      : null,
  ].filter((fact): fact is string => fact !== null);

  return (
    <section
      aria-labelledby={headingId}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm sm:p-4"
    >
      <h2
        id={headingId}
        className="mt-0.5 text-base font-semibold text-slate-900"
      >
        Kiểm tra nội dung tour
      </h2>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {checks.map((check) => {
          const styles = stateStyles[check.state];

          return (
            <li
              key={check.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
            >
              <span className="text-sm text-slate-700">{check.label}</span>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles.badge}`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
                />
                {check.text}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 rounded-lg bg-slate-50 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Xem trước nội dung
        </h3>
        <div className="mt-1.5 space-y-1">
          <p className="break-words text-sm font-semibold text-slate-900">
            {cleanTitle ? cleanTitle : "Chưa có tiêu đề"}
          </p>
          {cleanProgram ? (
            <p className="break-words text-xs leading-relaxed text-slate-600">
              {cleanProgram}
            </p>
          ) : null}
          {previewFacts.length > 0 ? (
            <p className="text-xs leading-relaxed text-slate-600">
              {previewFacts.join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
