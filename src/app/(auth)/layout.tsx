/**
 * Layout del grupo `(auth)`.
 */

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_color-mix(in_srgb,var(--primary)_18%,transparent),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_color-mix(in_srgb,var(--secondary)_22%,transparent),_transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--foreground)_6%,transparent)_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <div className="relative z-10">{children}</div>
    </main>
  );
}
