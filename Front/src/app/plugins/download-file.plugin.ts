import { registerPlugin } from '@capacitor/core';

export interface DownloadFileResult {
  uri: string;
  path: string;
}

export interface DownloadFilePlugin {
  saveToDownloads(options: { data: string; fileName: string; mimeType?: string }): Promise<DownloadFileResult>;
}

export const DownloadFile = registerPlugin<DownloadFilePlugin>('DownloadFile');
