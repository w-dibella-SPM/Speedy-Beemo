import path from "path";

export const EXECUTION_DIR: string = process.cwd();
// WARNING: potrebbe rompersi malissimo
export const BASE_DIR: string = path.join(EXECUTION_DIR, "..");

export const SM2CARE_BASE_URL = "http://172.23.0.111/";
export const SM2CARE_LOGIN_PAGE_URL = `${SM2CARE_BASE_URL}login.php`;
export const SM2CARE_HOMEPAGE_URL = `${SM2CARE_BASE_URL}index.php`;

export const CSV_FILE_NAME = "config.csv";