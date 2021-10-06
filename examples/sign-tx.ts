import * as fcl from '@onflow/fcl';
import { GoogleKmsAuthorizer } from '../src/authorizer';

// Key configuration
const projectId = '<google cloud project Id>';
const locationId = '<location of the project>';
const keyRingId = '<key Ring Id>';
const keyId = '<keyId>';
const versionId = '<versionId>';

// Test transaction
const transaction = `
transaction {
  prepare(signer: AuthAccount) {
    log("Test transaction signed by fcl-googlekms-authorizer")
  }
}
`;

const apiUrl = 'http://localhost:8080';
fcl.config().put('accessNode.api', apiUrl);


async function main() {

  // Create an instance of the authorizer
  const authorizer = new GoogleKmsAuthorizer(
      projectId,
      locationId,
      keyRingId,
      keyId,
      versionId
  );

  // account address to use. To create a new account, download public key from google cloud console in pem format,
  // convert in hex using 'flow keys decode pem --from-file <filename>' in terminal. Use this public key to 
  // create a new account in emulator or testnet. To create a new account using this public key, use 
  // 'flow accounts create --key=<hex-encoded-public-key>'. use '--network=testnet' to create account on testnet  
  const address = '01cf0e2f2f715450';
  const keyIndex = 0;


  // Sign and send transactions with Google KMS
  const authorization = authorizer.authorize(address, keyIndex);

  const response = await fcl.send([
    fcl.transaction`${transaction}`,
    fcl.args([]),
    fcl.proposer(authorization),
    fcl.authorizations([authorization]),
    fcl.payer(authorization),
    fcl.limit(9999),
  ]);
  await fcl.tx(response).onceSealed();

  console.log('Transaction Succeeded');
}

main().catch(e => console.error(e));