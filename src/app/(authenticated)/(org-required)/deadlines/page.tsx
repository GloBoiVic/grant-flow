import type { ReactNode } from "react";

import { DeadlineView } from "@/components/deadlines/deadline-view";
import { getDeadlineView } from "@/lib/queries/deadlines";

export default async function DeadlinesPage(): Promise<ReactNode> {
  const dto = await getDeadlineView();
  return <DeadlineView dto={dto} />;
}
