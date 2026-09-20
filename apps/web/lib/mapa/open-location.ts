export const shiftForOpenedLocation = (
  explicitShift: string | undefined,
  code: string,
  searchTargetCode: string | null,
  searchTargetShift: string | undefined,
): string | undefined => {
  if (explicitShift !== undefined) {
    return explicitShift;
  }
  if (searchTargetCode === code) {
    return searchTargetShift;
  }
  return undefined;
};
