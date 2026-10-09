"""Local-only inventory and bounded extraction. Never copies sources to public assets."""
import argparse
import csv
import hashlib
import io
import json
import posixpath
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path, PurePosixPath
import zipfile
import xml.etree.ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def archive_info(path):
    with zipfile.ZipFile(path) as archive:
        members = [m for m in archive.infolist() if not m.is_dir()]
        unsafe = [m.filename for m in members if ".." in PurePosixPath(m.filename.replace("\\", "/")).parts
                  or m.filename.startswith(("/", "\\")) or ":" in m.filename]
        return {"members": len(members), "uncompressedBytes": sum(m.file_size for m in members),
                "types": dict(Counter(PurePosixPath(m.filename).suffix.lower() for m in members)),
                "unsafeMembers": unsafe[:20], "examples": [m.filename for m in members[:5]],
                "status": "inspected-not-extracted"}


def xml_read(archive, name):
    info = archive.getinfo(name)
    if info.file_size > 8 * 1024 * 1024:
        raise ValueError("XML part exceeds bounded read size")
    return ET.fromstring(archive.read(name))


def decode_text(path):
    raw = path.read_bytes()
    for encoding in ("utf-8-sig", "utf-16", "gb18030"):
        try:
            return raw.decode(encoding)
        except UnicodeError:
            pass
    raise ValueError("Text encoding requires manual check")


