"use client";

import React from "react";

export default function RulesGuide() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Legal Metrology (Packaged Commodities) Rules, 2011
          </h2>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
            Statutory Handbook
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Enforced by the Directorate of Legal Metrology, Department of Consumer Affairs, Government of India.
        </p>
      </div>

      {/* Rule Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Rule 6 */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#0c121e]/85 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="text-sm font-black text-white">
              Rule 6: Mandatory Declarations
            </h3>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Statutory
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Every package shall bear thereon the following declarations:
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>(a)</strong> Name and address of the manufacturer, packer or importer.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>(b)</strong> Generic or common name of the commodity contained.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>(c)</strong> Net quantity in terms of standard unit of weight or measure.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>(d)</strong> Month and year of manufacture, packing or import.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>(e)</strong> Maximum Retail Price (MRP) inclusive of all taxes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>(f)</strong> Consumer Care telephone number and email address.</span>
            </li>
          </ul>
        </div>

        {/* Rule 9 */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#0c121e]/85 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="text-sm font-black text-white">
              Rule 9: Minimum Font Height Table
            </h3>
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-300">
              Dimensional
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Minimum height of numerals and letters for declarations:
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08]">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/50 text-slate-400">
                <tr>
                  <th className="p-2.5">Net Quantity</th>
                  <th className="p-2.5">Normal Blow / Sheet</th>
                  <th className="p-2.5">Embossed / Molded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-300">
                <tr>
                  <td className="p-2.5">Up to 50g / 50ml</td>
                  <td className="p-2.5 font-bold text-emerald-400">1.0 mm</td>
                  <td className="p-2.5">2.0 mm</td>
                </tr>
                <tr>
                  <td className="p-2.5">50g to 200g</td>
                  <td className="p-2.5 font-bold text-emerald-400">2.0 mm</td>
                  <td className="p-2.5">4.0 mm</td>
                </tr>
                <tr>
                  <td className="p-2.5">200g to 1 kg</td>
                  <td className="p-2.5 font-bold text-orange-400">4.0 mm</td>
                  <td className="p-2.5">6.0 mm</td>
                </tr>
                <tr>
                  <td className="p-2.5">More than 1 kg</td>
                  <td className="p-2.5 font-bold text-red-400">6.0 mm</td>
                  <td className="p-2.5">9.0 mm</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

