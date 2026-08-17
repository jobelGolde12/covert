/**
 * Stand-in for the Node-only `canvas` package, which pdfjs-dist statically
 * imports but only ever uses in Node (guarded at runtime). Replaced in the
 * browser bundle via NormalModuleReplacementPlugin — see next.config.mjs.
 */

const emptyStub = null;

export default emptyStub;
