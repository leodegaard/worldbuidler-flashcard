import { google, type drive_v3 } from "googleapis";
import { db } from "@/lib/db";
import {
  EXCLUDED_FOLDER_NAMES,
  getDriveRoots,
  requireEnv,
  type LoreFocus,
} from "./config";
import { decryptSecret } from "./crypto";
import {
  contentHash,
  inspectMarkdown,
  prepareMarkdownForModel,
} from "./parser";
import type { ScanResult, ScannedNote } from "./types";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const MARKDOWN_MIME = "text/markdown";

export function createGoogleOauthClient() {
  return new google.auth.OAuth2(
    requireEnv("GOOGLE_CLIENT_ID"),
    requireEnv("GOOGLE_CLIENT_SECRET"),
    requireEnv("GOOGLE_REDIRECT_URI"),
  );
}

export async function getAuthorizedDrive() {
  const connection = await db.googleConnection.findUnique({ where: { id: "primary" } });
  if (!connection) throw new Error("Google Drive is not connected");
  const auth = createGoogleOauthClient();
  auth.setCredentials({
    refresh_token: decryptSecret(connection.encryptedRefreshToken),
  });
  return google.drive({ version: "v3", auth });
}

function isExcludedFolder(name: string) {
  return EXCLUDED_FOLDER_NAMES.has(name.trim().toLocaleLowerCase("en"));
}

async function listChildren(drive: drive_v3.Drive, folderId: string) {
  const files: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const response = await drive.files.list({
      q: `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,modifiedTime)",
      pageSize: 1000,
      pageToken,
    });
    files.push(...(response.data.files ?? []));
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);
  return files;
}

async function downloadMarkdown(drive: drive_v3.Drive, fileId: string) {
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" },
  );
  return typeof response.data === "string" ? response.data : String(response.data ?? "");
}

async function scanFolder(
  drive: drive_v3.Drive,
  folderId: string,
  focus: Exclude<LoreFocus, "balanced">,
  path: string,
  notes: ScannedNote[],
  warnings: string[],
) {
  const children = await listChildren(drive, folderId);
  for (const file of children) {
    if (!file.id || !file.name) continue;
    const childPath = `${path}/${file.name}`;
    if (file.mimeType === FOLDER_MIME) {
      if (!isExcludedFolder(file.name)) {
        await scanFolder(drive, file.id, focus, childPath, notes, warnings);
      }
      continue;
    }
    if (file.mimeType !== MARKDOWN_MIME && !file.name.endsWith(".md")) continue;

    try {
      const rawContent = await downloadMarkdown(drive, file.id);
      const content = prepareMarkdownForModel(rawContent);
      const inspection = inspectMarkdown(rawContent);
      notes.push({
        id: file.id,
        name: file.name,
        path: childPath,
        focus,
        modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : new Date(0),
        content,
        contentHash: contentHash(rawContent),
        ...inspection,
      });
    } catch {
      warnings.push(`Could not read ${childPath}`);
    }
  }
}

export async function scanLoreNotes(): Promise<ScanResult> {
  const drive = await getAuthorizedDrive();
  const roots = getDriveRoots();
  const notes: ScannedNote[] = [];
  const warnings: string[] = [];
  for (const [focus, folderId] of Object.entries(roots) as Array<
    [Exclude<LoreFocus, "balanced">, string]
  >) {
    await scanFolder(drive, folderId, focus, focus, notes, warnings);
  }
  return { notes, warnings };
}

export async function fetchCurrentNoteHash(fileId: string) {
  const drive = await getAuthorizedDrive();
  return contentHash(await downloadMarkdown(drive, fileId));
}
