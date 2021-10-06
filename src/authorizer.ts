import * as fcl from '@onflow/fcl';
import { Signer } from './signer';

export class GoogleKmsAuthorizer {
  private readonly signer: Signer;

  public constructor(projectId:string, locationId:string, keyRingId:string, keyId:string, versionId:string) {
    this.signer = new Signer(projectId, locationId, keyRingId, keyId, versionId);
  }

  public authorize(accountAddress: string, keyIndex: number) {
    return async (account: any = {}) => {
      return {
        ...account,
        tempId: [accountAddress, keyIndex].join("-"),
        addr: fcl.sansPrefix(accountAddress),
        keyId: Number(keyIndex),
        resolve: null,
        signingFunction: async(data: any) => {
          return {
            addr: fcl.withPrefix(accountAddress),
            keyId: Number(keyIndex),
            signature: await this.signer.sign(data.message)
          };
        }
      };
    };
  };
}