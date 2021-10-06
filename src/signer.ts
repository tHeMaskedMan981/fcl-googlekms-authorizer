// Imports the Cloud KMS library
import {KeyManagementServiceClient} from '@google-cloud/kms';
import { parseSignature } from './asn1-parser';
import crypto from  'crypto';
import crc32c from 'fast-crc32c';

export class Signer {
  private readonly client: KeyManagementServiceClient;
  private readonly versionName: string;

  public constructor(projectId:string, locationId:string, keyRingId:string, keyId:string, versionId:string) {
    
    this.client = new KeyManagementServiceClient();
    this.versionName = this.client.cryptoKeyVersionPath(
        projectId,
        locationId,
        keyRingId,
        keyId,
        versionId
      );
  }

  public async sign(message: string): Promise<string> {
    const digest = this._hashMessage(message);
    const asn1Signature = await this._sign(digest);
    const { r, s } = parseSignature(asn1Signature);
    return Buffer.concat([this._pad32(r), this._pad32(s)]).toString('hex');
  }


  private _hashMessage(message: string): Buffer {
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(message, 'hex'));
    return hash.digest();
  }


  private async _sign(digest: Buffer) {

    // Optional but recommended: Compute digest's CRC32C.
    const digestCrc32c = crc32c.calculate(digest);

    // Sign the message with Cloud KMS
    const [signResponse] = await this.client.asymmetricSign({
        name: this.versionName,
        digest: {
        sha256: digest,
        },
        digestCrc32c: {
        value: digestCrc32c,
        },
    });

    // Optional, but recommended: perform integrity verification on signResponse.
    if (signResponse.name !== this.versionName) {
        throw new Error('AsymmetricSign: request corrupted in-transit');
    }
    if (!signResponse.verifiedDigestCrc32c) {
        throw new Error('AsymmetricSign: request corrupted in-transit');
    }
    if (
        crc32c.calculate(signResponse.signature) !==
        Number(signResponse.signatureCrc32c?.value)
    ) {
        throw new Error('AsymmetricSign: response corrupted in-transit');
    }

    return Buffer.from(signResponse.signature!);
  }
  

  private _pad32(buf: Buffer): Buffer {
    const paddedBuf = Buffer.alloc(32);
    buf.copy(paddedBuf, paddedBuf.length - buf.length);
    return paddedBuf;
  }
}