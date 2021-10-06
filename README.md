# fcl-googlekms-authorizer

Google KMS authorizer (signer) for Flow blockchain.


## Installation

```bash
npm i fcl-googlekms-authorizer
```

## Usage 

```js

import * as fcl from '@onflow/fcl';
import { GoogleKmsAuthorizer } from 'fcl-googlekms-authorizer';

// Key configuration. Store it in env variables or secret manager
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

async function main() {

  // Create an instance of the authorizer
  const authorizer = new GoogleKmsAuthorizer(
      projectId,
      locationId,
      keyRingId,
      keyId,
      versionId
  );

  // address created using public key downloaded from google kms
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
```

see `sign-tx.ts` in examples folder for complete example.

## Google KMS setup

Note: In order to use fcl-googlekms-authorizer for remote key management, you'll need a Google Cloud Platform account.

Pre-requisites:

1. Create a new Project if you don't have one already. You'll need the Project ID later.
2. Enable Cloud Key Management Service (KMS) API for the project, Security -> [Cryptographic Keys](https://console.cloud.google.com/security/kms).
3. Create a new Key Ring for your wallet (or use an existing Key Ring), Security -> Cryptographic Keys -> [Create Key Ring](https://console.cloud.google.com/security/kms/keyring/create), you'll need the Location ID (or _Location_) and Key Ring ID (or _Name_) later.

Using a Service Account to access the KMS API (see [official docs](https://cloud.google.com/docs/authentication/getting-started) for more);

1. Create a new Service Account, IAM & Admin -> Service Accounts -> [Create Service Account](https://console.cloud.google.com/iam-admin/serviceaccounts/create)
2. Use the roles `Cloud KMS Admin` & `Cloud KMS Signer/Verifier` or grant the required permissions through a custom role (NOTE: deletion not supported yet):
   - `cloudkms.cryptoKeyVersions.useToSign`
   - `cloudkms.cryptoKeyVersions.viewPublicKey`
   - `cloudkms.cryptoKeys.create`
3. After creating the Service Account, select Manage Keys from the Actions menu in the Service Account listing.
4. Create a new key, Add Key -> Create New key, and select JSON as the key type.
5. Save the JSON file.

Configure the Google KMS client library by setting the environment variable `GOOGLE_APPLICATION_CREDENTIALS`:

```
export GOOGLE_APPLICATION_CREDENTIALS="/home/example/path/to/service-account-file.json"
```

**Creating an account on testnet via the faucet:**

1. When generating the key on Google KMS, choose "Asymmetric sign" as the purpose and "Elliptic Curve P-256 - SHA256 Digest" as the key type and algorithm (other combinations may work but these have been confirmed to work)
2. Download the public key from Google KMS in PEM format (should have a `.pub` ending)
3. Run it through `flow keys decode pem --from-file <filename>`
4. Copy the "Public Key" part
5. Go to https://testnet-faucet-v2.onflow.org
6. Paste the copied public key in the form
7. **IMPORTANT**: Choose **SHA2_256** as the hash algorithm (_SHA3_256_ won't work with the key setup above)

Store the generated address and use it while creating the authorization - 
```js
const authorization = authorizer.authorize(accountAddress, keyIndex);
```

### Credits 
This fcl compatible Google KMS authorizer is built taking inspiration from <a href="https://github.com/doublejumptokyo/fcl-kms-authorizer">fcl-kms-authorizer</a>