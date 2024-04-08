# Cognito Identity Broker Web Apps

This is the web applications for the Cognito Identity Broker project. The Cognito API stack can be found here:
[Cognito Identity Broker](https://github.com/jasonatepaint/cognito-identity-broker)

**This repo is broken into 2 React web apps:**
Both applications utilize the [cognito-sso-client](https://github.com/jasonatepaint/cognito-sso-client)
client library to facilitate the authentication process.

### 1. [SSO Broker](sso-broker)
This is the identity broker app that allows single sign and communicates with the `cognito-identity-broker` API.


### 2. [Client App](client-app)
An example client application that utilizes `sso-broker` that illustrates the Authorization Code Flow process.

## Getting Started

* Deploy the [Cognito Identity Broker](https://github.com/jasonatepaint/cognito-identity-broker) stack
* Deploy the [SSO Broker](sso-broker) 
* Deploy the [Client App](client-app)
* Navigate to the client application: http://localhost:3001


