import packageJson from "../../../package.json";

/** `package.json` `version`, inlined at build time. */
export const appVersion: string = packageJson.version;
