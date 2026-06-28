/** Matches {{ name }} with optional default: {{ name | fallback }}. */
const VARIABLE_RE = /\{\{\s*([\w.-]+)\s*(?:\|([^}]*))?\}\}/g

export interface ParsedVariable {
  name: string
  defaultValue?: string
}

/** Extract the ordered, unique list of variable names found in a prompt body. */
export function parseVariables(body: string): ParsedVariable[] {
  const seen = new Map<string, ParsedVariable>()
  for (const match of body.matchAll(VARIABLE_RE)) {
    const name = match[1]
    if (!seen.has(name)) {
      const def = match[2]?.trim()
      seen.set(name, { name, defaultValue: def ? def : undefined })
    }
  }
  return [...seen.values()]
}

/** Convenience: just the variable names. Stored in `prompts.variables`. */
export function variableNames(body: string): string[] {
  return parseVariables(body).map((v) => v.name)
}

export function hasVariables(body: string): boolean {
  VARIABLE_RE.lastIndex = 0
  return VARIABLE_RE.test(body)
}
