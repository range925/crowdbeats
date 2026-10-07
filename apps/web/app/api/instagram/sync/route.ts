import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const dataPath = path.join(process.cwd(), 'public/data/instagram_reposts.json');
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json({ error: 'Reposts data not found' }, { status: 404 });
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    const now = Date.now();
    const repostIntervalMs = (data.repostCheckIntervalMinutes || 10) * 60 * 1000; // 10 minutes
    const dailyIntervalMs = (data.dailySyncHours || 24) * 60 * 60 * 1000; // 24 hours (daily)

    const shouldRefreshReposts = force || (now - (data.lastRepostCheckAt || data.lastCheckedAt || 0) >= repostIntervalMs);
    const shouldRefreshDaily = force || (now - (data.lastDailySyncAt || 0) >= dailyIntervalMs);

    if (shouldRefreshReposts || shouldRefreshDaily) {
      if (shouldRefreshReposts) {
        data.lastRepostCheckAt = now;
        data.lastRepostCheckIso = new Date(now).toISOString();
        data.nextRepostCheckAt = now + repostIntervalMs;
        data.nextRepostCheckIso = new Date(now + repostIntervalMs).toISOString();
      }
      if (shouldRefreshDaily) {
        data.lastDailySyncAt = now;
        data.lastDailySyncIso = new Date(now).toISOString();
        data.nextDailySyncAt = now + dailyIntervalMs;
        data.nextDailySyncIso = new Date(now + dailyIntervalMs).toISOString();
      }
      data.lastCheckedAt = now;
      data.lastCheckedIso = new Date(now).toISOString();
      data.repostCheckIntervalMinutes = 10;
      data.dailySyncHours = 24;

      try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
      } catch (writeErr) {
        // Silently continue if running in read-only environment
      }
    }

    return NextResponse.json({
      success: true,
      refreshed: shouldRefreshReposts || shouldRefreshDaily,
      repostsRefreshed: shouldRefreshReposts,
      dailyRefreshed: shouldRefreshDaily,
      repostCheckIntervalMinutes: 10,
      dailySyncHours: 24,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve Instagram reposts', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
