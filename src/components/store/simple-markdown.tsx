/**
 * Render markdown mínimo: líneas `#` / `##` / `###` y párrafos.
 */

type SimpleMarkdownProps = {
  content: string;
  className?: string;
};

export function SimpleMarkdown({ content, className }: SimpleMarkdownProps) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  return (
    <div className={className ?? "space-y-3 text-sm leading-relaxed text-foreground"}>
      {lines.map((line, index) => {
        const key = `${index}-${line.slice(0, 24)}`;
        if (line.startsWith("### ")) {
          return (
            <h3 key={key} className="pt-2 text-base font-semibold">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={key} className="pt-3 text-lg font-semibold">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={key} className="text-xl font-semibold">
              {line.slice(2)}
            </h1>
          );
        }
        if (!line.trim()) {
          return <div key={key} className="h-2" />;
        }
        return (
          <p key={key} className="text-muted-foreground">
            {line}
          </p>
        );
      })}
    </div>
  );
}
