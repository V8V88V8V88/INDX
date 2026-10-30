export const SITE_URL = "https://ind-x.vercel.app";
export const REPO_URL = "https://github.com/V8V88V8V88/INDX";

export function newIssueUrl(template: string, fields: Record<string, string>) {
  const params = new URLSearchParams({ template, ...fields });
  return `${REPO_URL}/issues/new?${params}`;
}
