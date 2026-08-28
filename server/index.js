// Cloudflare Workers static-asset entry for Sites hosting.
// The actual site remains the generated files in dist/.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
