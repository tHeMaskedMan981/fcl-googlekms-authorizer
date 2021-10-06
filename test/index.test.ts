import { GoogleKmsAuthorizer } from '../src/index';
import { Util } from './utils';
import * as fcl from '@onflow/fcl';
import * as dotenv from "dotenv";
dotenv.config();

// extracting the key configuration from .env file for test
const projectId = process.env.PROJECT_ID!;
const locationId = process.env.LOCATION_ID!;
const keyRingId = process.env.KEY_RING_ID!;
const keyId = process.env.KEY_ID!;
const versionId = process.env.VERSION_ID!;

// Test transaction
const transaction = `
transaction {
  prepare(signer: AuthAccount) {
    log("Test transaction signed by fcl-googlekms-authorizer")
  }
}
`;

const flowAccessNodeUrl = 'http://localhost:8080';

// output of 'flow keys decode pem --from-file publicKey.pub'
const publicKey = '6d6a2852b0976ea23f7a6e2ebd34b1ed4b21f099c53f85052d27432cd2a81acfb7905c764d5dc4bf667c65dad20790a6c99392aa0a4fc3d7f1711f2de6486631';


// start an emulator before running the test using 'flow emulator -v'
describe('GoogleKmsAuthorizer', () => {
  test('transaction signed by GoogleKmsAuthorizer should succeed', async () => {

    const util = new Util(flowAccessNodeUrl);
    const address = await util.createFlowAccount(publicKey);
    const keyIndex = 0;

    const authorizer = new GoogleKmsAuthorizer(projectId, locationId, keyRingId, keyId, versionId);


    const authorization = authorizer.authorize(address, keyIndex);
    expect(typeof authorization).toBe('function');

    fcl.config().put('accessNode.api', flowAccessNodeUrl);
    const response = await fcl.send([
      fcl.transaction`${transaction}`,
      fcl.args([]),
      fcl.proposer(authorization),
      fcl.authorizations([authorization]),
      fcl.payer(authorization),
      fcl.limit(9999),
    ]);
    const res = await fcl.tx(response).onceSealed();
    expect(res.statusCode).toBe(0);
  });
})