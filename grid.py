"""
grid.py — combined grid / master-schedule view (vendors across the top,
time down the side, colour-coded by class), mirroring the "manual
spreadsheet" style master schedule.

Not wired into anything yet — moved here as-is from the old
scheduler_core.py. Roadmap step 4: revisit once the solver + DB
reconnection is solid.
"""

from models import minutes_to_clock

PALETTE = [
    "#F28C8C", "#F2C68C", "#F2EA8C", "#B7E28C", "#8CE2B0",
    "#8CDDE2", "#8CB0E2", "#A98CE2", "#E28CDD", "#E28CA9",
    "#D9A066", "#8CE2C6", "#C6E28C", "#8C9EE2", "#E2C68C",
    "#B98CE2", "#8CE28C", "#E28C8C", "#8CC6E2", "#E2A98C",
]


def assign_colors(classes):
    """Stable class_id -> hex color mapping, cycling the palette if needed."""
    color_map = {}
    for i, c in enumerate(classes):
        color_map[c.id] = PALETTE[i % len(PALETTE)]
    return color_map


def build_combined_grid(classes, by_class, vendors, step=5):
    """Bucket every class's schedule into a shared time grid.

    Returns None if there's nothing to show, otherwise a dict with:
      times: sorted list of minute marks
      vendor_names: ordered vendor names (grid columns)
      cell_text: {time: {vendor_name: [entries]}}
      break_text: {time: [entries]}   (recess/lunch, shown in its own column)
    """
    all_times = [t for c in classes for (start, end, _, _) in by_class.get(c.id, []) for t in (start, end)]
    if not all_times:
        return None

    t0, t1 = min(all_times), max(all_times)
    times = list(range(t0, t1, step))
    vendor_names = [v.name for v in vendors]

    cell_text = {t: {name: [] for name in vendor_names} for t in times}
    break_text = {t: [] for t in times}

    for c in classes:
        for start, end, label, kind in by_class.get(c.id, []):
            for t in times:
                if start <= t < end:
                    if kind == "workshop" and label in cell_text[t]:
                        cell_text[t][label].append(f"{c.id} ({c.capacity})")
                    elif kind in ("recess", "lunch"):
                        break_text[t].append(f"{c.id}: {label}")

    return dict(times=times, vendor_names=vendor_names, cell_text=cell_text, break_text=break_text)


def render_combined_grid_html(grid, color_map, row_height_px=20):
    """Render the combined grid as a self-contained scrollable HTML table."""
    times = grid["times"]
    vendor_names = grid["vendor_names"]

    header_cells = "".join(
        f"<th style='position:sticky; top:0; background:#f5f5f5; padding:3px 6px; "
        f"border:1px solid #ddd; white-space:nowrap; font-size:11px;'>{name}</th>"
        for name in vendor_names
    )
    html = [
        "<div style='overflow:auto; max-height:720px; border:1px solid #ccc; font-family:sans-serif;'>",
        "<table style='border-collapse:collapse; width:100%;'>",
        f"<tr><th style='position:sticky; top:0; left:0; background:#f5f5f5; padding:3px 6px; "
        f"border:1px solid #ddd; font-size:11px;'>Time</th>{header_cells}"
        f"<th style='position:sticky; top:0; background:#f5f5f5; padding:3px 6px; border:1px solid #ddd; font-size:11px;'>Break</th></tr>",
    ]

    for t in times:
        row = [
            f"<tr style='height:{row_height_px}px;'>"
            f"<td style='padding:2px 6px; border:1px solid #eee; font-weight:bold; "
            f"background:#fafafa; font-size:10px; white-space:nowrap;'>{minutes_to_clock(t)}</td>"
        ]
        for name in vendor_names:
            entries = grid["cell_text"][t][name]
            if entries:
                primary_id = entries[0].split()[0]
                color = color_map.get(primary_id, "#dddddd")
                text = " / ".join(entries)
            else:
                color, text = "#ffffff", ""
            row.append(
                f"<td style='padding:2px 6px; border:1px solid #eee; background:{color}; "
                f"font-size:10px; white-space:nowrap;'>{text}</td>"
            )
        entries = grid["break_text"][t]
        if entries:
            color, text_color, text = "#b23b3b", "#ffffff", ", ".join(entries)
        else:
            color, text_color, text = "#ffffff", "#000000", ""
        row.append(
            f"<td style='padding:2px 6px; border:1px solid #eee; background:{color}; "
            f"color:{text_color}; font-size:10px; white-space:nowrap;'>{text}</td></tr>"
        )
        html.append("".join(row))

    html.append("</table></div>")
    return "".join(html)
