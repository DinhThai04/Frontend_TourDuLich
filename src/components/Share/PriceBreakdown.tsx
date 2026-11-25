import { useId, useState } from "react";

type PriceLine = {
  label: string;
  quantity: number;
  unitAmount: number;
  amount: number;
};

type PriceBreakdownProps = {
  lines: readonly PriceLine[];
  total: number;
  estimated?: boolean;
  note?: string;
  collapsible?: boolean;
  hideTotal?: boolean;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const quantityFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

const formatMoney = (amount: number) =>
  amount === 0 ? "Miễn phí" : currencyFormatter.format(amount);

export default function PriceBreakdown({
  lines,
  total,
  estimated,
  note,
  collapsible = false,
  hideTotal = false,
}: PriceBreakdownProps) {
  const headingId = useId();
  const [expanded, setExpanded] = useState(!collapsible);
  const totalLabel = estimated ? "Tổng dự kiến" : "Tổng thanh toán";
  const activeLines = lines.filter((line) => line.quantity > 0);

  return (
    <section
      aria-labelledby={headingId}
      className={
        collapsible
          ? "w-full rounded-xl border border-slate-200 bg-[#F8FAFA] p-3 text-slate-700"
          : "w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm sm:p-4"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id={headingId}
          className="m-0 text-sm font-semibold text-[#134E48] sm:text-base"
        >
          Chi tiết giá
        </h2>
        {collapsible && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="cursor-pointer border-0 bg-transparent text-xs font-semibold text-[#1F7A6E] hover:underline"
          >
            {expanded ? "Thu gọn ▴" : "Xem chi tiết ▾"}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Chi tiết giá theo từng hạng mục
            </caption>
            <thead className="bg-slate-100/70 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="rounded-l-lg px-2.5 py-2 font-medium">
                  Hạng mục
                </th>
                <th
                  scope="col"
                  className="hidden px-2.5 py-2 text-right font-medium sm:table-cell"
                >
                  SL
                </th>
                <th
                  scope="col"
                  className="hidden px-2.5 py-2 text-right font-medium sm:table-cell"
                >
                  Đơn giá
                </th>
                <th
                  scope="col"
                  className="rounded-r-lg px-2.5 py-2 text-right font-medium"
                >
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {activeLines.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-sm text-slate-500"
                  >
                    Chưa có hạng mục nào trong bảng giá.
                  </td>
                </tr>
              ) : (
                activeLines.map((line, index) => (
                  <tr key={`${line.label}-${index}`} className="align-top">
                    <th
                      scope="row"
                      className="px-2.5 py-2 font-normal text-slate-900"
                    >
                      <span className="block break-words">{line.label}</span>
                      <span className="mt-0.5 block text-[13px] text-[#6B7280] sm:hidden">
                        {quantityFormatter.format(line.quantity)} ×{" "}
                        {formatMoney(line.unitAmount)}
                      </span>
                    </th>
                    <td className="hidden px-2.5 py-2 text-right tabular-nums sm:table-cell">
                      {quantityFormatter.format(line.quantity)}
                    </td>
                    <td className="hidden whitespace-nowrap px-2.5 py-2 text-right tabular-nums text-[#6B7280] sm:table-cell">
                      {formatMoney(line.unitAmount)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-right font-medium tabular-nums text-[#134E48]">
                      {formatMoney(line.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!hideTotal && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 font-semibold text-[#134E48]">
          <span>{totalLabel}</span>
          <strong aria-live="polite">{formatMoney(total)}</strong>
        </div>
      )}

      {note ? (
        <p
          style={{ marginTop: 12, marginBottom: 0 }}
          className="rounded-lg border border-[#FDBA74] bg-[#FFF7ED] px-3 py-2 text-[13px] leading-relaxed text-[#7C2D12]"
        >
          ⚠ {note}
        </p>
      ) : null}
    </section>
  );
}
