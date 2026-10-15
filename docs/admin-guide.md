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
- **Live Preview** (the toggle at the top of the editor) shows the page beside the form, at phone, tablet or desktop size. Until Phase 3 it shows the *published* version, not your draft.

**Reorder** projects or experience: open the list and drag a row by its handle. Dragging only works while the list isn't sorted by a column; tap the column header until the sort is cleared. The site uses this order. If a project has an unpublished draft, its new position goes live when you publish.

**Upload images.** Content → Media → Create new, or upload straight from an image field.
- **Alt text is required.** Describe what the image shows, e.g. "Abroadly home page: Study abroad with confidence". For a diagram, describe the flow in words.
- Upload WebP, ideally under 200 KB (4 MB is the hard limit). Project covers: 1600 × 1000. Phone shots: about 560 px wide. The site resizes images for each screen itself.

**Upload the résumé.** Settings → Profile → Links tab → Résumé (PDF) → upload the new PDF → Save. `/resume` then serves it.

**Read messages.** Inbox → Messages. "Unread" / "All" at the top switches the view. Open a message and tick **Read** once you've handled it. To reply, email the sender. You can't create or edit messages; they only come from the contact form.

**Other settings.** Profile (who you are, links, Now line, availability) and Site settings (template, SEO defaults, banner, contact form on/off) are under Settings.

## Don't

- **Don't create a second user.** The site allows exactly one account, and it will refuse a second one. To change your email or password, edit your own user (Settings → Users).
- **Don't rename the slug of a published project** without a good reason: old links to `/work/<slug>` break.
- Don't delete media that a project, the profile or the settings still use. The image disappears from the site.
- Don't paste secrets (passwords, API keys) into any field. Everything in Profile and Site settings is public.
