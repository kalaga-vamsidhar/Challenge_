# LinkedIn Profile Identifier API

Install dependencies and start the service:

```powershell
npm.cmd install
npm.cmd start
```

Send a `POST` request to `http://localhost:3000/api/profile-identifier` with JSON:

```json
{
  "profileUrl": "https://www.linkedin.com/in/kriti-jaiswal1-/"
}
```

Successful response:

```json
{
  "success": true,
  "profileIdentifier": "kriti-jaiswal1-"
}
```

The endpoint returns `400 Bad Request` when `profileUrl` is missing or is not a LinkedIn `/in/<identifier>` profile URL.
