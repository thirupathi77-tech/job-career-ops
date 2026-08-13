import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeHtmlEntities } from "../../src/lib/html-entities.mjs";

test("decodes hexadecimal separators in ATS titles", () => {
  assert.equal(
    decodeHtmlEntities("Data Engineer &#x2F; Python &#x2F; SQL"),
    "Data Engineer / Python / SQL",
  );
});

test("decodes decimal and named entities", () => {
  assert.equal(decodeHtmlEntities("Data &amp; Analytics &#47; ETL"), "Data & Analytics / ETL");
});

test("leaves malformed and unsafe code points unchanged", () => {
  assert.equal(decodeHtmlEntities("Role &#xD800; &#99999999;"), "Role &#xD800; &#99999999;");
});