def extract(path, limit=8):
    ext = path.suffix.lower()
    sections = []
    total = 0
    if ext == ".pdf":
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        total = len(reader.pages)
        for i in range(min(total, limit)):
            text = reader.pages[i].extract_text() or ""
            sections.append({"locator": f"PDF 第 {i+1} 页", "text": text[:18000],
                             "status": "extracted" if text.strip() else "needs-ocr"})
    elif ext in (".pptx", ".docx", ".xlsx"):
        with zipfile.ZipFile(path) as archive:
            if ext == ".pptx":
                names = sorted((n for n in archive.namelist() if n.startswith("ppt/slides/slide")
                                and n.endswith(".xml") and "/_rels/" not in n),
                               key=lambda n: int(Path(n).stem.replace("slide", "")))
                total = len(names)
                for i, name in enumerate(names[:limit]):
                    root = xml_read(archive, name)
                    paragraphs = ["".join(t.text or "" for t in p.findall(".//a:t", NS))
                                  for p in root.findall(".//a:p", NS)]
                    sections.append({"locator": f"幻灯片 {i+1}", "text": "\n".join(paragraphs)[:18000],
                                     "status": "text-layer-only"})
            elif ext == ".docx":
                root = xml_read(archive, "word/document.xml")
                paragraphs = root.findall(".//w:p", NS)
                total = len(paragraphs)
                for i, paragraph in enumerate(paragraphs[:120]):
                    text = "".join(t.text or "" for t in paragraph.findall(".//w:t", NS))
                    if text.strip():
                        sections.append({"locator": f"段落 {i+1}", "text": text[:8000], "status": "extracted"})
            else:
                shared = []
                if "xl/sharedStrings.xml" in archive.namelist():
                    shared = ["".join(t.text or "" for t in si.findall(".//s:t", NS))
                              for si in xml_read(archive, "xl/sharedStrings.xml").findall("s:si", NS)]
                workbook = xml_read(archive, "xl/workbook.xml")
                relationships = xml_read(archive, "xl/_rels/workbook.xml.rels")
                targets = {r.attrib["Id"]: r.attrib["Target"] for r in relationships}
                sheets = []
                for sheet in workbook.findall("s:sheets/s:sheet", NS):
                    target = targets[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
                    name = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
                    if not name.startswith("xl/worksheets/"):
                        raise ValueError("Unexpected worksheet relationship")
                    sheets.append((sheet.attrib.get("name", ""), name))
                total = len(sheets)
                for label, name in sheets[:3]:
                    for row in xml_read(archive, name).findall("s:sheetData/s:row", NS)[:25]:
                        cells = []
                        for cell in row.findall("s:c", NS):
                            v = cell.find("s:v", NS)
                            value = v.text if v is not None else ""
                            if cell.attrib.get("t") == "s" and value:
                                value = shared[int(value)]
                            elif cell.attrib.get("t") == "inlineStr":
                                value = "".join(t.text or "" for t in cell.findall(".//s:t", NS))
                            if value:
                                cells.append(f"{cell.attrib.get('r')}: {value}")
                        if cells:
                            sections.append({"locator": f"工作表 {label}，行 {row.attrib.get('r')}",
                                             "text": " | ".join(cells)[:8000], "status": "extracted"})
    elif ext in (".md", ".txt", ".csv"):
        if path.stat().st_size > 2 * 1024 * 1024:
            raise ValueError("Large text needs explicit pagination")
        lines = decode_text(path).splitlines()
        total = len(lines)
        for start in range(0, min(total, 240), 40):
            sections.append({"locator": f"行 {start+1}–{min(start+40,total)}", "text": "\n".join(lines[start:start+40]),
                             "status": "extracted"})
    elif ext in (".png", ".jpg", ".jpeg"):
        total = 1
        sections.append({"locator": "图片 1", "text": "", "status": "visual-review-required"})
    else:
        raise ValueError("Unsupported sample format")
    return {"path": str(path), "sha256": digest(path), "totalUnits": total, "sections": sections,
            "scope": "bounded sample; not a full-document absorption"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", action="append", required=True)
    parser.add_argument("--sample", action="append", default=[])
    parser.add_argument("--out", default="private-study")
    parser.add_argument("--unit-limit", type=int, default=8)
    args = parser.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    records, root_summary = [], []
    for raw in args.root:
        root = Path(raw)
        files = sorted(root.rglob("*")) if root.is_dir() else [root] if root.is_file() else []
        files = [p for p in files if p.is_file()]
        root_summary.append({"path": str(root), "exists": root.exists(), "files": len(files),
                             "bytes": sum(p.stat().st_size for p in files)})
        for path in files:
            record = {"path": str(path), "root": str(root), "bytes": path.stat().st_size,
                      "extension": path.suffix.lower(), "status": "inventory-only"}
            try:
                record["sha256"] = digest(path)
                if path.suffix.lower() == ".zip":
                    record["archive"] = archive_info(path)
            except Exception as error:
                record.update(status="unreadable", error=str(error))
            records.append(record)
    groups = defaultdict(list)
    for record in records:
        if record.get("sha256"):
            groups[record["sha256"]].append(record["path"])
    duplicates = [{"sha256": key, "paths": list(dict.fromkeys(value))} for key, value in groups.items()
                  if len(set(value)) > 1]
    originals = [r for r in records if r["root"] == args.root[0]]
    raw_hashes = Counter(r.get("sha256") for r in originals if r.get("sha256"))
    raw_duplicates = sum(n-1 for n in raw_hashes.values())
    inventory = {"generated": datetime.now().astimezone().isoformat(), "roots": root_summary,
                 "files": records, "duplicates": duplicates,
                 "originalSummary": {"files": len(originals), "uniqueContents": len(raw_hashes),
                                     "duplicateCopies": raw_duplicates,
                                     "formats": dict(Counter(r["extension"] for r in originals))}}
    (out / "inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8")
    report = ["# Wordly 资料清点与样本范围", "", "清点可访问不等于已吸收内容。ZIP 只检查目录，未解压。", "", "## 目录", ""]
    report += [f"- {r['path']}：{r['files']} 个文件，存在={r['exists']}" for r in root_summary]
    report += ["", f"原始资料：{len(originals)} 个文件，{len(raw_hashes)} 份不同内容，{raw_duplicates} 个完全相同副本。",
               "", "## 完全相同的文件（SHA-256）", ""]
    for group in duplicates:
        report.append("- " + "；".join(group["paths"]))
    report += ["", "## ZIP 检查", ""]
    for r in originals:
        if "archive" in r:
            a = r["archive"]
            report.append(f"- {r['path']}：{a['members']} 项，解压后约 {a['uncompressedBytes']/1024/1024:.1f} MB；类型 {a['types']}；危险路径 {len(a['unsafeMembers'])} 项。未提取。")
    (out / "inventory.md").write_text("\n".join(report), encoding="utf-8")
    extracted = []
    for raw in args.sample:
        path = Path(raw)
        try:
            extracted.append(extract(path, min(40, max(1, args.unit_limit))))
        except Exception as error:
            extracted.append({"path": str(path), "error": str(error)})
    (out / "sample-extracted.json").write_text(json.dumps(extracted, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"original": inventory["originalSummary"], "allInventoried": len(records),
                      "duplicateGroups": len(duplicates), "sampleFiles": len(extracted),
                      "sampleErrors": [e for e in extracted if "error" in e]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
