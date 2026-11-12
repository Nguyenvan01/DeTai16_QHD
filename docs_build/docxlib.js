// Thư viện nhỏ dựng báo cáo Word theo chuẩn trình bày đồ án (A4, Times New Roman 13)
const fs = require("fs");
const path = require("path");
const d = require("docx");
const {
  Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel,
  WidthType, ShadingType, BorderStyle, LevelFormat, PageBreak, Footer, PageNumber,
  TableOfContents, VerticalAlign,
} = d;

const FONT = "Times New Roman";
const MONO = "Consolas";
const SIZE = 26; // 13pt
const ROOT = path.resolve(__dirname, "..");
let figNo = {}, tabNo = {};

function pngSize(p) {
  const b = fs.readFileSync(p);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// **đậm**, *nghiêng*, `code`
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith("**")) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else if (t.startsWith("`")) out.push(new TextRun({ text: t.slice(1, -1), font: MONO, size: 22, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}

const B = {
  chapter: (t) => [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun(t.toUpperCase())] }),
  ],
  h1nobreak: (t) => [new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun(t.toUpperCase())] })],
  h2: (t) => [new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] })],
  h3: (t) => [new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] })],
  p: (t) => [new Paragraph({ children: runs(t), alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 567 } })],
  pn: (t) => [new Paragraph({ children: runs(t), alignment: AlignmentType.JUSTIFIED })],
  bullets: (items, level = 0) => items.map((t) => new Paragraph({
    numbering: { reference: "bul", level }, alignment: AlignmentType.JUSTIFIED, children: runs(t),
  })),
  nums: (items, ref = "num1") => items.map((t) => new Paragraph({
    numbering: { reference: ref, level: 0 }, alignment: AlignmentType.JUSTIFIED, children: runs(t),
  })),
  formula: (t) => [new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 },
    children: [new TextRun({ text: t, italics: false, font: "Cambria Math", size: 26 })],
  })],
  formulas: (lines) => lines.map((t) => new Paragraph({
    alignment: AlignmentType.LEFT, indent: { left: 1134 }, spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: t, font: "Cambria Math", size: 25 })],
  })),
  code: (src, caption) => {
    const lines = src.replace(/\n$/, "").split("\n");
    const paras = lines.map((ln) => new Paragraph({
      spacing: { before: 0, after: 0, line: 240, lineRule: d.LineRuleType.AUTO },
      children: [new TextRun({ text: ln.length ? ln : " ", font: MONO, size: 17 })],
    }));
    const cell = new TableCell({
      width: { size: 9070, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: "F4F3EF", color: "auto" },
      margins: { top: 100, bottom: 100, left: 160, right: 120 },
      children: paras,
    });
    const border = { style: BorderStyle.SINGLE, size: 4, color: "C9C8C2" };
    const tbl = new Table({
      width: { size: 9070, type: WidthType.DXA }, columnWidths: [9070],
      borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
      rows: [new TableRow({ children: [cell] })],
    });
    const out = [tbl];
    if (caption) out.push(B._caption("Đoạn mã", caption, figNo));
    else out.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
    return out;
  },
  _caption: (kind, text, counter) => {
    const ch = B._chap;
    counter[ch] = (counter[ch] || 0) + 1;
    return new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 60, after: 180 },
      children: [new TextRun({ text: `${kind} ${ch}.${counter[ch]}. `, bold: true, italics: true, size: 24 }),
        new TextRun({ text, italics: true, size: 24 })],
    });
  },
  _chap: 0,
  setChap: (n) => { B._chap = n; return []; },
  img: (rel, widthCm, caption) => {
    const p = path.join(ROOT, rel);
    const { w, h } = pngSize(p);
    const wpx = widthCm * 37.8;
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 120, after: 0, line: 240, lineRule: d.LineRuleType.AUTO }, keepNext: true,
        children: [new ImageRun({ type: "png", data: fs.readFileSync(p), transformation: { width: wpx, height: wpx * h / w } })],
      }),
      B._caption("Hình", caption, figNo),
    ];
  },
  table: (rows, widths, caption, opts = {}) => {
    const total = widths.reduce((a, b) => a + b, 0);
    const border = { style: BorderStyle.SINGLE, size: 4, color: "8A8984" };
    const trs = rows.map((r, ri) => new TableRow({
      tableHeader: ri === 0,
      children: r.map((c, ci) => new TableCell({
        width: { size: widths[ci], type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        shading: ri === 0 ? { type: ShadingType.CLEAR, fill: "DCE8F7", color: "auto" } : undefined,
        margins: { top: 50, bottom: 50, left: 90, right: 90 },
        children: [new Paragraph({
          alignment: (ri === 0 || (opts.center && opts.center.includes(ci))) ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 0, after: 0, line: 276 },
          children: runs(String(c), { size: opts.size || 23, bold: ri === 0 ? true : undefined }),
        })],
      })),
    }));
    const out = [];
    if (caption) out.push(B._caption("Bảng", caption, tabNo));
    out.push(new Table({
      width: { size: total, type: WidthType.DXA }, columnWidths: widths, alignment: AlignmentType.CENTER,
      borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
      rows: trs,
    }));
    out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    return out;
  },
  center: (t, opts = {}) => [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: opts.before || 0, after: opts.after || 0 },
    children: [new TextRun({ text: t, bold: opts.bold, size: opts.size || SIZE, italics: opts.italics })] })],
  blank: (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [] })),
  pagebreak: () => [new Paragraph({ children: [new PageBreak()] })],
  toc: () => [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "MỤC LỤC", bold: true, size: 30 })] }),
    new TableOfContents("Mục lục", { hyperlink: true, headingStyleRange: "1-3" })],
};

function buildDoc(cover, body) {
  return new d.Document({
    creator: "Nguyễn Hữu Văn",
    title: "Đề tài 16 - Quy hoạch động nâng cao",
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: FONT, size: SIZE }, paragraph: { spacing: { line: 336, lineRule: d.LineRuleType.AUTO, before: 0, after: 100 } } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 30, bold: true, font: FONT, color: "000000" }, paragraph: { spacing: { before: 240, after: 300 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 27, bold: true, font: FONT, color: "000000" }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1, keepNext: true } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, italics: true, font: FONT, color: "000000" }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2, keepNext: true } },
      ],
    },
    numbering: {
      config: [
        { reference: "bul", levels: [
          { level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 300 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "+", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1200, hanging: 300 } } } }] },
        ...[1, 2, 3, 4, 5, 6, 7, 8].map((k) => ({ reference: `num${k}`, levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] })),
        { reference: "ref", levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "[%1]", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 600, hanging: 600 } } } }] },
      ],
    },
    sections: [
      { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 } } },
        children: cover },
      { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 }, pageNumbers: { start: 1 } } },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 22 })] })] }) },
        children: body },
    ],
  });
}

module.exports = { B, buildDoc, runs, d };
