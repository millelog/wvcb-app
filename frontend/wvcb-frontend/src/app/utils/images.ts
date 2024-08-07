// $lib/utils/images.ts

// Assuming that imageMap is a JSON object which maps your image name (key) to their actual cloudflare IDs
const imageMap: Record<string, string> = {
  'wvcb-hero': 'e03eef2e-4bdd-4228-2601-69453cecb400',
  'logo-white': '98b4300f-f459-4718-fdc4-0399579bc800',
  'sponsor-1': 'a3292299-5060-42d8-d9c8-b5ea5479fe00',
  'sponsor-2': '86e20ef0-362f-41d2-6c49-0c7e10e92800',
  'sponsor-3': 'bafaac4d-4e3b-44f6-49d9-765dbdb43300',
  'sponsor-4': '23035300-45a6-4ca5-def3-e6af18dfe900',
};

const defaultParams: Record<string, string | number> = {
  format: 'auto',
  // Add any other default parameters here
  // For example, default width: width: 1920
};

export function getImage(
  id: string,
  params: Record<string, string | number> = {}
): string {
  const imageId = imageMap[id];

  if (!imageId) {
    return '';
  }

  // Check if running on the client-side
  let viewportWidth: number | null = null;
  let viewportHeight: number | null = null;
  if (typeof window !== 'undefined') {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
  }

  // Merge default params with provided params.
  // Provided params will overwrite default ones if they exist.
  const mergedParams = { ...defaultParams, ...params };

  // Scale 'w' or 'h' parameter if it exists and viewport dimensions are available
  if (
    viewportWidth &&
    mergedParams['w'] &&
    typeof mergedParams['w'] === 'number'
  ) {
    mergedParams['w'] = Math.min(mergedParams['w'], viewportWidth);
  }

  if (
    viewportHeight &&
    mergedParams['h'] &&
    typeof mergedParams['h'] === 'number'
  ) {
    mergedParams['h'] = Math.min(mergedParams['h'], viewportHeight);
  }

  const paramsString = Object.entries(mergedParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
    .join(',');

  const url = `https://imagedelivery.net/zqlO_f93Gilxz6zHS6qT_w/${imageId}/${paramsString}`;
  return url;
}
