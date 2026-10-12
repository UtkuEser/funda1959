"use client";

import { useState } from "react";
import { formatTL } from "@/lib/cart-utils";
import { dayTime } from "@/lib/admin/format";
import { describeFeeState, type ZoneFeeRecord } from "@/lib/delivery/fees";
import { DeliveryFeeEditor } from "./DeliveryFeeEditor";
import { Badge, EmptyRow, Panel, Row, Table, TableWrap, Td, Th } from "./ui";

export type ZoneFeeRow = {
  id: string;
  name: string;
  branchName: string;
  district: string;
  neighborhoods: string[];
  active: boolean;
  /** the stored row (null = none: "Belirlenmedi") */
  fee: ZoneFeeRecord | null;
};

const at = (r: ZoneFeeRecord | null | undefined) => (r?.updatedAt ? Date.parse(r.updatedAt) : Number.NEGATIVE_INFINITY);

/**
 * Admin "Teslimat Bölgeleri" table (SUPABASE_PLAN.md, D15). The server sends
 * the rows as data; a save updates its row from the row the database returned
 * (checked by the editor), so the screen is current without a route refresh.
 * Of the server's row and the saved one, the newer is shown — a later visit
 * never brings an older value back.
 */
export function ZoneFeesTable({ rows, readable, canEdit }: { rows: ZoneFeeRow[]; readable: boolean; canEdit: boolean }) {
  const [saved, setSaved] = useState<Record<string, ZoneFeeRecord>>({});

  return (
    <Panel>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Bölge</Th>
              <Th>Şube</Th>
              <Th>İlçe</Th>
              <Th>Mahalleler</Th>
              <Th align="right">Teslimat Ücreti</Th>
              <Th>Son Değişiklik</Th>
              <Th>Durum</Th>
              {canEdit && <Th>Düzenle</Th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={canEdit ? 8 : 7}>Tanımlı bölge yok.</EmptyRow>}
            {rows.map((z) => {
              const f = at(saved[z.id]) > at(z.fee) ? saved[z.id] : z.fee;
              const state = f?.state ?? "unset";
              const extra = z.neighborhoods.length - 2;
              return (
                <Row key={z.id}>
                  <Td className="font-medium">{z.name}</Td>
                  <Td>{z.branchName}</Td>
                  <Td>{z.district}</Td>
                  <Td>
                    <span title={z.neighborhoods.join(", ")}>
                      {z.neighborhoods.slice(0, 2).join(", ")}
                      {extra > 0 && <span className="text-neutral-400"> +{extra}</span>}
                    </span>
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {!readable ? "—" : state === "paid" && f?.fee != null ? formatTL(f.fee) : <Badge strong={state === "free"}>{describeFeeState(state)}</Badge>}
                  </Td>
                  <Td className="text-[12px] text-neutral-500">
                    {f?.updatedBy ? `${f.updatedBy} · ${f.updatedAt ? dayTime(f.updatedAt) : ""}` : "—"}
                  </Td>
                  <Td>
                    <Badge strong={z.active}>{z.active ? "Aktif" : "Pasif"}</Badge>
                  </Td>
                  {canEdit && (
                    <Td>
                      <DeliveryFeeEditor
                        zoneId={z.id}
                        state={state}
                        fee={f?.fee ?? null}
                        updatedAt={f?.updatedAt ?? null}
                        onSaved={(row) => setSaved((s) => ({ ...s, [row.zoneId]: row }))}
                      />
                    </Td>
                  )}
                </Row>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>
    </Panel>
  );
}
