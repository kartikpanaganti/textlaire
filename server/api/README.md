# Server API Services

This folder contains service modules that implement the core business logic of the application. These services are used by the route handlers to process requests and interact with the database.

## Security Benefits

By moving API logic from the client to the server:

1. **Sensitive operations are protected** - API keys and authentication details are stored securely on the server
2. **Data validation happens server-side** - More secure than client-side validation
3. **Business logic is hidden** - Prevents exposure of internal workings in client-side code
4. **Centralized access control** - All requests go through proper authentication/authorization

## Available Services

- **falService.js** - Handles interactions with the fal.ai image generation API
- **patternService.js** - Manages pattern storage, retrieval, and deletion
- **attendanceService.js** - Handles attendance record processing

## Usage

These services should be imported by route handlers rather than being accessed directly from client-side code. For example:

```javascript
import { getAllPatterns } from '../api/patternService.js';

router.get('/patterns', async (req, res) => {
  try {
    const patterns = await getAllPatterns();
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
``` 