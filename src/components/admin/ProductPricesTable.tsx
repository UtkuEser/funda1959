"use client";

import { useState } from "react";
import { formatTL } from "@/lib/cart-utils";
import { dayTime } from "@/lib/admin/format";
import { priceKey, type ProductPriceRecord } from "@/lib/pricing/prices";
import { ProductPriceEditor } from "./ProductPriceEditor";
import { Badge, Panel, Row, Table, TableWrap, Td, Th } from "./ui";

export type ProductPriceRow = {
  productId: string;
  /** the size id, or '' for a product with a single price */
  variantKey: string;
  name: string;
  /** "8–10 Kişilik" … for a size, null for a single price */
  size: string | null;
  category: string;
  /** " / adet" … written after the amount in the catalog ('' for sizes) */
  unit: string;
  catalogPrice: number;
  /** struck-through "old price" of this product or size (D18, D21), shown while above the price */
  oldPrice: string | null;
  /** Merkez's stored price in effect */
  stored: ProductPriceRecord | null;
};

const at = (r: ProductPriceRecord | null | undefined) => (r?.updatedAt ? Date.parse(r.updatedAt) : Number.NEGATIVE_INFINITY);

/**
 * Admin "Fiyatlar" table (SUPABASE_PLAN.md, D5, D20). One row per price: the
 * single price of a product, or each size of a product with sizes — every
 * size is saved on its own. The server sends the rows as data; a save updates
 * its row from the row the database returned (checked by the editor), so the
 * screen is current without a route refresh. Of the server's row and the
 * saved one, the newer is shown.
 */
export function ProductPricesTable({ rows, readable, canEdit }: { rows: ProductPriceRow[]; readable: boolean; canEdit: boolean }) {
  const [saved, setSaved] = useState<Record<string, ProductPriceRecord>>({});

  return (
    <Panel>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Ürün</Th>
              <Th>Boyut</Th>
              <Th>Kategori</Th>
              <Th align="right">Katalog Fiyatı</Th>
              <Th align="right">Güncel Fiyat</Th>
              <Th>Son Değişiklik</Th>
              <Th>Durum</Th>
              {canEdit && <Th>Düzenle</Th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const key = priceKey(p.productId, p.variantKey);
              const stored = at(saved[key]) > at(p.stored) ? saved[key] : p.stored;
              const current = stored?.price ?? p.catalogPrice;
              return (
                <Row key={key}>
                  <Td className="font-medium">{p.name}</Td>
                  <Td>{p.size ?? <span className="text-neutral-400">—</span>}</Td>
                  <Td>{p.category}</Td>
                  <Td align="right" className="tabular-nums">
                    {`${formatTL(p.catalogPrice)}${p.unit}`}
                    {p.oldPrice && <span className="ml-1 text-neutral-400 line-through">{p.oldPrice}</span>}
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {readable ? `${formatTL(current)}${p.unit}` : "—"}
                  </Td>
                  <Td className="text-[12px] text-neutral-500">
                    {stored?.updatedBy ? `${stored.updatedBy} · ${stored.updatedAt ? dayTime(stored.updatedAt) : ""}` : stored ? "—" : "Katalog fiyatı"}
                  </Td>
                  <Td>
                    <Badge strong={Boolean(stored)}>{stored ? "Merkez fiyatı" : "Katalog fiyatı"}</Badge>
                  </Td>
                  {canEdit && (
                    <Td>
                      <ProductPriceEditor
                        productId={p.productId}
                        variantKey={p.variantKey}
                        price={current}
                        unit={p.unit}
                        updatedAt={stored?.updatedAt ?? null}
                        onSaved={(row) => setSaved((s) => ({ ...s, [priceKey(row.productId, row.variantKey)]: row }))}
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
