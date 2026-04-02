/**
 * Parses a self-closing JSX string into a component name and props object.
 *
 * Handles formats like:
 *   <ShaderArt width="100%" height="100%" uniforms={{ uIterations: 8, uAmplitude: 1.2 }} />
 *   <RippleWave intensity={1.5} zoom={2} speed={0.35} hexColors={["#ff0000"]} />
 */
export function parseJsxProps(jsx: string): {
  componentName: string;
  props: Record<string, unknown>;
} {
  const cleaned = jsx.trim();

  // Extract component name: first word after <
  const nameMatch = cleaned.match(/^<(\w+)/);
  const componentName = nameMatch?.[1] ?? "";

  const props: Record<string, unknown> = {};

  // Walk through the string to find prop assignments
  let i = cleaned.indexOf(componentName) + componentName.length;

  while (i < cleaned.length) {
    // Skip whitespace
    while (i < cleaned.length && /\s/.test(cleaned[i])) i++;

    // Check for end of tag
    if (cleaned[i] === "/" || cleaned[i] === ">") break;

    // Extract prop name
    const nameStart = i;
    while (i < cleaned.length && /\w/.test(cleaned[i])) i++;
    const key = cleaned.slice(nameStart, i);

    if (!key) { i++; continue; }

    // Skip whitespace
    while (i < cleaned.length && /\s/.test(cleaned[i])) i++;

    // Check for =
    if (cleaned[i] !== "=") {
      // Boolean prop
      props[key] = true;
      continue;
    }
    i++; // skip =

    // Skip whitespace
    while (i < cleaned.length && /\s/.test(cleaned[i])) i++;

    if (cleaned[i] === '"') {
      // String value: prop="value"
      i++; // skip opening "
      const start = i;
      while (i < cleaned.length && cleaned[i] !== '"') i++;
      props[key] = cleaned.slice(start, i);
      i++; // skip closing "
    } else if (cleaned[i] === "{") {
      // Expression value: prop={...} — handle nested braces
      i++; // skip opening {
      let depth = 1;
      const start = i;
      while (i < cleaned.length && depth > 0) {
        if (cleaned[i] === "{") depth++;
        else if (cleaned[i] === "}") depth--;
        if (depth > 0) i++;
      }
      const expr = cleaned.slice(start, i).trim();
      i++; // skip closing }

      try {
        // Convert JS object literal to JSON: add quotes to keys
        const jsonified = expr.replace(/(\w+)\s*:/g, '"$1":');
        props[key] = JSON.parse(jsonified);
      } catch {
        try {
          props[key] = JSON.parse(expr);
        } catch {
          props[key] = expr;
        }
      }
    }
  }

  return { componentName, props };
}
