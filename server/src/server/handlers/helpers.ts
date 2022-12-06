export function isYaml(filename: string): Boolean {
  if (filename.endsWith(".yaml") || filename.endsWith(".yml")) {
    return true;
  }
  return false;
}
