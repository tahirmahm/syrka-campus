import Link from "next/link";
import { suiteAdapters, connectionLabel } from "@/lib/command/integrations";
import { Icon } from "@/components/icon";
export default function Connections() {
  return (
    <>
      <div className="page-top">
        <div>
          <p className="eyebrow">Syrka suite</p>
          <h1>Connections</h1>
          <p>
            Academic records stay in Campus. Each app keeps its own permissions.
          </p>
        </div>
      </div>
      <div className="connections-grid">
        {suiteAdapters.map((a) => (
          <section className="card" key={a.id} id={a.id}>
            <div className="card-top">
              <h2>{a.name}</h2>
              <span className="pill">{connectionLabel(a.state)}</span>
            </div>
            <p>{a.detail}</p>
            <p className="small">Capability: {a.capability}</p>
            {a.href ? (
              a.href.startsWith("/") ? (
                <Link className="text-link" href={a.href}>
                  Open {a.name}
                  <Icon name="arrow" size={15} />
                </Link>
              ) : (
                <a className="text-link" href={a.href}>
                  Open {a.name}
                  <Icon name="external" size={15} />
                </a>
              )
            ) : (
              <Link
                className="text-link"
                href={`/experience-demo?view=${({ mail: "correspondence", roadmaps: "progression", passport: "evidence", sessions: "class", calendar: "class", ai: "course", workspace: "course" } as Record<string, string>)[a.id] ?? "dashboard"}`}
              >
                Explore fictional example
                <Icon name="arrow" size={15} />
              </Link>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
