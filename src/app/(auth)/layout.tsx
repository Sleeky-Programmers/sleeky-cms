import Image from "next/image";

// Public authentication screens: a single centred card on the brand background.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-green opacity-[0.12] blur-[80px]" />
      <Image src="/brand/logo-on-dark.svg" alt="Sleeky Programmers" width={126} height={45} priority className="relative mb-10" />
      <main className="relative w-full max-w-[440px] rounded-[28px] border border-line bg-surface p-8 sm:p-10">{children}</main>
      <p className="relative mt-8 text-sm text-faint">Sleeky CMS · for the Sleeky Programmers team</p>
    </div>
  );
}
