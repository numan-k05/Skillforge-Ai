# Search engine setup

SkillForge AI now generates crawlable HTML pages, canonical links, structured data, `robots.txt`, and `sitemap.xml` during the frontend production build. Search ranking is decided by each search engine, so a first-place result cannot be guaranteed.

## Production setup

1. Choose the final HTTPS domain for the site.
2. Create `frontend/.env.production` and set the exact public origin:

   ```env
   VITE_PUBLIC_SITE_URL=https://www.example.com
   ```

3. Build the frontend:

   ```powershell
   cd frontend
   npm.cmd run build
   ```

4. Deploy the contents of `frontend/dist`. Configure the host to serve generated route files such as `courses/index.html` and to use the SPA fallback for dynamic routes.
5. Confirm these URLs work after deployment:

   - `https://www.example.com/robots.txt`
   - `https://www.example.com/sitemap.xml`
   - `https://www.example.com/courses`

6. Verify the domain in Google Search Console and Bing Webmaster Tools, then submit `https://www.example.com/sitemap.xml` in both services.

## Ongoing search visibility

Keep course and skill descriptions accurate and useful, add original public learning content over time, fix broken external lesson links, and monitor indexing and search queries in the webmaster tools. Private account, payment, dashboard, and admin pages are marked to stay out of search results.

The public domain must be configured before the production build. A build that uses `http://localhost:5173` is suitable only for local development and must not be deployed as the public SEO build.
