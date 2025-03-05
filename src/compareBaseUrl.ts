export function comparePlalaHpSpaceUrl(
  a: string,
  b: string,
) {
  const aUrl = new URL(a);
  const bUrl = new URL(b);
  const aDomainNum = Number(aUrl.host.match(/^www(\d+)\.plala/)![1]);
  const bDomainNum = Number(bUrl.host.match(/^www(\d+)\.plala/)![1]);
  if (aDomainNum != bDomainNum) {
    return aDomainNum - bDomainNum;
  }
  return aUrl.pathname.toLowerCase().localeCompare(bUrl.pathname.toLowerCase());
}