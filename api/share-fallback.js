// /share-target normally never reaches the server: the service worker answers it.
// If the app was installed but its worker isn't running yet, send people home
// instead of showing an error page.
export function POST() {
  return new Response(null, { status: 303, headers: { location: '/?share=retry' } });
}
export const GET = POST;
