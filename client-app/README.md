# Client Application
This is a generic client application that utilizes the identity broker for authentication.


### Prerequisites
This is web portion of the Cognito Identity Broker project. The serverless API stack can be found here:
https://github.com/jasonatepaint/cognito-identity-broker.  

**Note: You must deploy this stack first and make note of your Client Application ID**

## Setup
1. Copy `.env.template` to `.env` and set the following values:
    - `VITE_CLIENT_ID` - This will be your Cognito Client Application for `Client 1` 
2. Run the following commands to start the dev server
   ```shell
   npm install
   npm run dev
   ```
3. Navigate to:  http://localhost:3000


## How it works

* details about the iFrame and it's configuration
