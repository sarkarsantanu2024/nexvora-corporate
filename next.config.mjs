/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // A second build can be pointed at its own output directory:
  //
  //   NEXT_DIST_DIR=.next-verify npx next build
  //   NEXT_DIST_DIR=.next-verify npx next start -p 3190
  //
  // Without this, running `next build` while `npm run dev` is up has both
  // processes writing the same .next folder. The dev server then dies with
  // "Cannot find module './chunks/…'" — the chunks it is holding open were
  // replaced underneath it. Nothing is wrong with the code when that happens,
  // but the error looks alarming and costs half an hour to disbelieve.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // The client demos.
  //
  // Each one is a whole standalone website in a single folder under
  // public/demo/ — its own HTML, its own CSS, its own look. Nothing about a
  // demo touches this Next app, which is the point: a demo has to look like
  // the customer's own site, not like a page of mine with their name on it.
  //
  //   public/demo/yoga/index.html      ->  /demo/yoga
  //   public/demo/abacus/index.html    ->  /demo/abacus
  //
  // The folder name is the URL. Adding the next category is creating a folder
  // and dropping index.html into it — no code change, no route to register.
  //
  // This rewrite is what lets the shareable link be /demo/yoga rather than
  // /demo/yoga/index.html. It runs after the filesystem is checked, so a real
  // file — a stylesheet, a photograph inside the demo folder — is always
  // served as itself and never rewritten.
  async rewrites() {
    return [{ source: "/demo/:slug", destination: "/demo/:slug/index.html" }];
  },

  // Demos are for sending to a customer, not for Google. Twelve near-identical
  // template sites under one domain, each naming a business that does not
  // exist, is exactly how a real site loses trust in search — and a Kolkata
  // yoga studio that nobody can visit has no business being in an index.
  //
  // Sent as a header rather than a meta tag because it then covers every demo
  // automatically, including ones added later by somebody who never reads this
  // file, and it cannot be lost when a demo's HTML is regenerated.
  async headers() {
    return [
      {
        source: "/demo/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
