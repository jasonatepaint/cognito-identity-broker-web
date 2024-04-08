# Client Application
This example client application illustrates the authentication processes which utilizes the
[cognito-sso-client](https://github.com/jasonatepaint/cognito-sso-client) client library.
This removes 99% of the work for each client application, eliminating the need to implement the functionality
a robust identity broker can provide.

### Prerequisites
* [Cognito Identity Broker](https://github.com/jasonatepaint/cognito-identity-broker)

## Setup
1. Copy `.env.template` to `.env` and set the following values:
    - `VITE_CLIENT_ID` - This will be your Cognito Client Application for `Client 1` 
2. Run the following commands to start the dev server
   ```shell
   npm install
   npm run dev
   ```
3. Start the [SSO Broker](../sso-broker) App
4. Navigate to the Client App:  http://localhost:3001

   Your first visit will result in a redirect to the SSO Broker (http://localhost:3000). The redirected URL will have a
   long querystring that includes the following attributes:
     - `clientId` -- The client app's unique ID
     - `redirectUri` -- The registered redirectUri for the client app. This is where the broker will redirect back
     - `codeChallenge` -- A calculated hash value that will be later used to verify the code flow process when the client exchanges the `code` for tokens
     - `state` -- This will be a Base64 encoded JSON string of anything the client wants to pass along (including a `referrer` url, which is automatically added)

<img src="../docs/client-app.png" alt="Client Application" width="1024">
---

## How it works
The application requires very limited coding to implement the authentication process. All of the required code
exists in [App.tsx](src/App.tsx). 

#### The main parts include:
1. Adding an iframe to the html.
2. Initializing the client library
3. Registering a callback for responses from the broker
4. Responding to responses from the broker.

##### The special sauce
Most of the magic happens via the SSO client library and an invisible `<iframe>`. 
To allow a secure communication channel between the client application and the sso broker, an invisible `<iframe>` is 
placed in the client application. Once loaded, the client and broker communicate via 
[window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) protocol.

```typescript jsx
<iframe
    style={{ display: "none" }}
    ref={authFrameRef}
    id="authFrame"
    sandbox="allow-same-origin allow-scripts"
    src={BROKER_CLIENT_URL}
></iframe>
```

Once the `cognito-sso-client` lib is initialized, the application will attempt to authenticate with the broker causing
a hard redirect to the broker.

#### Client App examples
* `Authenticate` -- Will attempt to authenticate a user and will redirect (if option is selected) to the SSO broker to initiate the code flow process
* `Logout`- Will log the user out of the client app and the SSO broker and will redirect (if option is selected) to the SSO broker to re-authenticate.
* `Refresh Token` - Will attempt to refresh the user's `idToken` and `accessToken` if the refresh token is valid.
