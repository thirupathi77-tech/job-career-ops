type FontLike = {
  className: string;
  variable: string;
};

function makeFont(variable: string): FontLike {
  return {
    className: variable === "--font-inter" ? "font-inter" : variable === "--font-instrument-serif" ? "font-instrument-serif" : "font-instrument-serif-italic",
    variable,
  };
}

// Offline-safe font tokens. The app keeps the same semantic hooks, but relies on
// local/system stacks so production builds never need network access.
export const inter = makeFont("--font-inter");
export const instrumentSerif = makeFont("--font-instrument-serif");
export const instrumentSerifItalic = makeFont("--font-instrument-serif-italic");
