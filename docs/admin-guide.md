# Admin guide

The admin lives at **`/admin`** on the site (e.g. `https://<your-domain>/admin`). It works on a phone.

**Log in** with your email and password. Five wrong tries lock the account for 15 minutes. You stay signed in for 8 hours.

**Dashboard** (the first screen):
- **Inbox**: how many messages are unread, and the newest three. Tap one to open it.
- **Availability**: tap Open, Limited or Closed. The site updates right away. The badge text stays the same, so edit it in Profile → Status if it no longer fits.
- **Quick links**: view the site, preview, résumé, messages, projects, new project.
- To rearrange the dashboard, use the menu next to "Dashboard" at the top. "Reset layout" restores the default.

**Edit a project.** Content → Projects → tap the project. Change the fields, then:
- **Save draft** keeps your changes private. The site still shows the last published version.
- **Publish** puts the changes on the site. Changes show on the next page load; you don't need to redeploy.
- Tick **Has a case study** to give the project its own page at `/work/<slug>`, then fill in the five short sections.
- **Live Preview** (the toggle at the top of the editor) shows the page beside the form, at phone, tablet or desktop size. It shows your **draft** and refreshes each time you press Save draft or Publish; visitors still see the published version. A dark bar at the bottom of the preview says so; "Exit preview" goes back to the published page. Start the preview from the admin, not from a link someone sent you.

**Reorder** projects or experience: open the list and drag a row by its handle. Dragging only works while the list isn't sorted by a column; tap the column header until the sort is cleared. The site uses this order. If a project has an unpublished draft, its new position goes live when you publish.

**Upload images.** Content → Media → Create new, or upload straight from an image field.
- **Alt text is required.** Describe what the image shows, e.g. "Abroadly home page: Study abroad with confidence". For a diagram, describe the flow in words.
- Upload WebP, ideally under 200 KB (4 MB is the hard limit). Project covers: 1600 × 1000. Phone shots: about 560 px wide. The site resizes images for each screen itself.

**Upload the résumé.** Settings → Profile → Links tab → Résumé (PDF) → upload the new PDF → Save. `/resume` then serves it.

**Read messages.** Inbox → Messages. "Unread" / "All" at the top switches the view. Open a message and tick **Read** once you've handled it. To reply, email the sender. You can't create or edit messages; they only come from the contact form.

**Other settings.** Profile (who you are, links, Now line, availability) and Site settings (template, SEO defaults, banner, contact form on/off) are under Settings.

## Locked out or lost the password

"Forgot password" in the login screen sends no email (no mail service is set up), so recovery runs from your own computer with the project checked out:

1. Locked after 5 wrong tries? Wait 15 minutes and try again. If it keeps locking (someone else is guessing), reset as below; it also clears the lock.
2. Put the **target environment's** `DATABASE_URI` and `PAYLOAD_SECRET` in `.env.local` (for production: the Atlas URI and the production secret from Vercel → Settings → Environment Variables). Run it locally, never on Vercel.
3. Run, with your login email and a new password of at least 12 characters:

   ```sh
   RESET_ADMIN_PASSWORD='a new long passphrase' npm run admin:reset-password -- you@example.com
   ```

   PowerShell: `$env:RESET_ADMIN_PASSWORD='a new long passphrase'; npm run admin:reset-password -- you@example.com`

4. It prints "Password reset for …". It never prints the password. Every open session is signed out, so log in again everywhere. Remove the production values from `.env.local` afterwards.

Use a login email that is **not** the public one shown on the site: anyone who knows the login email can keep the account locked by guessing wrong 5 times every 15 minutes. Change it in Settings → Users.

**First deploy.** A deployment on Vercel never offers "create the first user" to visitors. Create the admin before connecting the database: run `npm run seed` locally with the Atlas `DATABASE_URI` and `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` set. (`ALLOW_FIRST_USER=1` on Vercel re-opens the browser sign-up for one deploy; remove it right after.)

## Don't

- **Don't create a second user.** The site allows exactly one account, and it will refuse a second one. To change your email or password, edit your own user (Settings → Users).
- **Don't rename the slug of a published project** without a good reason: old links to `/work/<slug>` break.
- Don't delete media that a project, the profile or the settings still use. The image disappears from the site.
- Don't paste secrets (passwords, API keys) into any field. Everything in Profile and Site settings is public.
