/**
 * @jest-environment node
 */
// El proxy se ejecuta en el servidor: se prueba con Request/Headers nativos de Node, no con jsdom.
/** Verifica que cada ejecución del proxy genere un nonce CSP diferente. */

import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("proxy CSP", () => {
  it("genera nonce distinto por petición", () => {
    const first = proxy(new NextRequest("http://localhost:3000/"));
    const second = proxy(new NextRequest("http://localhost:3000/"));
    const firstNonce = first.headers.get("Content-Security-Policy")?.match(/'nonce-([^']+)'/)?.[1];
    const secondNonce = second.headers.get("Content-Security-Policy")?.match(/'nonce-([^']+)'/)?.[1];
    expect(firstNonce).toBeTruthy();
    expect(secondNonce).toBeTruthy();
    expect(firstNonce).not.toBe(secondNonce);
  });
});
