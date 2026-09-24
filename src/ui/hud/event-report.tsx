import { AlertTriangle, FileClock } from "lucide-react";

import type { TeamReportEntry } from "@/domain/resolve-turn/turn-state";

export function EventReport(props: {
  readonly items: readonly TeamReportEntry[];
}) {
  return (
    <section className="event-report" aria-labelledby="event-report-title">
      <div className="event-report__heading">
        <FileClock aria-hidden="true" />
        <h2 id="event-report-title">최근 보고</h2>
      </div>
      <ul>
        {props.items.map((item) => (
          <li key={item.id} data-tone={item.tone.toLowerCase()}>
            {item.tone === "WARNING" || item.tone === "CRITICAL" ? (
              <AlertTriangle aria-hidden="true" />
            ) : (
              <span className="event-dot" aria-hidden="true" />
            )}
            <span>{item.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
