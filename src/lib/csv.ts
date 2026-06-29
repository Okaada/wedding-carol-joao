const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

function neutralize(val: string): string {
  if (val.length === 0) return val;
  if (FORMULA_TRIGGERS.includes(val[0]!)) return `'${val}`;
  return val;
}

export function toCsv(headers: string[], rows: string[][]): string {
  const escape = (raw: string) => {
    const val = neutralize(raw);
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];
  return lines.join("\n");
}
