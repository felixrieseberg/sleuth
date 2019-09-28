import { shouldIgnoreFile } from '../utils/should-ignore-file';
import yauzl from 'yauzl';
import fs from 'fs-extra';
import path from 'path';
import tmp from 'tmp';
import { promisify } from 'util';

const debug = require('debug')('sleuth:unzip');

export interface YauzlZipEntry {
  fileName: string;
  extraFields: Array<any>;
  fileComment: string;
  versionMadeBy: number;
  versionNeededToExtract: number;
  generalPurposeBitFlag: number;
  compressionMethod: number;
  lastModFileTime: number;
  lastModFileDate: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  fileNameLength: number;
  extraFieldLength: number;
  fileCommentLength: number;
  internalFileAttributes: number;
  externalFileAttributes: number;
  relativeOffsetOfLocalHeader: number;
}

export interface UnzippedFile {
  fileName: string;
  size: number;
  fullPath: string;
}

export interface UnzippedFiles extends Array<UnzippedFile> { }

export class Unzipper {
  public readonly url: string;
  public output: string;
  public zipfile: any;
  public files: Array<UnzippedFile> = [];

  constructor(url: string) {
    this.url = url;
    debug(`Created new Unzipper with url ${url}`);
  }

  public open(): Promise<any> {
    return new Promise((resolve, reject) => {
      yauzl.open(this.url, { lazyEntries: true }, (error: Error, zip: any) => {
        if (error) {
          return reject(error);
        }

        this.zipfile = zip;
        this.zipfile.on('entry', (entry: YauzlZipEntry) => this.handleEntry(entry));
        resolve();
      });
    });
  }

  public unzip(): Promise<Array<UnzippedFile>> {
    return new Promise(async (resolve, reject) => {
      if (this.zipfile) {
        tmp.setGracefulCleanup();
        this.output = await (promisify(tmp.dir) as any)({ unsafeCleanup: true });

        this.zipfile.on('end', () => resolve(this.files));
        this.zipfile.readEntry();
      } else {
        debug('Tried to unzip file, but file does not exist');
        reject('Tried to unzip file, but file does not exist');
      }
    });
  }

  public handleDirectory(entry: YauzlZipEntry): Promise<void> {
    debug(`Found directory: ${entry.fileName}`);
    return fs.ensureDir(path.join(this.output, entry.fileName));
  }

  public handleFile(entry: YauzlZipEntry): Promise<any> {
    return new Promise((resolve, reject) => {
      const targetPath = path.join(this.output, entry.fileName);

      debug(`Found file: ${entry.fileName}, Size: ${entry.compressedSize}.`);

      if (shouldIgnoreFile(entry.fileName)) return;

      this.zipfile.openReadStream(entry, async (error: Error, readStream: NodeJS.ReadableStream) => {
        if (error) {
          debug(`Encountered error while trying to read stream for ${entry.fileName}`);
          return reject(error);
        }

        readStream.pipe(fs.createWriteStream(targetPath));
        readStream.once('end', () => {
          this.files.push({ fileName: entry.fileName, size: entry.uncompressedSize || 0, fullPath: targetPath });
          debug(`Successfully unzipped ${entry.fileName} to ${targetPath}`);
          resolve();
        });
    });
    });
  }

  public async handleEntry(entry: YauzlZipEntry) {
    if (/\/$/.test(entry.fileName)) {
      await this.handleDirectory(entry);
    } else {
      await this.handleFile(entry);
    }

    this.zipfile.readEntry();
  }

  public clean() {
    if (this.output) {
      return fs.remove(this.output);
    } else {
      debug('Called clean, but no temp directory created. No need to clean!');
      return Promise.resolve();
    }
  }
}
