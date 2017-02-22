import * as yauzl from 'yauzl';
import * as fs from 'fs-promise';
import * as path from 'path';
import * as tmp from 'tmp';
import * as promisify from 'es6-promisify';

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
    console.log(`Created new Unzipper with url ${url}`);
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

  public unzip() {
    return new Promise(async (resolve, reject) => {
      if (this.zipfile) {
        tmp.setGracefulCleanup();
        this.output = await promisify(tmp.dir)({ unsafeCleanup: true });

        this.zipfile.on('end', () => resolve(this.files));
        this.zipfile.readEntry();
      } else {
        console.log('Unzipper: Tried to unzip file, but file does not exist');
        reject('Tried to unzip file, but file does not exist');
      }
    });
  }

  public handleDirectory(entry: YauzlZipEntry): Promise<void> {
    console.log(`Unzipper: Found directory: ${entry.fileName}`);
    return fs.ensureDir(path.join(this.output, entry.fileName));
  }

  public handleFile(entry: YauzlZipEntry): Promise<any> {
    return new Promise((resolve, reject) => {
      const targetPath = path.join(this.output, entry.fileName);

      console.log(`Unzipper: Found file: ${entry.fileName}, Size: ${entry.compressedSize}.`);

      this.zipfile.openReadStream(entry, async (error: Error, readStream: NodeJS.ReadableStream) => {
        if (error) {
          console.log(`Unzipper: Encountered error while trying to read stream for ${entry.fileName}`);
          return reject(error);
        }

        readStream.pipe(fs.createWriteStream(targetPath));
        readStream.once('end', () => {
          this.files.push({ fileName: entry.fileName, size: entry.uncompressedSize || 0, fullPath: targetPath });
          console.log(`Unzipper: Successfully unzipped ${entry.fileName} to ${targetPath}`);
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
      console.log('Unzipper: Called clean, but no temp directory created. No need to clean!');
      return Promise.resolve();
    }
  }
}
