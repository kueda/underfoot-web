import jszip from 'jszip';
import { PackBoundingBox, PackMetadata, UnzippedPackData } from './types';

export class Pack {
  admin1: string;
  admin2: string;
  bbox: PackBoundingBox;
  data?: UnzippedPackData;
  description: string;
  downloadedAt?: string;
  id: string;
  name: string;
  path?: string;
  pmtilesPath?: string;
  updatedAt: string;

  constructor(metadata: PackMetadata, data?: UnzippedPackData) {
    this.admin1 = metadata.admin1;
    this.admin2 = metadata.admin2;
    this.bbox = metadata.bbox;
    this.description = metadata.description;
    this.id = metadata.id;
    this.name = metadata.name;
    this.pmtilesPath = metadata.pmtiles_path;
    this.updatedAt = metadata.updated_at;
    this.data = data;
  }

  static fromPack(pack: Pack): Pack {
    const newPack = new Pack(
      {
        admin1: pack.admin1,
        admin2: pack.admin2,
        bbox: pack.bbox,
        description: pack.description,
        id: pack.id,
        name: pack.name,
        path: pack.path,
        pmtiles_path: pack.pmtilesPath,
        updated_at: pack.updatedAt,
      },
      pack.data,
    );
    newPack.downloadedAt = pack.downloadedAt;
    return newPack;
  }

  // Unzips a freshly-downloaded pack archive once, up front, so later reads
  // (including on subsequent page loads) are plain blob lookups instead of
  // repeating the CPU-bound jszip decompression of the whole archive.
  static async fromZip(metadata: PackMetadata, zipBlob: Blob): Promise<Pack> {
    const data = await Pack.unzip(zipBlob);
    return new Pack(metadata, data);
  }

  private static async unzip(zipBlob: Blob): Promise<UnzippedPackData> {
    const zip = await jszip.loadAsync(zipBlob);
    const unzipped: UnzippedPackData = {};
    const zipPaths: string[] = [];
    zip.forEach(path => zipPaths.push(path));
    await Promise.all(zipPaths.map(async path => {
      const fname = path.split('/').pop();
      if (!fname || !zip.file(path) || zip.file(path)?.dir) {
        throw new Error(`Zip does not contain file: ${path}`);
      }
      const data = await zip.file(path)?.async('blob');
      if (!data) {
        throw new Error(`Path exists but is empty: ${path}`);
      }
      switch (fname) {
        case 'rocks.pmtiles':
          unzipped.rocks_pmtiles = data;
          break;
        case 'water.pmtiles':
          unzipped.water_pmtiles = data;
          break;
        case 'ways.pmtiles':
          unzipped.ways_pmtiles = data;
          break;
        case 'contours.pmtiles':
          unzipped.contours_pmtiles = data;
          break;
        case 'context.pmtiles':
          unzipped.context_pmtiles = data;
          break;
        case 'rocks-citations.csv':
          unzipped.rocks_citations_csv = data;
          break;
        case 'rocks-rock_units_attrs.csv':
          unzipped.rocks_units_csv = data;
          break;
        case 'water-citations.csv':
          unzipped.water_citations_csv = data;
          break;
        case 'water-waterways-network.csv':
          unzipped.water_waterways_network_csv = data;
          break;
      }
    }));
    return unzipped;
  }

  unzippedData(): Promise<UnzippedPackData> {
    if (!this.data) throw new Error('No unzipped data available');
    return Promise.resolve(this.data);
  }
}
