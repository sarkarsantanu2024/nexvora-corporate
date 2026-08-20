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
};

export default nextConfig;
