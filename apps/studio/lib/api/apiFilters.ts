type Split<S extends string> = S extends ''
  ? []
  : S extends `${infer H}.${infer R}`
    ? [H, ...Split<R>]
    : [S]

/**
 * Remove the property at a single path (tuple of path segments).
 * - If the path length is 1 -> Omit<T, head>
 * - If deeper -> recursively descend. If the property is an array, apply
 *   the transformation to the array element type.
 */
type OmitAtPath<T, P extends readonly string[]> = P extends [infer H, ...infer R]
  ? H extends keyof T
    ? R extends readonly string[]
      ? R['length'] extends 0
        ? Omit<T, H> // base: drop the key
        : {
            [K in keyof T]: K extends H
              ? // If T[K] is an array — map inner element type
                T[K] extends readonly (infer E)[]
                ? T[K] extends (infer _E)[]
                  ? Array<OmitAtPath<E, R>>
                  : ReadonlyArray<OmitAtPath<E, R>>
                : // else if object, recurse into it
                  T[K] extends object
                  ? OmitAtPath<T[K], R>
                  : T[K]
              : T[K]
          }
      : T
    : T
  : T

/**
 * Apply multiple paths in sequence.
 */
type OmitPaths<T, P extends readonly string[]> = P extends [infer F, ...infer Rest]
  ? F extends string
    ? Rest extends readonly string[]
      ? OmitPaths<OmitAtPath<T, Split<F>>, Rest>
      : OmitAtPath<T, Split<F>>
    : T
  : T

const hasStructuredClone = typeof (globalThis as any).structuredClone === 'function'
function deepClone<T>(obj: T): T {
  if (hasStructuredClone) {
    return (globalThis as any).structuredClone(obj)
  }
  // fallback (won't clone functions / special objects)
  return JSON.parse(JSON.stringify(obj))
}

export function deepObjectFilter<T, P extends readonly string[]>(obj: T, paths: P): OmitPaths<T, P>

export function deepObjectFilter<T>(obj: T, paths: string[]): T

/**
 * Removes keys at given dot-paths from an object.
 */
export function deepObjectFilter(obj: any, paths: string[]): any {
  const clone = deepClone(obj)
  for (const p of paths) removeByPath(clone, p)
  return clone
}

function removeByPath(obj: any, path: string): void {
  const parts = path.split('.')
  if (parts.length === 0) return

  const [head, ...rest] = parts
  if (rest.length === 0) {
    if (obj && typeof obj === 'object' && head in obj) {
      delete obj[head]
    }
    return
  }

  if (!obj || typeof obj !== 'object') return
  const next = obj[head]
  if (next == null) return

  if (Array.isArray(next)) {
    const sub = rest.join('.')
    for (const el of next) {
      if (el && typeof el === 'object') removeByPath(el, sub)
    }
  } else if (typeof next === 'object') {
    removeByPath(next, rest.join('.'))
  }
}
