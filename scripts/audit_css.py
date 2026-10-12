#!/usr/bin/env python3
"""Audita CSS contra las reglas BEM + tokens del proyecto."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


BEM_CLASS = re.compile(
    r"^(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?:__(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*))?"
    r"(?:--(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*))?$"
)
STATE_CLASS = re.compile(r"^(?:is|has|js)-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$")
HEX_COLOR = re.compile(r"#[0-9a-fA-F]{3,8}\b")
FUNCTION_COLOR = re.compile(r"\b(?:rgb|rgba|hsl|hsla)\(")
PX_TYPOGRAPHY = re.compile(
    r"\b(?:font-size|line-height|letter-spacing|text-indent)\s*:[^;{}]*\b\d+(?:\.\d+)?px\b"
)
CLASS_NAME = re.compile(r"\.[a-zA-Z_][a-zA-Z0-9_-]*")


def add_issue(issues: list[str], path: Path, line: int, message: str) -> None:
    issues.append(f"{path}:{line}: {message}")


def audit(path: Path, mode: str) -> list[str]:
    issues: list[str] = []
    lines = path.read_text(encoding="utf-8").splitlines()
    in_tokens = False
    brace_depth = 0

    for number, source in enumerate(lines, start=1):
        line = source.strip()
        if ":root" in line or "[data-theme" in line or line in {".light,", ".dark,"}:
            in_tokens = True

        brace_depth += source.count("{") - source.count("}")
        if in_tokens and brace_depth <= 0:
            in_tokens = False

        if "!important" in source:
            add_issue(issues, path, number, "prohibido usar !important")
        if re.search(r"(^|[^-])#[a-zA-Z_][\w-]*", source):
            add_issue(issues, path, number, "selector con ID; use una clase BEM")
        if re.search(r"(^|\s)#(?:[0-9a-fA-F]{3,8})\b", source):
            add_issue(issues, path, number, "color hexadecimal fuera de un token")
        if PX_TYPOGRAPHY.search(source):
            add_issue(issues, path, number, "use rem o tokens para tipografía")
        if re.search(r"\btransition\s*:\s*all\b", source):
            add_issue(issues, path, number, "transition: all está prohibido")

        if "{" in source and not line.startswith(("@", "/*", "*", "--")):
            selector = source.split("{", 1)[0].strip()
            if selector and not selector.startswith("("):
                if selector.count(" ") >= 3 or selector.count(">") >= 3:
                    add_issue(issues, path, number, "selector con más de tres niveles")

        for class_name in CLASS_NAME.findall(source):
            value = class_name[1:]
            if value in {"dark", "light"} or (mode == "global" and value == "sr-only"):
                continue
            if not BEM_CLASS.fullmatch(value) and not STATE_CLASS.fullmatch(value):
                add_issue(issues, path, number, f"clase fuera del patrón BEM: .{value}")

        if not in_tokens and (HEX_COLOR.search(source) or FUNCTION_COLOR.search(source)):
            if not source.lstrip().startswith("--"):
                add_issue(issues, path, number, "color hardcodeado; use un token semántico")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path, help="Archivos CSS a auditar")
    parser.add_argument("--mode", choices=("global", "module", "angular"), default="global")
    args = parser.parse_args()

    issues = [issue for path in args.paths for issue in audit(path, args.mode)]
    if issues:
        print("\n".join(issues))
        print(f"\nAuditoría fallida: {len(issues)} hallazgo(s).", file=sys.stderr)
        return 1

    print(f"Auditoría CSS BEM correcta ({len(args.paths)} archivo(s), modo {args.mode}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
