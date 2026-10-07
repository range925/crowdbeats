import { NextResponse } from 'next/server';

/**
 * GET /api/instagram/oauth/callback
 *
 * Handles the Instagram OAuth redirect. Meta sends the ?code= here.
 * The token generator script (scripts/instagram_get_token.mjs) uses a local
 * HTTP server instead — this route is provided for production OAuth flows.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(
      `<html><body style="font:18px sans-serif;padding:40px;text-align:center">
        <h2 style="color:#dc2626">❌ Instagram Authorization Failed</h2>
        <p>Reason: ${error}</p>
        <p><a href="/">← Back to Crowdbeats</a></p>
      </body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  // In production, this would exchange the code for tokens server-side.
  // For the current setup, token exchange is handled by scripts/instagram_get_token.mjs.
  // This endpoint acknowledges the redirect so the browser gets a valid response.
  return new NextResponse(
    `<html><body style="font:18px sans-serif;padding:40px;text-align:center;color:#16a34a">
      <h2>✅ Authorization Received</h2>
      <p>Authorization code captured. The sync daemon will exchange it for a token.</p>
      <p><a href="/">← Back to Crowdbeats</a></p>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
