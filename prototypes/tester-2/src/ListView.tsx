import { LANES, LANE_LABEL, formatDay, plural, type Item } from "./data";
import type { Schedule } from "./schedule";
import { Badge } from "./ui";

interface Props {
  schedule: Schedule;
  visible: Item[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function ListView({ schedule, visible, selectedId, onSelect }: Props) {
  return (
    <div className="list-wrap">
      <table className="list">
        <caption className="sr-only">Permits, tasks and inspections with status, dates and dependencies</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Status</th>
            <th scope="col">Owner</th>
            <th scope="col">Start</th>
            <th scope="col">Finish</th>
            <th scope="col">Waiting on</th>
            <th scope="col">Float</th>
          </tr>
        </thead>
        {LANES.map((type) => {
          const rows = visible.filter((item) => item.type === type);
          if (rows.length === 0) return null;
          return (
            <tbody key={type}>
              <tr className="list-group">
                <th colSpan={7} scope="rowgroup">
                  {LANE_LABEL[type]} <span className="muted">{rows.length}</span>
                </th>
              </tr>
              {rows.map((item) => {
                const computed = schedule.byId.get(item.id)!;
                const waiting = item.dependsOn
                  .map((dep) => schedule.itemById.get(dep))
                  .filter((dep): dep is Item => !!dep && !schedule.byId.get(dep.id)!.complete);
                return (
                  <tr key={item.id} className={selectedId === item.id ? "is-selected" : undefined}>
                    <th scope="row">
                      <button
                        type="button"
                        className="list-link"
                        data-item={item.id}
                        aria-pressed={selectedId === item.id}
                        onClick={() => onSelect(item.id)}
                      >
                        {item.title}
                      </button>
                    </th>
                    <td>
                      <Badge tone={computed.tone}>{computed.label}</Badge>
                    </td>
                    <td>{item.owner}</td>
                    <td>{formatDay(computed.start)}</td>
                    <td>{formatDay(computed.end - 1)}</td>
                    <td className={waiting.length ? undefined : "muted"}>
                      {waiting.length ? waiting.map((dep) => dep.title).join(", ") : "Nothing"}
                    </td>
                    <td className={computed.critical ? "strong" : "muted"}>
                      {computed.complete ? "Closed" : computed.critical ? "Critical path" : plural(computed.float, "day")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
