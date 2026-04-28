import Link from "next/link";

export default function Landing() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-noir-paper">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,60,60,0.18), transparent 60%)," +
            "radial-gradient(circle at 80% 70%, rgba(245,166,35,0.10), transparent 55%)," +
            "linear-gradient(180deg, #050507, #0b0b0e 70%, #000)",
        }}
      />
      <div className="absolute inset-0 crt opacity-30 pointer-events-none" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.45em] text-noir-fog">
          Zed × ElevenLabs · Hack #6
        </p>
        <h1 className="mb-5 text-7xl font-extrabold tracking-[0.18em] md:text-9xl">
          VOICE
          <br />
          THIEF
        </h1>
        <p className="mb-2 max-w-xl text-lg italic text-noir-fog">
          A noir city. A vault. One impossible job.
        </p>
        <p className="mb-10 max-w-xl text-base text-noir-fog">
          You cannot speak. But everyone else can.
        </p>

        <Link
          href="/play"
          className="group relative overflow-hidden rounded-sm border border-noir-paper/30 bg-transparent px-10 py-3 text-sm uppercase tracking-[0.4em] text-noir-paper transition hover:bg-noir-paper hover:text-black"
        >
          Begin the Heist
        </Link>

        <p className="mt-12 text-[11px] uppercase tracking-[0.3em] text-noir-fog/70">
          Built in Zed · Powered by ElevenLabs
        </p>
      </div>
    </main>
  );
}
