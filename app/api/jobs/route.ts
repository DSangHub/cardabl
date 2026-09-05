export async function GET() {
  return Response.json({ jobs: [], mode: "prototype" });
}

export async function POST() {
  return Response.json(
    { error: "Persistent job posting will activate after the production database is connected." },
    { status: 503 },
  );
}
