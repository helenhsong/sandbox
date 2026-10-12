import { useEffect, useMemo, useRef, useState } from "react";
import { LANES, LANE_LABEL, TODAY, TYPE_LABEL, formatDay, type Item } from "./data";
import { chainOf, type Schedule } from "./schedule";

const RANGE_START = -20;
const MIN_DAY_WIDTH = 13;
const AXIS_HEIGHT = 60;
const LANE_HEIGHT = 36;
const ROW_HEIGHT = 34;
const INSET = 4;
const LABEL_ROOM = 250;

interface Props {
  schedule: Schedule;
  visible: Item[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function Timeline({ schedule, visible, selectedId, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const positioned = useRef(false);
  const [width, setWidth] = useState(1000);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const rangeEnd = Math.max(45, Math.ceil((schedule.finishDay + 8) / 5) * 5);
  const days = rangeEnd - RANGE_START;
  const dayWidth = Math.max(MIN_DAY_WIDTH, Math.floor((width / days) * 10) / 10);
  const canvasWidth = days * dayWidth;
  const x = (day: number) => (day - RANGE_START) * dayWidth;

  // Start with today a quarter of the way in when the canvas overflows.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node || positioned.current || width === 1000) return;
    positioned.current = true;
    node.scrollLeft = Math.max(0, (TODAY - RANGE_START) * dayWidth - width * 0.25);
  }, [width, dayWidth]);

  // Keep the selected item in view once the drawer has taken its space.
  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollRef.current
        ?.querySelector(`[data-item="${selectedId}"]`)
        ?.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
    }, 260);
    return () => window.clearTimeout(timer);
  }, [selectedId]);

  const { lanes, rowTop, height } = useMemo(() => {
    const rowTop = new Map<string, number>();
    const lanes: { type: Item["type"]; top: number; count: number }[] = [];
    let y = AXIS_HEIGHT;
    for (const type of LANES) {
      const rows = visible.filter((item) => item.type === type);
      if (rows.length === 0) continue;
      lanes.push({ type, top: y, count: rows.length });
      y += LANE_HEIGHT;
      for (const item of rows) {
        rowTop.set(item.id, y);
        y += ROW_HEIGHT;
      }
      y += 8;
    }
    return { lanes, rowTop, height: y + 8 };
  }, [visible]);

  const chain = useMemo(() => (selectedId ? chainOf(schedule, selectedId) : null), [schedule, selectedId]);

  const weeks: number[] = [];
  for (let day = RANGE_START; day < rangeEnd; day += 5) weeks.push(day);

  const outX = (item: Item) => {
    const computed = schedule.byId.get(item.id)!;
    return item.type === "inspection" ? x(computed.start) + dayWidth / 2 + 7 : x(computed.end) - INSET;
  };
  const inX = (item: Item) => {
    const computed = schedule.byId.get(item.id)!;
    return item.type === "inspection" ? x(computed.start) + dayWidth / 2 - 7 : x(computed.start) + INSET;
  };

  const edges = visible.flatMap((to) =>
    to.dependsOn.flatMap((fromId) => {
      const from = schedule.itemById.get(fromId);
      if (!from || !rowTop.has(fromId)) return [];
      const a = schedule.byId.get(from.id)!;
      const b = schedule.byId.get(to.id)!;
      const y1 = rowTop.get(from.id)! + ROW_HEIGHT / 2;
      const y2 = rowTop.get(to.id)! + ROW_HEIGHT / 2;
      const x1 = outX(from);
      const x2 = inX(to);
      const turn = Math.max(x1, Math.min(x(a.end), x2 - 3));
      const blocked = b.blockedBy.length > 0 && (a.blockedBy.length > 0 || b.blockedBy.includes(from.id));
      const classes = ["tl-edge"];
      if (a.complete && b.complete) classes.push("is-done");
      if (blocked) classes.push("is-blocked");
      else if (a.critical && b.critical) classes.push("is-critical");
      if (chain) classes.push(chain.has(from.id) && chain.has(to.id) ? "is-chain" : "is-faded");
      return [
        <path key={`${from.id}>${to.id}`} className={classes.join(" ")} d={`M${x1} ${y1}H${turn}V${y2}H${x2}`} />,
      ];
    }),
  );

  // Re-fades the connectors after bars finish sliding to new dates.
  const layoutKey = visible.map((item) => `${item.id}:${schedule.byId.get(item.id)!.start}`).join("|");

  return (
    <div className="tl-scroll" ref={scrollRef}>
      <div className="tl-canvas" style={{ width: canvasWidth, height }}>
        {weeks.map((day) => (
          <div key={day} className="tl-week" style={{ left: x(day), width: dayWidth * 5 }}>
            <span>{formatDay(day)}</span>
          </div>
        ))}
        {lanes.map((lane) => (
          <div key={lane.type} className="tl-lane" style={{ top: lane.top, height: LANE_HEIGHT }}>
            <span className="tl-lane-name">
              {LANE_LABEL[lane.type]} <span className="muted">{lane.count}</span>
            </span>
          </div>
        ))}
        <div className="tl-today" style={{ left: x(TODAY) }}>
          <span>Today, {formatDay(TODAY)}</span>
        </div>
        <svg key={layoutKey} className="tl-edges" width={canvasWidth} height={height} aria-hidden="true">
          {edges}
        </svg>
        <ul className="tl-items" aria-label="Permits, tasks and inspections by date">
          {visible.map((item) => {
            const computed = schedule.byId.get(item.id)!;
            const top = rowTop.get(item.id)!;
            const flipped = canvasWidth - x(computed.end) < LABEL_ROOM;
            const barWidth =
              item.type === "inspection"
                ? dayWidth
                : Math.max(8, (computed.end - computed.start) * dayWidth - INSET * 2);
            const classes = ["tl-item", `type-${item.type}`, `tone-${computed.tone}`];
            if (computed.critical) classes.push("is-critical");
            if (computed.blockedBy.length > 0) classes.push("is-held");
            if (flipped) classes.push("is-flipped");
            if (selectedId === item.id) classes.push("is-selected");
            if (chain && !chain.has(item.id)) classes.push("is-faded");
            // Permits with an expiry draw their validity as a dashed tail, with the label after it.
            const validity =
              item.expires !== undefined && item.expires + 1 > computed.end
                ? x(item.expires + 1) - x(computed.end) + INSET
                : 0;
            const dates =
              item.type === "inspection"
                ? formatDay(computed.start)
                : `${formatDay(computed.start)} to ${formatDay(computed.end - 1)}`;
            return (
              <li key={item.id}>
                {validity > 0 && (
                  <span
                    className={`tl-validity tone-${computed.tone}`}
                    style={{ top: top + ROW_HEIGHT / 2, left: x(computed.end) - INSET, width: validity }}
                  />
                )}
                <button
                  type="button"
                  className={classes.join(" ")}
                  data-item={item.id}
                  style={
                    flipped
                      ? { top, right: canvasWidth - x(item.type === "inspection" ? computed.start + 1 : computed.end) }
                      : { top, left: x(computed.start) }
                  }
                  aria-pressed={selectedId === item.id}
                  aria-label={`${TYPE_LABEL[item.type]}: ${item.title}. ${computed.label}. ${dates}.${
                    computed.critical ? " On the critical path." : ""
                  }${computed.blockedBy.length > 0 ? " In a blocked chain." : ""}`}
                  onClick={() => onSelect(item.id)}
                >
                  <span className="tl-bar" style={{ width: barWidth }}>
                    {item.type === "inspection" ? (
                      <span className="tl-diamond" />
                    ) : (
                      item.status === "in_progress" && (
                        <span className="tl-progress" style={{ width: `${item.progress ?? 0}%` }} />
                      )
                    )}
                  </span>
                  <span className="tl-label" style={!flipped && validity ? { marginLeft: validity } : undefined}>
                    <span className="tl-title">{item.title}</span>
                    <span className="tl-state">{computed.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
