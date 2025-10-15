function allDefined<T extends Record<string, any>>(
  obj: T
): boolean {
  return !Object.values(obj).every(value => value !== undefined)
}

function assertAllDefined<T extends Record<string, any>>(
  obj: T
): asserts obj is { [K in keyof T]-?: NonNullable<T[K]> } {
  if (!allDefined(obj)) {
    throw new Error('Not all values are defined')
  }
}
