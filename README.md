# LinkedIn Profile Extractor API

An Express API that accepts a public LinkedIn profile URL, extracts its profile identifier, requests selected profile-card sections, and returns the extracted text.

## Requirements

- Node.js 18 or later (the project uses the built-in `fetch` API)
- An authenticated LinkedIn session configured through environment variables

## Setup

Install dependencies:

```powershell
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
CSRF_TOKEN=ajax:your-csrf-token
COOKIE=your-linkedin-session-cookie
GEMINI_API_KEY=your-gemini-api-key
```

`GEMINI_API_KEY` is used by the LLM parser to convert the trimmed React Server Components (RSC) response text into structured profile data. Do not commit `.env` or expose cookies, CSRF tokens, or API keys.

Start the API:

```powershell
npm start
```

For automatic restarts while developing:

```powershell
npm dev
```

Deployed API endpoint: `https://challenge-z1of.onrender.com/api/profile-identifier`

## API

### Extract profile information

```text
POST https://challenge-z1of.onrender.com/api/profile-identifier
Content-Type: application/json
```

Request body:

```json
{
  "profileUrl": "https://www.linkedin.com/in/vamsidhar-kalaga-7738b8230/"
}
```

Successful response:

```json
{
  "success": true,
  "profileIdentifier": "vamsidhar-kalaga-7738b8230",
  "profileInformation": {
    "ActivityData": "...",
    "AboutData": "...",
    "ExperienceOnlyData": "...",
    "SkillsData": "..."
  }
}
```

`profileInformation` also includes the `BelowActivityPart2` through `BelowActivityPart6` sections returned by the upstream client.

Example cURL request:

```powershell
curl.exe -X POST https://challenge-z1of.onrender.com/api/profile-identifier `
  -H "Content-Type: application/json" `
  -d "{\"profileUrl\":\"https://www.linkedin.com/in/vamsidhar-kalaga-7738b8230/\"}"
```

## Errors

| Status | Meaning |
| --- | --- |
| `400` | The body is invalid JSON, `profileUrl` is missing, or it is not a LinkedIn `/in/<identifier>` URL. |
| `502` | The LinkedIn client request or response parsing failed. Check the server terminal for the error message and verify the session configuration. |

## Project structure

```text
src/
  app.js                         Express configuration and route mounting
  server.js                      Server entry point and environment loading
  routes/profileExtract.js       POST endpoint definition
  controller/profileExtract.js   URL validation and response handling
  services/linkedInApiClient.js  Coordinates profile-section requests
  utils/apiFetcher.js            Makes and parses upstream profile requests
  utils/rscTrimmer.js            Extracts usable text from RSC response data
  utils/llmParser.js             Gemini parser that formats RSC text as structured data
```

## How the LinkedIn Requests Were Identified

The LinkedIn request flow was reverse engineered by inspecting the browser DevTools Network tab while viewing a profile. The network entries revealed the internal component endpoints, request method, payload structure, and required authenticated-session headers such as cookies and CSRF tokens.

This service calls LinkedIn internal APIs to retrieve profile information. One example component endpoint is:

```text
https://www.linkedin.com/flagship-web/rsc-action/actions/component?componentId=com.linkedin.sdui.generated.profile.dsl.impl.profileCardsBelowActivityPart1WithoutExp&sduiid=com.linkedin.sdui.generated.profile.dsl.impl.profileCardsBelowActivityPart1WithoutExp
```

The request payload supplies the extracted LinkedIn vanity profile identifier as `vanityName`, allowing the component request to target the requested profile:

```json
{
  "clientArguments": {
    "payload": {
      "isSelfView": false,
      "vanityName": "vamsidhar-kalaga-7738b8230"
    }
  }
}
```

## Notes

- This project uses authenticated LinkedIn browser-session values. They can expire and should be treated as sensitive credentials.
- The upstream request shape, required headers, and available profile sections can change, so the client may need maintenance when LinkedIn changes its web application.
- Use this project only in accordance with LinkedIn's terms and applicable law.
