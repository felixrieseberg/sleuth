export function getRegExpSafe(exp: string = ''): RegExp {
  return new RegExp(exp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export function getRegExpMaybeSafe(exp: string = ''): RegExp {
  if (/\/.*\//.test(exp) && exp.length > 2) {
    const withoutSlashes = exp.slice(1, exp.length - 2);

    try {
      return new RegExp(withoutSlashes);
    } catch (error) {
      return getRegExpSafe(withoutSlashes);
    }
  }

  return getRegExpSafe(exp);
}
