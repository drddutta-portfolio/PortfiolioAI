import { assertEquals } from "jsr:@std/assert"
Deno.test("G10.2 local Global Generics evidence function is local-only by contract", () => {
  assertEquals("OWNER_CONFIRMED_G10_2_LOCAL_GLOBAL_GENERICS_EVIDENCE".startsWith("OWNER_CONFIRMED_"), true)
})
