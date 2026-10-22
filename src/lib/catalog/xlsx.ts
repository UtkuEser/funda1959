/**
 * Just enough .xlsx for the product import (D48): read the cell texts of a
 * sheet, and write a simple workbook (the template). No dependency — an .xlsx
 * is a zip of XML files. Server-only.
 *
 * Reading is defensive: size limits before and after unzipping (no zip
 * bombs), no encrypted or Zip64 files, only the parts it needs, text only
 * (formulas are not evaluated: their stored result is read).
 */

import { inflateRawSync } from "node:zlib";

if (typeof window !== "undefined") {
  throw new Error("catalog/xlsx.ts must never be imported on the client");
}

export class XlsxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XlsxError";
  }
}

/* -------------------------------------------------------------------------- */
/* zip                                                                         */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const MAX_PART_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;

/** The named parts of a zip (only those `want` accepts), unzipped within the limits. */
function unzip(buf: Buffer, want: (name: string) => boolean): Map<string, string> {
  // end of central directory: in the last 22 + 65535 bytes
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new XlsxError("Dosya bir Excel (.xlsx) dosyası değil.");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || p === 0xffffffff) throw new XlsxError("Bu Excel dosyası okunamıyor (çok büyük biçim).");

  const out = new Map<string, string>();
  let total = 0;
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new XlsxError("Excel dosyası bozuk.");
    const flags = buf.readUInt16LE(p + 8);
    const method = buf.readUInt16LE(p + 10);
    const compressed = buf.readUInt32LE(p + 20);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (!want(name)) continue;
    if (flags & 0x1) throw new XlsxError("Şifreli Excel dosyası yüklenemez.");
    if (size > MAX_PART_BYTES || (total += size) > MAX_TOTAL_BYTES) throw new XlsxError("Excel dosyası çok büyük.");
    if (local + 30 > buf.length || buf.readUInt32LE(local) !== 0x04034b50) throw new XlsxError("Excel dosyası bozuk.");
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + compressed);
    let raw: Buffer;
    if (method === 0) raw = Buffer.from(data);
    else if (method === 8) {
      try {
        raw = inflateRawSync(data, { maxOutputLength: MAX_PART_BYTES });
      } catch {
        throw new XlsxError("Excel dosyası açılamadı.");
      }
    } else throw new XlsxError("Excel dosyası desteklenmeyen biçimde sıkıştırılmış.");
    out.set(name, raw.toString("utf8"));
  }
  return out;
}

function zip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, "utf8");
    const crc = crc32(f.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12); // 1980-01-01
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(f.data.length, 18);
    local.writeUInt32LE(f.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(f.data.length, 20);
    central.writeUInt32LE(f.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, Buffer.from(f.data));
    centrals.push(central, name);
    offset += 30 + name.length + f.data.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, ...centrals, end]));
}

/* -------------------------------------------------------------------------- */
/* XML text                                                                    */
/* -------------------------------------------------------------------------- */

function decode(s: string): string {
  return s
    .replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (_, e: string) => {
      if (e === "lt") return "<";
      if (e === "gt") return ">";
      if (e === "amp") return "&";
      if (e === "quot") return '"';
      if (e === "apos") return "'";
      const code = e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
    })
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
}

const escapeXml = (s: string) =>
  s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

/** the text of every <t> in a fragment (rich text runs joined; phonetic runs left out) */
function textOf(fragment: string): string {
  const clean = fragment.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
  let out = "";
  for (const m of clean.matchAll(/<t\b[^>]*?(?:\/>|>([\s\S]*?)<\/t>)/g)) out += decode(m[1] ?? "");
  return out;
}

const attr = (attrs: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1] ?? null;

function columnIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** numbers as a person would type them: 780, 1250.5 (no float noise, no exponent) */
function numberText(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return String(Math.round(n * 1e6) / 1e6);
}

export type XlsxSheet = {
  name: string;
  /** rows by their sheet row number (1-based); cells by column (0-based), as text */
  rows: Map<number, string[]>;
};

const MAX_ROWS = 2000;

