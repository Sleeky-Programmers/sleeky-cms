import Image from "next/image";

// Placeholder until authentication lands: the sign-in screen will replace this page.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <Image src="/brand/logo-on-dark.svg" alt="Sleeky Programmers" width={146} height={52} priority />
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Sleeky CMS</h1>
        <p className="mt-3 text-muted">Content management for sleekyprogrammers.com. Sign-in is coming next.</p>
      </div>
    </main>
  );
}
