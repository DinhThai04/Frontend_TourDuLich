import { useId } from "react";

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
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const quantityFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

export default function PriceBreakdown({
  lines,
  total,
  estimated,
  note,
}: PriceBreakdownProps) {
  const headingId = useId();
  const totalLabel = estimated ? "Tổng dự kiến" : "Tổng thanh toán";

  return (
    <section
      aria-labelledby={headingId}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm sm:p-4"
    >
      <h2
        id={headingId}
        className="mb-3 text-base font-semibold text-slate-900"
      >
        Chi tiết giá
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Chi tiết giá theo từng hạng mục
          </caption>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="rounded-l-lg px-3 py-2.5 font-medium">
                Hạng mục
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-right font-medium sm:table-cell"
              >
                SL
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-right font-medium sm:table-cell"
              >
                Đơn giá
              </th>
              <th
                scope="col"
                className="rounded-r-lg px-3 py-2.5 text-right font-medium"
              >
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-sm text-slate-500"
                >
                  Chưa có hạng mục nào trong bảng giá.
                </td>
              </tr>
            ) : (
              lines.map((line, index) => (
                <tr key={`${line.label}-${index}`} className="align-top">
                  <th
                    scope="row"
                    className="px-3 py-2.5 font-normal text-slate-900"
                  >
                    <span className="block break-words">{line.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500 sm:hidden">
                      {quantityFormatter.format(line.quantity)} ×{" "}
                      {currencyFormatter.format(line.unitAmount)}
                    </span>
                  </th>
                  <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">
                    {quantityFormatter.format(line.quantity)}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2.5 text-right tabular-nums sm:table-cell">
                    {currencyFormatter.format(line.unitAmount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums text-slate-900">
                    {currencyFormatter.format(line.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 font-semibold">
        <span>{totalLabel}</span><strong aria-live="polite">{currencyFormatter.format(total)}</strong>
      </div>

      {note ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
          {note}
        </p>
      ) : null}
    </section>
  );
}