/** The sheet called `preferred`, else the first one, as cell texts. */
export function readXlsx(bytes: Uint8Array, preferred: string): XlsxSheet {
  const buf = Buffer.from(bytes);
  const meta = unzip(buf, (n) => n === "xl/workbook.xml" || n === "xl/_rels/workbook.xml.rels" || n === "xl/sharedStrings.xml");
  const workbook = meta.get("xl/workbook.xml");
  const rels = meta.get("xl/_rels/workbook.xml.rels");
  if (!workbook || !rels) throw new XlsxError("Dosya bir Excel (.xlsx) dosyası değil.");

  const sheets = [...workbook.matchAll(/<sheet\b([^>]*?)\/?>/g)].map((m) => ({ name: decode(attr(m[1], "name") ?? ""), rid: attr(m[1], "r:id") }));
  if (sheets.length === 0) throw new XlsxError("Excel dosyasında sayfa yok.");
  const sheet = sheets.find((s) => s.name.trim().toLocaleLowerCase("tr") === preferred.toLocaleLowerCase("tr")) ?? sheets[0];
  const rel = [...rels.matchAll(/<Relationship\b([^>]*?)\/?>/g)].map((m) => ({ id: attr(m[1], "Id"), target: attr(m[1], "Target") })).find((r) => r.id === sheet.rid);
  if (!rel?.target) throw new XlsxError("Excel sayfası bulunamadı.");
  const path = rel.target.startsWith("/") ? rel.target.slice(1) : `xl/${rel.target.replace(/^\.\//, "")}`;

  const sheetXml = unzip(buf, (n) => n === path).get(path);
  if (!sheetXml) throw new XlsxError("Excel sayfası okunamadı.");

  const shared = meta.get("xl/sharedStrings.xml");
  const strings = shared ? [...shared.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1])) : [];

  const rows = new Map<number, string[]>();
  let rowCounter = 0;
  for (const rm of sheetXml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    rowCounter = Number(attr(rm[1], "r")) || rowCounter + 1;
    if (rows.size >= MAX_ROWS) throw new XlsxError(`Excel dosyasında en fazla ${MAX_ROWS} satır olabilir.`);
    const cells: string[] = [];
    let col = -1;
    for (const cm of (rm[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attr(cm[1], "r");
      col = ref ? columnIndex(ref) : col + 1;
      if (col < 0 || col > 200) continue;
      const type = attr(cm[1], "t");
      const inner = cm[2] ?? "";
      const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let text = "";
      if (type === "s") text = strings[Number(v)] ?? "";
      else if (type === "inlineStr") text = textOf(inner);
      else if (type === "str" || type === "e") text = decode(v ?? "");
      else if (type === "b") text = v === "1" ? "TRUE" : v === "0" ? "FALSE" : "";
      else text = v !== undefined ? numberText(decode(v)) : "";
      cells[col] = text;
    }
    rows.set(rowCounter, Array.from(cells, (c) => c ?? ""));
  }
  return { name: sheet.name, rows };
}

/* -------------------------------------------------------------------------- */
/* writing                                                                     */
/* -------------------------------------------------------------------------- */

export type SheetToWrite = {
  name: string;
  rows: (string | number | null)[][];
  /** column widths in characters */
  widths?: number[];
  /** bold header row, frozen while scrolling */
  header?: boolean;
};

const colName = (i: number) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

function sheetXml(sheet: SheetToWrite): string {
  const cols = sheet.widths?.length
    ? `<cols>${sheet.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const views = sheet.header
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : "";
  const rows = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((v, c) => {
          if (v === null || v === "") return "";
          const ref = `${colName(c)}${r + 1}`;
          const style = sheet.header && r === 0 ? ' s="1"' : "";
          return typeof v === "number"
            ? `<c r="${ref}"${style}><v>${v}</v></c>`
            : `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(v)}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${views}${cols}<sheetData>${rows}</sheetData></worksheet>`;
}

export function writeXlsx(sheets: SheetToWrite[]): Uint8Array {
  const enc = (s: string) => new TextEncoder().encode(s);
  const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
  const files = [
    {
      name: "[Content_Types].xml",
      data: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
          .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
          .join("")}</Types>`,
      ),
    },
    {
      name: "_rels/.rels",
      data: enc(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      ),
    },
    {
      name: "xl/workbook.xml",
      data: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook ${ns} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
          .map((s, i) => `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
          .join("")}</sheets></workbook>`,
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
          .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
          .join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      ),
    },
    {
      name: "xl/styles.xml",
      data: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet ${ns}><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`,
      ),
    },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: enc(sheetXml(s)) })),
  ];
  return zip(files);
}
