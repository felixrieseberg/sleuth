export function getRegExpSafe(exp: string = ''): RegExp {
  try {
    return new RegExp(exp, 'i');
  } catch (error) {
    return getRegExpSafe(exp.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
  }
}
