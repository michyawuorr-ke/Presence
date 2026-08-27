// Pages through a Supabase query in batches until every row is fetched,
// instead of a hardcoded .limit(N) silently truncating the result once an
// event or the app grows past N. Use this anywhere the caller needs the
// COMPLETE result set — an aggregate stat (Insights), a validation lookup
// (the scanner's offline check-in registry), a connection count — not for
// a UI list that's meant to show a preview and paginate on user action
// (Attendees/Discover feeds keep their own intentional page-at-a-time
// loading; this is for the opposite case).
//
// BATCH_SIZE matches Supabase's own per-request row cap, so each batch is
// a single round trip at the platform's natural limit — this isn't an
// arbitrary choice, raising it wouldn't fetch more per call.
const BATCH_SIZE = 1000;

// Safety ceiling so a bug (e.g. a query that always returns exactly
// BATCH_SIZE rows) can never spin forever — 50 batches is 50,000 rows,
// comfortably above the ~10,000-person events this was built for. If a
// single event's rows for one of these tables ever legitimately exceed
// that, raise this constant deliberately rather than removing the guard.
const MAX_BATCHES = 50;

export async function fetchAllRows<T>(
  queryBuilder: (from: number, to: number) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const all: T[] = [];
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const from = batch * BATCH_SIZE;
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await queryBuilder(from, to);
    if (error) {
      console.error("fetchAllRows: query failed, returning partial results", error);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < BATCH_SIZE) break; // last page — fewer rows than a full batch
  }
  return all;
}
