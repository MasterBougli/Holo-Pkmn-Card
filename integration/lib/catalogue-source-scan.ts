export function validSourceScanId(value: string) {
  const parts = value.split("/");
  return value.length <= 100 && parts.length <= 2 && parts.every(part => /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(part));
}

export function sourceScanReference(url: string, code: string): string | null {
  const match = url.match(/^https:\/\/pokecardex-scans\.b-cdn\.net\/sets\/([A-Z0-9-]{1,12})\/FR\/([^?#]+)\.jpg(?:\?[^#]*)?$/);
  return match?.[1] === code && validSourceScanId(match[2]) ? match[2] : null;
}
