# Shelby Story App - Dev by JackHan

This application allows users to share their moments with others. All content and data are securely stored on the Shelby network.

Demo : https://shelbystoryapp.onrender.com
## Prerequisites

- Node.js >= 22
- pnpm package manager
- A Shelby account with sufficient balance for blob storage
- Shelby API key
- Shelby account private key
- Shelby account address

## Installation

1. Clone the repository and navigate to the ShelbyStỏyApp directory:
   ```bash
   https://github.com/han3zzz/ShelbyStoryApp
   ```

2. Install dependencies:
   ```bash
   npm install
   npm install jsonwebtoken
   npm install --save-dev @types/express
   npm install express-rate-limit
   ```

## Environment Variables

Create a `.env` file in the root of this project directory with the following required environment variables. You can copy the `.env.example` file as a starting point:

```bash
cp .env.example .env
```

Then update the values in your `.env` file:

```env
SHELBY_ACCOUNT_PRIVATE_KEY=your_private_key_here
SHELBY_API_KEY=your_api_key_here
SHELBY_ACCOUNT_ADDRESS=your_address_wallet_here
JWT_SECRET=your_secret_key
```

More information on obtaining an API key on the [Shelby docs site](https://docs.shelby.xyz/sdks/typescript/acquire-api-keys).


## Usage

Run the project using the `shelbystory` script:

```bash
pnpm shelbystory
```

This will execute the TypeScript file directly using tsx with the environment variables from your `.env` file.

### Alternative Execution

You can also run the TypeScript file directly using tsx:

```bash
npx tsx src/index.ts
```

## How It Works

1. **Environment Validation**: The app first validates that all required environment variables are set
2. **Client Initialization**: Creates a Shelby client instance connected to the Shelbynet network
3. **Account Setup**: Creates a signer using the private key from the environment variable
4. **File Reading**: Reads the specified file from the local filesystem
5. **Blob Upload**: Uploads the file to the Shelby account with the specified name and expiration time
6. **Success Confirmation**: Prints a success message when the upload completes

## Output

When successful, this example will:
- Read the blob to your Shelby address
- Upload the blob to your Shelby account
- Set an expiration time for the blob (30 days by default)
- Print progress messages to the console

## Troubleshooting

### Common Issues

1. **SHELBY_ACCOUNT_PRIVATE_KEY is not set in .env**
   - Verify your private key is correctly set in the `.env` file
   - Ensure there are no extra spaces or quotes around the private key

2. **SHELBY_API_KEY is not set in .env**
   - Verify your API key is correctly set in the `.env` file
   - Ensure there are no extra spaces or quotes around the API key

3. **Blob already exists (EBLOB_WRITE_CHUNKSET_ALREADY_EXISTS)**
   - This blob has already been uploaded to your account
   - Consider changing the `BLOB_NAME` or deleting the existing blob first

4. **Insufficient balance for transaction fee (INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE)**
   - Your account doesn't have enough APT to pay for the transaction fee
   - Add more APT tokens to your account using [the faucet](https://docs.shelby.xyz/apis/faucet/aptos)

5. **Insufficient funds for blob storage (EBLOB_WRITE_INSUFFICIENT_FUNDS)**
   - Your account doesn't have enough Shelby tokens to pay for blob storage
   - Add more Shelby tokens to your account using [the faucet](https://docs.shelby.xyz/apis/faucet/shelbyusd)

6. **Rate limit exceeded (429)**
   - Wait a moment before retrying
   - Consider implementing exponential backoff for production use

7. **Server errors (500)**
   - This indicates an issue with the Shelby service
   - Contact Shelby support if this occurs repeatedly
