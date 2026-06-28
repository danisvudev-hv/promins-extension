const VARIABLE_RE = /\{\{\s*([\w.-]+)\s*(?:\|([^}]*))?\}\}/g

/**
 * Substitute {{name}} (and {{name|default}}) occurrences with provided values.
 * Missing values fall back to the inline default, then to an empty string.
 */
export function renderTemplate(body: string, values: Record<string, string>): string {
  return body.replace(VARIABLE_RE, (_match, name: string, fallback?: string) => {
    const provided = values[name]
    if (provided !== undefined && provided !== '') return provided
    return (fallback ?? '').trim()
  })
}
