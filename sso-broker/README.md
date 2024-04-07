# Cognito SSO Broker
This is the identity broker app that allows single sign

### Prerequisites
This is web portion of the Cognito Identity Broker project. The serverless API stack can be found here:
https://github.com/jasonatepaint/cognito-identity-broker.

**Note: You must deploy this stack first and make note of your Client Application ID**

## Setup
1. Copy `.env.template` to `.env` and set the following values:
    - `VITE_CLIENT_ID` - This will be your Cognito Client Application for `SSO Broker`
    - `VITE_USERNAME` - A valid username (email) in Cognito. (optional, this is just for auto-fill)
    - `VITE_PASSWORD` - The password for the user. (optional, this is just for auto-fill)
2. Run the following commands to start the dev server
   ```shell
   npm install
   npm run dev
   ```

## How it works

* details about the iFrame and it's configuration
