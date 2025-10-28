# Be4Real API Docs

## Authentication
Private user-related endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <YOUR_TOKEN>
```

Tokens are obtained from `/api/auth/login` or `/api/auth/verify-user` endpoints.

---

## Response Format
All endpoints return JSON. In general, these are how responses are formatted:

**Success:**
```json
{
  "status": "success",
  "message": "Description of what happened",
  "data": { ... }  // contains response data (not standard between all endpoints)
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Description of the error"
}
```

---

## Developer Notes

### TO-DO / Limitations
- Verification codes are logged to console (not sent to email yet)

### API Calls
- Make sure the HTTP request method is set correctly (refer to `Postman` or `server.ts` for what these should be).
  - ex. in `server.ts`, `app.post(...)` sets said endpoint to accept POST requests.
  
### JWT Token Format
JWT tokens are base64-encoded strings with three parts separated by dots:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
```

### Image Storage
Images are sent and stored in the database as base64-encoded strings with a data URI prefix. The format is:
```
data:image/<FORMAT>;base64,<BASE64_ENCODED_DATA>
```

**Example:**
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...
```

**Client-side encoding:**
Images must be converted to base64 before sending to the API. `FileReader`'s `readAsDataURL()` method can handle this:
```javascript
const reader = new FileReader();
reader.readAsDataURL(file);  // converts to base64 with data URI prefix
reader.onload = () => {
  const imgData = reader.result;  // "data:image/png;base64,..."
  // send imgData to API
};
```

**Storage:**
- Images are stored directly in MongoDB as strings in the `posts` collection.
  - each post document has an 'imgData' field with the string.

### Route Parameters
Some endpoints use route parameters. These are put into the API URL path itself, not in the request body.

**Format:** `/api/resource/:parameterName`

Where `:parameterName` defines a variable for the endpoint to use.